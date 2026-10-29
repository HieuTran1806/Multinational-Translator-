package vn.edu.thuyetminh.access;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A single-use access QR. Only the SHA-256 hash of the token is stored. The ISSUED → REDEEMED
 * transition is done by a conditional UPDATE in the store, never by mutating this entity, so two
 * concurrent redeems cannot both succeed.
 */
@Entity
@Table(name = "access_qr")
public class AccessQr {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    private AccessPackage accessPackage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AccessQrStatus status;

    @Column(length = 200)
    private String note;

    @Column(name = "issued_by")
    private Long issuedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "redeemed_at")
    private Instant redeemedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    protected AccessQr() {
    }

    public AccessQr(String tokenHash, AccessPackage accessPackage, String note, Long issuedBy, Instant createdAt) {
        this.tokenHash = tokenHash;
        this.accessPackage = accessPackage;
        this.note = note;
        this.issuedBy = issuedBy;
        this.createdAt = createdAt;
        this.status = AccessQrStatus.ISSUED;
    }

    public boolean isRevoked() {
        return status == AccessQrStatus.REVOKED;
    }

    public void revoke(Instant now) {
        this.status = AccessQrStatus.REVOKED;
        this.revokedAt = now;
    }

    public Long getId() {
        return id;
    }

    public AccessPackage getAccessPackage() {
        return accessPackage;
    }

    public AccessQrStatus getStatus() {
        return status;
    }

    public String getNote() {
        return note;
    }

    public Long getIssuedBy() {
        return issuedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getRedeemedAt() {
        return redeemedAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }
}
