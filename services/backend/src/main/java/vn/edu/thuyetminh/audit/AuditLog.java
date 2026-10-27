package vn.edu.thuyetminh.audit;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * UC15 — append-only audit record. Never stores QR tokens, passwords, secrets or payment credentials;
 * {@code detail} carries safe metadata only.
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    @Column(name = "actor_id")
    private Long actorId;

    /** Snapshot so records stay readable after the account is soft-deleted. */
    @Column(name = "actor_name", length = 64)
    private String actorName;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(name = "resource_type", nullable = false, length = 40)
    private String resourceType;

    @Column(name = "resource_id", length = 64)
    private String resourceId;

    @Column(nullable = false, length = 10)
    private String result;

    @Column
    private String detail;

    protected AuditLog() {
    }

    public AuditLog(Instant occurredAt, Long actorId, String actorName, String action, String resourceType,
                    String resourceId, String result, String detail) {
        this.occurredAt = occurredAt;
        this.actorId = actorId;
        this.actorName = actorName;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.result = result;
        this.detail = detail;
    }

    @PrePersist
    void onCreate() {
        if (occurredAt == null) {
            occurredAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public Long getActorId() {
        return actorId;
    }

    public String getActorName() {
        return actorName;
    }

    public String getAction() {
        return action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public String getResult() {
        return result;
    }

    public String getDetail() {
        return detail;
    }
}
