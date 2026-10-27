package vn.edu.thuyetminh.access;

import java.time.Instant;
import java.util.Optional;

import vn.edu.thuyetminh.common.web.PageResponse;

/** Persistence port for access packages and QR codes. */
public interface AccessQrStore {

    Optional<AccessPackage> findActivePackage(String code);

    Optional<AccessQr> findById(Long id);

    Optional<AccessQr> findByTokenHash(String tokenHash);

    /** Admin list, newest first; {@code status == null} means every status. */
    PageResponse<AccessQr> search(AccessQrStatus status, int page, int size);

    AccessQr save(AccessQr qr);

    /**
     * Atomically moves an ISSUED QR to REDEEMED. Returns {@code false} when the QR is unknown, already
     * redeemed or revoked — including when another request redeemed it a moment earlier.
     */
    boolean markRedeemed(String tokenHash, Instant now);

    /** UC13: QR counts per owning seller, grouped by status. */
    java.util.Map<AccessQrStatus, Long> countBySellerGroupByStatus(Long sellerId);
}
