package vn.edu.thuyetminh.audit;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.auth.AuthenticatedAdmin;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.common.web.PageResponse;

/**
 * UC15 — records sensitive admin/business events from the backend (never from client input) and serves
 * the Super-Admin lookup API. Mandatory events are fail-closed: if the audit write fails, the business
 * operation must not be reported as done.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    public static final String SELLER_CREATE = "SELLER_CREATE";
    public static final String SELLER_UPDATE = "SELLER_UPDATE";
    public static final String SELLER_DELETE = "SELLER_DELETE";
    public static final String SELLER_RESET_PASSWORD = "SELLER_RESET_PASSWORD";
    public static final String ADMIN_CREATE = "ADMIN_CREATE";
    public static final String ADMIN_UPDATE = "ADMIN_UPDATE";
    public static final String ADMIN_RESET_PASSWORD = "ADMIN_RESET_PASSWORD";
    public static final String QR_ISSUE = "QR_ISSUE";
    public static final String QR_REDEEM = "QR_REDEEM";
    public static final String QR_REVOKE = "QR_REVOKE";

    public static final String RESULT_SUCCESS = "SUCCESS";
    public static final String RESULT_DENIED = "DENIED";
    public static final String RESULT_FAILURE = "FAILURE";

    private final AuditLogStore store;
    private final Clock clock;

    public AuditService(AuditLogStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    /** Snapshot of who performed an action, taken server-side from the authenticated principal. */
    public record Actor(Long id, String name) {

        public static Actor from(AuthenticatedAdmin admin) {
            return admin == null ? null : new Actor(admin.accountId(), admin.username());
        }
    }

    /**
     * Mandatory audit write (UC15): runs in the caller's transaction so business state and its audit
     * record commit or roll back together; a failed write aborts the business operation (fail-closed).
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(Actor actor, String action, String resourceType, String resourceId, String result,
                       String detail) {
        Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
        try {
            store.save(new AuditLog(now, actor == null ? null : actor.id(),
                    actor == null ? null : actor.name(), action, resourceType, resourceId, result, detail));
        } catch (RuntimeException e) {
            log.error("Audit write failed for action={} resource={}/{}", action, resourceType, resourceId, e);
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "Không ghi được nhật ký kiểm toán, thao tác bị hủy");
        }
    }

    /**
     * DENIED events happen inside a transaction that is about to roll back, so they must commit in their
     * own transaction to survive; a failed deny write is logged, not fatal (the denial itself still stands).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordIndependent(Actor actor, String action, String resourceType, String resourceId, String result,
                                  String detail) {
        try {
            record(actor, action, resourceType, resourceId, result, detail);
        } catch (RuntimeException e) {
            log.error("Independent audit write failed for action={}", action);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLog> search(String action, Long actorId, String resourceType, String result,
                                         Instant from, Instant to, int page, int size) {
        return store.search(blankToNull(action), actorId, blankToNull(resourceType), blankToNull(result),
                from, to, page, size);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
