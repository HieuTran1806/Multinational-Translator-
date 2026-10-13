package vn.edu.thuyetminh.media;

/** File type detected from content (magic bytes), never trusted from the client's filename/header. */
public enum DetectedMedia {
    MP3("mp3", "audio/mpeg", true),
    M4A("m4a", "audio/mp4", true),
    WAV("wav", "audio/wav", true),
    OGG("ogg", "audio/ogg", true),
    JPEG("jpg", "image/jpeg", false),
    PNG("png", "image/png", false),
    WEBP("webp", "image/webp", false);

    private final String extension;
    private final String mimeType;
    private final boolean audio;

    DetectedMedia(String extension, String mimeType, boolean audio) {
        this.extension = extension;
        this.mimeType = mimeType;
        this.audio = audio;
    }

    public String extension() {
        return extension;
    }

    public String mimeType() {
        return mimeType;
    }

    public boolean isAudio() {
        return audio;
    }

    /** Detects a supported format from the first bytes of a file; returns null if unsupported. */
    public static DetectedMedia detect(byte[] h) {
        if (h == null || h.length < 12) {
            return null;
        }
        if (h[0] == 'I' && h[1] == 'D' && h[2] == '3') {
            return MP3; // ID3v2 tag
        }
        if ((h[0] & 0xFF) == 0xFF && (h[1] & 0xE0) == 0xE0 && (h[1] & 0x06) != 0) {
            return MP3; // MPEG audio frame sync (layer bits != 00)
        }
        if (h[4] == 'f' && h[5] == 't' && h[6] == 'y' && h[7] == 'p') {
            return M4A; // ISO base media (m4a / mp4 audio)
        }
        if (h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F') {
            if (h[8] == 'W' && h[9] == 'A' && h[10] == 'V' && h[11] == 'E') {
                return WAV;
            }
            if (h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P') {
                return WEBP;
            }
            return null;
        }
        if (h[0] == 'O' && h[1] == 'g' && h[2] == 'g' && h[3] == 'S') {
            return OGG;
        }
        if ((h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) {
            return JPEG;
        }
        if ((h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G') {
            return PNG;
        }
        return null;
    }
}
