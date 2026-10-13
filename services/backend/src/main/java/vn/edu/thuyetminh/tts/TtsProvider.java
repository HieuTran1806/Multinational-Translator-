package vn.edu.thuyetminh.tts;

/**
 * Server-side text-to-speech. Implementations must never be called from clients directly and must not
 * log credentials. Translation is NOT a TTS concern: each language's text is entered manually.
 */
public interface TtsProvider {

    /** Short identifier stored in the content hash, e.g. "google" or "none". */
    String name();

    /** True when credentials/config are present so that synthesis can be attempted. */
    boolean isConfigured();

    /** Synthesizes MP3 audio. Implementations enforce their own per-call timeout. */
    TtsResult synthesize(TtsRequest request) throws TtsException;

    record TtsRequest(String text, String languageCode, String voiceName) {
    }

    record TtsResult(byte[] audio, String voiceUsed) {
    }
}
