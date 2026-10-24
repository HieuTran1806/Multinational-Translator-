package vn.edu.thuyetminh.poi;

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
import jakarta.persistence.Version;

@Entity
@Table(name = "poi")
public class Poi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "default_name", nullable = false, length = 200)
    private String defaultName;

    @Column(length = 100)
    private String category;

    @Column(name = "trigger_radius", nullable = false)
    private double triggerRadius = 50.0;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(name = "cover_image_key", length = 255)
    private String coverImageKey;

    @Column(name = "cover_image_type", length = 50)
    private String coverImageType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PoiStatus status = PoiStatus.DRAFT;

    @Column(name = "is_demo", nullable = false)
    private boolean demo;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "row_version", nullable = false)
    private long rowVersion;

    protected Poi() {
    }

    public Poi(String code, String defaultName, double latitude, double longitude) {
        this.code = code;
        this.defaultName = defaultName;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    @PrePersist
    void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    /** Marks the POI as changed (e.g. a translation changed) so offline manifests get a new version. */
    public void touch() {
        updatedAt = Instant.now();
    }

    public void update(String code, String defaultName, double latitude, double longitude) {
        this.code = code;
        this.defaultName = defaultName;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public void updateAdminFields(String category, double triggerRadius) {
        this.category = category;
        this.triggerRadius = triggerRadius;
    }

    public void softDelete(Instant now) {
        this.status = PoiStatus.DRAFT;
        this.deletedAt = now;
        this.publishedAt = null;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public String getCategory() { return category; }

    public double getTriggerRadius() { return triggerRadius; }

    public Instant getDeletedAt() { return deletedAt; }

    public void publish(Instant now) {
        status = PoiStatus.PUBLISHED;
        publishedAt = now;
    }

    public void unpublish() {
        status = PoiStatus.DRAFT;
    }

    public void setCoverImage(String key, String mimeType) {
        this.coverImageKey = key;
        this.coverImageType = mimeType;
    }

    public boolean isPublished() {
        return status == PoiStatus.PUBLISHED;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultName() {
        return defaultName;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public String getCoverImageKey() {
        return coverImageKey;
    }

    public String getCoverImageType() {
        return coverImageType;
    }

    public PoiStatus getStatus() {
        return status;
    }

    public boolean isDemo() {
        return demo;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public long getRowVersion() {
        return rowVersion;
    }
}
