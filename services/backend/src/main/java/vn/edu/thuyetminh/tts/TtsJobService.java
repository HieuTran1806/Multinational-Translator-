package vn.edu.thuyetminh.tts;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import vn.edu.thuyetminh.audio.AudioAsset;
import vn.edu.thuyetminh.audio.AudioService;
import vn.edu.thuyetminh.audio.AudioView;
import vn.edu.thuyetminh.common.Hashing;
import vn.edu.thuyetminh.common.config.AppProperties;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.language.Language;
import vn.edu.thuyetminh.language.LanguageService;
import vn.edu.thuyetminh.poi.PoiTranslation;
import vn.edu.thuyetminh.poi.PoiTranslationStore;

/**
 * Asynchronous TTS generation backed by the {@code audio_generation_job} table.
 * <ol>
 *   <li>{@link #requestGeneration} validates and enqueues (or reuses existing audio / an active job);</li>
 *   <li>{@link TtsJobWorker} calls {@link #processNextDueJob()} periodically;</li>
 *   <li>the provider is called OUTSIDE a DB transaction; results are stored in a second transaction;</li>
 *   <li>if the narration changed while the job ran, the result is discarded (never attached to new text).</li>
 * </ol>
 */
@Service
public class TtsJobService {

    private static final Logger log = LoggerFactory.getLogger(TtsJobService.class);
    private static final List<JobStatus> ACTIVE = List.of(JobStatus.QUEUED, JobStatus.RUNNING);

    private final AudioGenerationJobStore jobs;
    private final PoiTranslationStore translations;
    private final LanguageService languages;
    private final AudioService audioService;
    private final TtsProvider provider;
    private final AppProperties props;
    private final Clock clock;
    private final TransactionTemplate tx;

    public TtsJobService(AudioGenerationJobStore jobs, PoiTranslationStore translations,
                         LanguageService languages, AudioService audioService, TtsProvider provider,
                         AppProperties props, Clock clock, PlatformTransactionManager txManager) {
        this.jobs = jobs;
        this.translations = translations;
        this.languages = languages;
        this.audioService = audioService;
        this.provider = provider;
        this.props = props;
        this.clock = clock;
        this.tx = new TransactionTemplate(txManager);
    }

    public record TtsStatus(boolean configured, String provider, int maxInputBytes) {
    }

    public TtsStatus status() {
        return new TtsStatus(provider.isConfigured(), provider.name(), props.tts().maxInputBytes());
    }

    @Transactional
    public TtsJobView requestGeneration(Long poiId, String languageCode, Long requestedBy) {
        if (!provider.isConfigured()) {
            throw new ApiException(ErrorCode.TTS_NOT_CONFIGURED,
                    "Dịch vụ Google Cloud TTS chưa được cấu hình trên máy chủ. Hãy tải file audio lên thay thế.");
        }
        PoiTranslation t = translations.findByPoiAndLanguage(poiId, languageCode)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND,
                        "Chưa có nội dung ngôn ngữ '" + languageCode + "' cho địa điểm này"));
        int bytes = t.getNarrationText().getBytes(StandardCharsets.UTF_8).length;
        if (bytes > props.tts().maxInputBytes()) {
            throw new ApiException(ErrorCode.TTS_TEXT_TOO_LONG, "Nội dung thuyết minh dài " + bytes
                    + " byte, vượt giới hạn " + props.tts().maxInputBytes() + " byte cho một lần tạo TTS");
        }
        Language lang = languages.requireEnabled(languageCode);
        String voice = lang.getDefaultTtsVoice();
        String hash = contentHash(provider.name(), lang.getTtsLanguageCode(), voice, t.getNarrationText());

        // 1) identical audio already exists and is current -> do not call the provider again
        Optional<AudioAsset> existing = audioService.findReadyByContentHash(t.getId(), hash)
                .filter(a -> a.getContentVersion() == t.getContentVersion());
        if (existing.isPresent()) {
            AudioAsset a = existing.get();
            return new TtsJobView(null, JobStatus.SUCCEEDED, languageCode, t.getContentVersion(), 0, 0, null,
                    null, AudioView.adminView(a, true), true, a.getCreatedAt(), a.getCreatedAt());
        }
        // 2) an equivalent job is already queued/running -> return it
        Optional<AudioGenerationJob> active = jobs.findActive(t.getId(), hash, ACTIVE);
        if (active.isPresent()) {
            return toView(active.get());
        }
        AudioGenerationJob job = jobs.save(new AudioGenerationJob(t.getId(), t.getContentVersion(), hash,
                languageCode, voice, props.tts().maxAttempts(), requestedBy, clock.instant()));
        log.info("TTS job {} queued for translation {} ({})", job.getId(), t.getId(), languageCode);
        return toView(job);
    }

    @Transactional(readOnly = true)
    public TtsJobView getJob(Long id) {
        return jobs.findById(id).map(this::toView).orElseThrow(() -> ApiException.notFound("Tác vụ TTS"));
    }

    @Transactional(readOnly = true)
    public Optional<TtsJobView> latestForTranslation(Long translationId) {
        return jobs.findLatestForTranslation(translationId).map(this::toView);
    }

    /**
     * Processes at most one due job. Returns true if a job was processed.
     * Public so that tests (and an optional admin trigger) can run it synchronously.
     */
    public boolean processNextDueJob() {
        // Tx 1: claim
        AudioGenerationJob claimed = tx.execute(s -> jobs.lockNextDue(clock.instant()).map(j -> {
            j.start(clock.instant());
            return jobs.save(j);
        }).orElse(null));
        if (claimed == null) {
            return false;
        }
        Long jobId = claimed.getId();

        // Load input (read-only)
        record Input(String text, String ttsLang, String voice, int version) {
        }
        Input input = tx.execute(s -> translations.findById(claimed.getTranslationId()).map(t -> new Input(
                t.getNarrationText(), languages.requireEnabled(claimed.getLanguageCode()).getTtsLanguageCode(),
                claimed.getTtsVoice(), t.getContentVersion())).orElse(null));
        if (input == null) {
            finishFailed(jobId, "TRANSLATION_DELETED", "Nội dung đã bị xoá");
            return true;
        }
        if (input.version() != claimed.getContentVersion()) {
            finishFailed(jobId, "CONTENT_CHANGED", "Nội dung đã thay đổi trước khi tạo audio; hãy yêu cầu lại");
            return true;
        }

        // Call provider outside any transaction
        TtsProvider.TtsResult result;
        try {
            result = provider.synthesize(new TtsProvider.TtsRequest(input.text(), input.ttsLang(), input.voice()));
        } catch (TtsException e) {
            handleProviderError(jobId, e);
            return true;
        } catch (RuntimeException e) {
            log.error("Unexpected TTS provider error for job {}", jobId, e);
            handleProviderError(jobId, new TtsException("TTS_ERROR", "Lỗi không xác định khi tạo audio", true, e));
            return true;
        }

        // Tx 2: store result only if the content is still the same version
        tx.executeWithoutResult(s -> {
            AudioGenerationJob job = jobs.findById(jobId).orElseThrow();
            PoiTranslation t = translations.findById(job.getTranslationId()).orElse(null);
            if (t == null) {
                job.fail("TRANSLATION_DELETED", "Nội dung đã bị xoá", clock.instant());
            } else if (t.getContentVersion() != job.getContentVersion()) {
                job.fail("CONTENT_CHANGED", "Nội dung đã thay đổi trong lúc tạo audio; kết quả cũ bị huỷ",
                        clock.instant());
            } else {
                AudioAsset asset = audioService.storeTts(t, job.getContentVersion(), result.audio(),
                        job.getContentHash(), result.voiceUsed());
                job.succeed(asset.getId(), clock.instant());
                log.info("TTS job {} succeeded -> audio asset {}", jobId, asset.getId());
            }
            jobs.save(job);
        });
        return true;
    }

    private void handleProviderError(Long jobId, TtsException e) {
        tx.executeWithoutResult(s -> {
            AudioGenerationJob job = jobs.findById(jobId).orElseThrow();
            if (e.isRetryable() && job.canRetry()) {
                Duration backoff = Duration.ofSeconds(5L * (1L << Math.min(job.getAttempts() - 1, 6)));
                job.retryLater(e.getCode(), e.getMessage(), clock.instant().plus(backoff));
                log.warn("TTS job {} attempt {}/{} failed ({}); retry in {}s", jobId, job.getAttempts(),
                        job.getMaxAttempts(), e.getCode(), backoff.toSeconds());
            } else {
                job.fail(e.getCode(), e.getMessage(), clock.instant());
                log.warn("TTS job {} failed permanently ({})", jobId, e.getCode());
            }
            jobs.save(job);
        });
    }

    private void finishFailed(Long jobId, String code, String message) {
        tx.executeWithoutResult(s -> jobs.findById(jobId).ifPresent(j -> {
            j.fail(code, message, clock.instant());
            jobs.save(j);
        }));
    }

    /** Re-queues jobs left RUNNING by a previous process. */
    public void recoverOnStartup() {
        recoverInterruptedJobs(clock.instant());
    }

    /** Periodic safety net for multi-instance setups: RUNNING longer than the threshold = interrupted. */
    public void recoverStaleRunning() {
        recoverInterruptedJobs(clock.instant().minus(props.tts().staleRunningAfter()));
    }

    void recoverInterruptedJobs(Instant startedBefore) {
        tx.executeWithoutResult(s -> {
            for (AudioGenerationJob j : jobs.findInterrupted(JobStatus.RUNNING, startedBefore)) {
                if (j.canRetry()) {
                    j.retryLater("INTERRUPTED", "Tác vụ bị gián đoạn (máy chủ khởi động lại); đã xếp hàng lại",
                            clock.instant());
                } else {
                    j.fail("INTERRUPTED", "Tác vụ bị gián đoạn và đã hết số lần thử", clock.instant());
                }
                jobs.save(j);
                log.warn("Recovered interrupted TTS job {} -> {}", j.getId(), j.getStatus());
            }
        });
    }

    private TtsJobView toView(AudioGenerationJob j) {
        AudioView audio = j.getAudioAssetId() == null ? null
                : audioService.findById(j.getAudioAssetId()).map(a -> AudioView.adminView(a, false)).orElse(null);
        return new TtsJobView(j.getId(), j.getStatus(), j.getLanguageCode(), j.getContentVersion(), j.getAttempts(),
                j.getMaxAttempts(), j.getErrorCode(), j.getErrorMessage(), audio, false, j.getCreatedAt(),
                j.getFinishedAt());
    }

    static String contentHash(String provider, String ttsLang, String voice, String text) {
        return Hashing.sha256Hex(provider + "\u0000" + ttsLang + "\u0000" + (voice == null ? "" : voice)
                + "\u0000MP3\u0000" + text);
    }
}
