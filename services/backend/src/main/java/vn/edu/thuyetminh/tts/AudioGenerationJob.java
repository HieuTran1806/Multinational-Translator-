package vn.edu.thuyetminh.tts;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/** Durable TTS job; state survives restarts (see {@link TtsJobService#recoverInterruptedJobs}). */
@Entity
@Table(name = "audio_generation_job")
public class AudioGenerationJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "translation_id", nullable = false)
    private Long translationId;

    @Column(name = "content_version", nullable = false)
    private int contentVersion;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode;

    @Column(name = "tts_voice", length = 80)
    private String ttsVoice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private JobStatus status = JobStatus.QUEUED;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts;

    @Column(name = "next_attempt_at", nullable = false)
    private Instant nextAttemptAt;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "audio_asset_id")
    private Long audioAssetId;

    @Column(name = "requested_by")
    private Long requestedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AudioGenerationJob() {
    }

    public AudioGenerationJob(Long translationId, int contentVersion, String contentHash, String languageCode,
                              String ttsVoice, int maxAttempts, Long requestedBy, Instant now) {
        this.translationId = translationId;
        this.contentVersion = contentVersion;
        this.contentHash = contentHash;
        this.languageCode = languageCode;
        this.ttsVoice = ttsVoice;
        this.maxAttempts = maxAttempts;
        this.requestedBy = requestedBy;
        this.nextAttemptAt = now;
    }

    @PrePersist
    void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    void start(Instant now) {
        status = JobStatus.RUNNING;
        attempts++;
        startedAt = now;
    }

    void succeed(Long assetId, Instant now) {
        status = JobStatus.SUCCEEDED;
        audioAssetId = assetId;
        errorCode = null;
        errorMessage = null;
        finishedAt = now;
    }

    void retryLater(String code, String message, Instant next) {
        status = JobStatus.QUEUED;
        errorCode = code;
        errorMessage = truncate(message);
        nextAttemptAt = next;
    }

    void fail(String code, String message, Instant now) {
        status = JobStatus.FAILED;
        errorCode = code;
        errorMessage = truncate(message);
        finishedAt = now;
    }

    boolean canRetry() {
        return attempts < maxAttempts;
    }

    private static String truncate(String s) {
        return s == null ? null : (s.length() > 500 ? s.substring(0, 500) : s);
    }

    public Long getId() {
        return id;
    }

    public Long getTranslationId() {
        return translationId;
    }

    public int getContentVersion() {
        return contentVersion;
    }

    public String getContentHash() {
        return contentHash;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public String getTtsVoice() {
        return ttsVoice;
    }

    public JobStatus getStatus() {
        return status;
    }

    public int getAttempts() {
        return attempts;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public Instant getNextAttemptAt() {
        return nextAttemptAt;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public Long getAudioAssetId() {
        return audioAssetId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }
}
