package vn.edu.thuyetminh.access;

import java.util.Optional;

/** Persistence port for User access grants. */
public interface AccessGrantStore {

    Optional<AccessGrant> findByTokenHash(String tokenHash);

    Optional<AccessGrant> findByQrId(Long qrId);

    /** Saves and flushes, so the one-grant-per-QR constraint is enforced inside the redeem transaction. */
    AccessGrant saveNow(AccessGrant grant);
}
