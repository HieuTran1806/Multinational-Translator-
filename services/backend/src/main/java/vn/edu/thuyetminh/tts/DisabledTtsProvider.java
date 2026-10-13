package vn.edu.thuyetminh.tts;

/** Used when no TTS provider is configured. Never fabricates audio. */
public class DisabledTtsProvider implements TtsProvider {

    private final String reason;

    public DisabledTtsProvider(String reason) {
        this.reason = reason;
    }

    @Override
    public String name() {
        return "none";
    }

    @Override
    public boolean isConfigured() {
        return false;
    }

    public String reason() {
        return reason;
    }

    @Override
    public TtsResult synthesize(TtsRequest request) throws TtsException {
        throw new TtsException("TTS_NOT_CONFIGURED", reason, false);
    }
}
