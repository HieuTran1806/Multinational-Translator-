package vn.edu.thuyetminh.access;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.common.Hashing;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;

/**
 * UC02 — redeem a single-use QR into a time-limited grant bound to one device, and validate that grant
 * on later User requests. QR and grant tokens are never logged; only their SHA-256 hashes are stored.
 */
@Service
public class AccessGrantService {

    private static final Logger log = LoggerFactory.getLogger(AccessGrantService.class);
    private static final int MAX_TOKEN_LENGTH = 200;
    private static final int MAX_DEVICE_ID_LENGTH = 128;

    private final AccessQrStore qrs;
    private final AccessGrantStore grants;
    private final Clock clock;

    public AccessGrantService(AccessQrStore qrs, AccessGrantStore grants, Clock clock) {
        this.qrs = qrs;
        this.grants = grants;
        this.clock = clock;
    }

    /**
     * Steps 3–4 of UC02 in one transaction: the conditional UPDATE marks the QR used (E6: only one
     * concurrent caller can win), then the grant is created. Any failure rolls both back, so a QR is
     * never consumed without a grant.
     */
    @Transactional
    public AccessDtos.GrantResponse redeem(AccessDtos.RedeemRequest req) {
        String qrHash = Hashing.sha256Hex(req.qrToken().trim());
        Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);

        if (!qrs.markRedeemed(qrHash, now)) {
            Optional<AccessQr> existing = qrs.findByTokenHash(qrHash);
            if (existing.isPresent() && existing.get().getStatus() == AccessQrStatus.REDEEMED) {
                log.info("Rejected redeem: access QR id={} was already used", existing.get().getId());
                throw new ApiException(ErrorCode.ACCESS_QR_ALREADY_USED,
                        "Mã QR này đã được sử dụng. Vui lòng liên hệ người bán để được hỗ trợ.");
            }
            log.info("Rejected redeem: access QR is unknown or revoked");
            throw new ApiException(ErrorCode.ACCESS_QR_INVALID, "Mã QR không hợp lệ.");
        }

        AccessQr qr = qrs.findByTokenHash(qrHash)
                .orElseThrow(() -> new IllegalStateException("Redeemed QR vanished inside its transaction"));
        AccessPackage pkg = qr.getAccessPackage();
        Instant expiresAt = now.plus(pkg.duration());
        String token = AccessTokens.newToken();
        grants.saveNow(new AccessGrant(qr, Hashing.sha256Hex(token), Hashing.sha256Hex(req.deviceId()), now,
                expiresAt));
        log.info("Access QR id={} redeemed ({}), grant valid until {}", qr.getId(), pkg.getCode(), expiresAt);
        return new AccessDtos.GrantResponse(token, "Bearer", expiresAt, pkg.getCode());
    }

    /**
     * Returns the visitor for a token + device pair, or empty when the grant is unknown, expired, revoked,
     * or presented from a different device than the one that redeemed the QR.
     */
    @Transactional(readOnly = true)
    public Optional<AuthenticatedVisitor> authenticate(String rawToken, String deviceId) {
        if (rawToken == null || rawToken.isBlank() || rawToken.length() > MAX_TOKEN_LENGTH
                || deviceId == null || deviceId.isBlank() || deviceId.length() > MAX_DEVICE_ID_LENGTH) {
            return Optional.empty();
        }
        Instant now = clock.instant();
        String deviceHash = Hashing.sha256Hex(deviceId);
        return grants.findByTokenHash(Hashing.sha256Hex(rawToken))
                .filter(g -> g.isActive(now))
                .filter(g -> g.isBoundTo(deviceHash))
                .filter(g -> !g.getQr().isRevoked())
                .map(g -> new AuthenticatedVisitor(g.getId(), g.getQr().getAccessPackage().getCode(),
                        g.getExpiresAt()));
    }

    /** A1: lets the User app restore a still-valid session on the same device after reopening. */
    public AccessDtos.GrantStatus me(AuthenticatedVisitor visitor) {
        long remaining = Math.max(0, Duration.between(clock.instant(), visitor.expiresAt()).toSeconds());
        return new AccessDtos.GrantStatus(visitor.grantId(), visitor.packageCode(), visitor.expiresAt(), remaining);
    }
}
