package vn.edu.thuyetminh.poi;

import java.time.Instant;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "poi_translation")
public class PoiTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "poi_id", nullable = false)
    private Poi poi;

    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "narration_text", nullable = false, columnDefinition = "text")
    private String narrationText;

    @Column(name = "content_version", nullable = false)
    private int contentVersion = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected PoiTranslation() {
    }

    public PoiTranslation(Poi poi, String languageCode, String name, String description, String narrationText) {
        this.poi = poi;
        this.languageCode = languageCode;
        this.name = name;
        this.description = description;
        this.narrationText = narrationText;
    }

    @PrePersist
    void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Updates the content. If the narration text changes, {@code contentVersion} is incremented so that
     * audio produced for the previous text is no longer considered current.
     *
     * @return true if the narration text changed
     */
    public boolean update(String name, String description, String narrationText) {
        this.name = name;
        this.description = description;
        boolean narrationChanged = !Objects.equals(this.narrationText, narrationText);
        if (narrationChanged) {
            this.narrationText = narrationText;
            this.contentVersion++;
        }
        return narrationChanged;
    }

    public Long getId() {
        return id;
    }

    public Poi getPoi() {
        return poi;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getNarrationText() {
        return narrationText;
    }

    public int getContentVersion() {
        return contentVersion;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
