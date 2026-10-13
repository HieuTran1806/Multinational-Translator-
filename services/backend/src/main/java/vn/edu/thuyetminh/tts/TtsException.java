package vn.edu.thuyetminh.tts;

/** Failure from a TTS provider. {@code retryable} decides whether the job is retried. */
public class TtsException extends Exception {

    private final boolean retryable;
    private final String code;

    public TtsException(String code, String message, boolean retryable) {
        super(message);
        this.code = code;
        this.retryable = retryable;
    }

    public TtsException(String code, String message, boolean retryable, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.retryable = retryable;
    }

    public boolean isRetryable() {
        return retryable;
    }

    public String getCode() {
        return code;
    }
}
