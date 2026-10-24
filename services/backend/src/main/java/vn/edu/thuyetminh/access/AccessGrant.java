package vn.edu.thuyetminh.access;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/** Time-limited User access created by redeeming a QR. Bound to the hash of the activating device id. */
@Entity
@Table(name = "access_grant")
public class AccessGrant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "qr_id", nullable = false, unique = true)
    private AccessQr qr;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "device_hash", nullable = false, length = 64)
    private String deviceHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    protected AccessGrant() {
    }

    public AccessGrant(AccessQr qr, String tokenHash, String deviceHash, Instant createdAt, Instant expiresAt) {
        this.qr = qr;
        this.tokenHash = tokenHash;
        this.deviceHash = deviceHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public boolean isActive(Instant now) {
        return revokedAt == null && now.isBefore(expiresAt);
    }

    public boolean isBoundTo(String otherDeviceHash) {
        return deviceHash.equals(otherDeviceHash);
    }

    public void revoke(Instant now) {
        if (revokedAt == null) {
            this.revokedAt = now;
        }
    }

    public Long getId() {
        return id;
    }

    public AccessQr getQr() {
        return qr;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }
}
