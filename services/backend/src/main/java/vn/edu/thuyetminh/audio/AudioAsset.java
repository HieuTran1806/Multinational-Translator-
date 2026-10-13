package vn.edu.thuyetminh.audio;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "audio_asset")
public class AudioAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "translation_id", nullable = false)
    private Long translationId;

    @Column(name = "content_version", nullable = false)
    private int contentVersion;

    @Column(name = "storage_key", nullable = false, unique = true, length = 255)
    private String storageKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AudioSource source;

    @Column(nullable = false, length = 10)
    private String format;

    @Column(name = "mime_type", nullable = false, length = 50)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(nullable = false, length = 64)
    private String sha256;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AudioAssetStatus status = AudioAssetStatus.READY;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "tts_voice", length = 80)
    private String ttsVoice;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AudioAsset() {
    }

    public AudioAsset(Long translationId, int contentVersion, String storageKey, AudioSource source, String format,
                      String mimeType, long sizeBytes, String sha256, String contentHash, String ttsVoice,
                      String originalFilename) {
        this.translationId = translationId;
        this.contentVersion = contentVersion;
        this.storageKey = storageKey;
        this.source = source;
        this.format = format;
        this.mimeType = mimeType;
        this.sizeBytes = sizeBytes;
        this.sha256 = sha256;
        this.contentHash = contentHash;
        this.ttsVoice = ttsVoice;
        this.originalFilename = originalFilename;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public void markStale() {
        status = AudioAssetStatus.STALE;
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

    public String getStorageKey() {
        return storageKey;
    }

    public AudioSource getSource() {
        return source;
    }

    public String getFormat() {
        return format;
    }

    public String getMimeType() {
        return mimeType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public String getSha256() {
        return sha256;
    }

    public AudioAssetStatus getStatus() {
        return status;
    }

    public String getContentHash() {
        return contentHash;
    }

    public String getTtsVoice() {
        return ttsVoice;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
