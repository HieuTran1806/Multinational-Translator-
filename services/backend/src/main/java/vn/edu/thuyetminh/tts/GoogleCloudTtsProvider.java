package vn.edu.thuyetminh.tts;

import java.time.Duration;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import jakarta.annotation.PreDestroy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.api.core.ApiFuture;
import com.google.api.gax.rpc.ApiException;
import com.google.api.gax.rpc.StatusCode;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.texttospeech.v1.AudioConfig;
import com.google.cloud.texttospeech.v1.AudioEncoding;
import com.google.cloud.texttospeech.v1.SynthesisInput;
import com.google.cloud.texttospeech.v1.SynthesizeSpeechRequest;
import com.google.cloud.texttospeech.v1.SynthesizeSpeechResponse;
import com.google.cloud.texttospeech.v1.TextToSpeechClient;
import com.google.cloud.texttospeech.v1.VoiceSelectionParams;

/**
 * Google Cloud Text-to-Speech via the official Java client.
 * <p>Authentication uses Application Default Credentials (ADC): set {@code GOOGLE_APPLICATION_CREDENTIALS}
 * to a service-account JSON file path mounted at runtime (never committed), or run on GCP with an attached
 * service account. If ADC cannot be resolved at startup the provider reports "not configured" and the
 * application keeps running.
 * <p>A single attempt is bounded by {@code app.tts.request-timeout}; retries are handled by the job queue.
 */
public class GoogleCloudTtsProvider implements TtsProvider {

    private static final Logger log = LoggerFactory.getLogger(GoogleCloudTtsProvider.class);

    private final Duration timeout;
    private final boolean configured;
    private volatile TextToSpeechClient client;

    public GoogleCloudTtsProvider(Duration timeout) {
        this.timeout = timeout;
        this.configured = detectCredentials();
    }

    private static boolean detectCredentials() {
        try {
            GoogleCredentials.getApplicationDefault();
            log.info("Google Cloud TTS: Application Default Credentials found");
            return true;
        } catch (Exception e) {
            // Do not log exception details: they may contain file paths of secrets.
            log.warn("Google Cloud TTS selected but no Application Default Credentials found; "
                    + "TTS requests will return TTS_NOT_CONFIGURED");
            return false;
        }
    }

    @Override
    public String name() {
        return "google";
    }

    @Override
    public boolean isConfigured() {
        return configured;
    }

    @Override
    public TtsResult synthesize(TtsRequest req) throws TtsException {
        if (!configured) {
            throw new TtsException("TTS_NOT_CONFIGURED", "Google Cloud TTS chưa được cấu hình", false);
        }
        VoiceSelectionParams.Builder voice = VoiceSelectionParams.newBuilder().setLanguageCode(req.languageCode());
        if (req.voiceName() != null && !req.voiceName().isBlank()) {
            voice.setName(req.voiceName());
        }
        SynthesizeSpeechRequest request = SynthesizeSpeechRequest.newBuilder()
                .setInput(SynthesisInput.newBuilder().setText(req.text()).build())
                .setVoice(voice.build())
                .setAudioConfig(AudioConfig.newBuilder().setAudioEncoding(AudioEncoding.MP3).build())
                .build();
        ApiFuture<SynthesizeSpeechResponse> future = null;
        try {
            future = client().synthesizeSpeechCallable().futureCall(request);
            SynthesizeSpeechResponse resp = future.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
            byte[] audio = resp.getAudioContent().toByteArray();
            if (audio.length == 0) {
                throw new TtsException("TTS_EMPTY_AUDIO", "Google TTS trả về audio rỗng", true);
            }
            return new TtsResult(audio, req.voiceName());
        } catch (TimeoutException e) {
            future.cancel(true);
            throw new TtsException("TTS_TIMEOUT", "Google TTS quá thời gian chờ", true);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TtsException("TTS_INTERRUPTED", "Tác vụ TTS bị gián đoạn", true);
        } catch (ExecutionException e) {
            throw map(e.getCause());
        } catch (ApiException e) {
            throw map(e);
        } catch (java.io.IOException e) {
            throw new TtsException("TTS_CLIENT_ERROR", "Không khởi tạo được Google TTS client", true);
        }
    }

    private static TtsException map(Throwable t) {
        if (t instanceof ApiException api) {
            StatusCode.Code code = api.getStatusCode().getCode();
            boolean retryable = switch (code) {
                case UNAVAILABLE, DEADLINE_EXCEEDED, RESOURCE_EXHAUSTED, INTERNAL, ABORTED -> true;
                default -> false;
            };
            // Message from Google may include request details but never credentials.
            return new TtsException("GOOGLE_" + code.name(), "Google TTS lỗi: " + code.name(), retryable, t);
        }
        return new TtsException("TTS_ERROR", "Lỗi không xác định khi gọi Google TTS", true, t);
    }

    private TextToSpeechClient client() throws java.io.IOException {
        TextToSpeechClient c = client;
        if (c == null) {
            synchronized (this) {
                if (client == null) {
                    client = TextToSpeechClient.create();
                }
                c = client;
            }
        }
        return c;
    }

    @PreDestroy
    public void close() {
        if (client != null) {
            client.close();
        }
    }
}
