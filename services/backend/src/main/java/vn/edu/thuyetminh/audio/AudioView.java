package vn.edu.thuyetminh.audio;

import java.time.Instant;

/**
 * Audio metadata returned by the API. {@code url} is a path relative to the API base URL
 * (no host is ever stored or hard-coded).
 */
public record AudioView(
        Long id,
        AudioSource source,
        String format,
        String mimeType,
        long sizeBytes,
        String sha256,
        int contentVersion,
        AudioAssetStatus status,
        boolean current,
        String url,
        Instant createdAt) {

    public static AudioView publicView(AudioAsset a) {
        return new AudioView(a.getId(), a.getSource(), a.getFormat(), a.getMimeType(), a.getSizeBytes(),
                a.getSha256(), a.getContentVersion(), a.getStatus(), true,
                "/api/v1/public/audio/" + a.getId(), a.getCreatedAt());
    }

    public static AudioView adminView(AudioAsset a, boolean current) {
        return new AudioView(a.getId(), a.getSource(), a.getFormat(), a.getMimeType(), a.getSizeBytes(),
                a.getSha256(), a.getContentVersion(), a.getStatus(), current,
                "/api/v1/admin/audio/" + a.getId(), a.getCreatedAt());
    }
}
