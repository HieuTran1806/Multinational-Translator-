package vn.edu.thuyetminh.access;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.audit.AuditService;
import vn.edu.thuyetminh.auth.AuthenticatedAdmin;
import vn.edu.thuyetminh.common.Hashing;
import vn.edu.thuyetminh.common.config.AppProperties;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.common.web.PageResponse;

/**
 * Issues and revokes access QR codes. Admin issues QR codes for visitors (UC02/UC12 scope).
 */
@Service
public class AccessQrAdminService {

    private static final Logger log = LoggerFactory.getLogger(AccessQrAdminService.class);

    private final AccessQrStore qrs;
    private final AccessGrantStore grants;
    private final AppProperties props;
    private final Clock clock;
    private final AuditService audit;

    public AccessQrAdminService(AccessQrStore qrs, AccessGrantStore grants, AppProperties props, Clock clock,
                                AuditService audit) {
        this.qrs = qrs;
        this.grants = grants;
        this.props = props;
        this.clock = clock;
        this.audit = audit;
    }

    @Transactional
    public AccessDtos.IssuedQr issue(AccessDtos.IssueRequest req, Long issuedByAccountId) {
        String code = req == null || req.packageCode() == null || req.packageCode().isBlank()
                ? props.access().defaultPackage() : req.packageCode().trim();
        AccessPackage pkg = qrs.findActivePackage(code)
                .orElseThrow(() -> new ApiException(ErrorCode.BAD_REQUEST,
                        "Gói '" + code + "' không tồn tại hoặc đã ngừng áp dụng"));
        String note = req == null || req.note() == null || req.note().isBlank() ? null : req.note().trim();

        String token = AccessTokens.newToken();
        AccessQr qr = qrs.save(new AccessQr(Hashing.sha256Hex(token), pkg, note, issuedByAccountId,
                clock.instant().truncatedTo(ChronoUnit.SECONDS)));
        log.info("Access QR id={} ({}) issued by account id={}", qr.getId(), pkg.getCode(), issuedByAccountId);
        audit.record(auditActor(issuedByAccountId), AuditService.QR_ISSUE, "ACCESS_QR", String.valueOf(qr.getId()),
                AuditService.RESULT_SUCCESS, "package=" + pkg.getCode());
        return new AccessDtos.IssuedQr(qr.getId(), qr.getStatus(), pkg.getCode(), pkg.getDurationMinutes(),
                qr.getNote(), qr.getCreatedAt(), token, activationUrl(token));
    }

    @Transactional(readOnly = true)
    public PageResponse<AccessDtos.QrSummary> list(AccessQrStatus status, int page, int size) {
        return qrs.search(status, page, size).map(AccessDtos.QrSummary::from);
    }

    /** Revoking blocks a QR that was not redeemed yet and also ends the grant of one that was. Idempotent. */
    @Transactional
    public AccessDtos.QrSummary revoke(Long id, AuthenticatedAdmin admin) {
        AccessQr qr = qrs.findById(id).orElseThrow(() -> ApiException.notFound("Mã QR"));
        if (!qr.isRevoked()) {
            Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
            qr.revoke(now);
            grants.findByQrId(id).ifPresent(g -> g.revoke(now));
            log.info("Access QR id={} revoked", id);
            audit.record(AuditService.Actor.from(admin), AuditService.QR_REVOKE, "ACCESS_QR", String.valueOf(id),
                    AuditService.RESULT_SUCCESS, null);
        }
        return AccessDtos.QrSummary.from(qr);
    }

    private AuditService.Actor auditActor(Long issuedByAccountId) {
        return new AuditService.Actor(issuedByAccountId, null);
    }

    private String activationUrl(String token) {
        String base = props.access().activationUrl();
        return base + (base.contains("?") ? "&" : "?") + "t=" + token;
    }
}
