package vn.edu.thuyetminh.poi;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "poi_image")
public class PoiImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "poi_id", nullable = false)
    private Long poiId;

    @Column(name = "storage_key", nullable = false, unique = true, length = 255)
    private String storageKey;

    @Column(name = "mime_type", nullable = false, length = 50)
    private String mimeType;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected PoiImage() {}

    public PoiImage(Long poiId, String storageKey, String mimeType, int sortOrder) {
        this.poiId = poiId;
        this.storageKey = storageKey;
        this.mimeType = mimeType;
        this.sortOrder = sortOrder;
    }

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public Long getId() { return id; }
    public Long getPoiId() { return poiId; }
    public String getStorageKey() { return storageKey; }
    public String getMimeType() { return mimeType; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}