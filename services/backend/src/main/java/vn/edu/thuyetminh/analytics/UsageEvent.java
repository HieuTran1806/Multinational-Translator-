package vn.edu.thuyetminh.analytics;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Raw usage metric (UC13/UC14). event_id is a client-generated dedup key; the unique index on it makes
 * repeated submits idempotent. Raw events are purged after 90 days; aggregates are computed on the fly.
 */
@Entity
@Table(name = "usage_event")
public class UsageEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @Column(name = "grant_id", nullable = false)
    private Long grantId;

    @Column(name = "poi_id")
    private Long poiId;

    @Column(name = "event_id", length = 64)
    private String eventId;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    protected UsageEvent() {
    }

    public UsageEvent(String eventType, Long grantId, Long poiId, String eventId, Instant occurredAt) {
        this.eventType = eventType;
        this.grantId = grantId;
        this.poiId = poiId;
        this.eventId = eventId;
        this.occurredAt = occurredAt;
    }

    public Long getId() {
        return id;
    }

    public String getEventType() {
        return eventType;
    }

    public Long getGrantId() {
        return grantId;
    }

    public Long getPoiId() {
        return poiId;
    }

    public String getEventId() {
        return eventId;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
