package vn.edu.thuyetminh.audit;

import java.time.Instant;
import java.util.Optional;

import vn.edu.thuyetminh.common.web.PageResponse;

/** Persistence port for the append-only audit log (UC15). */
public interface AuditLogStore {

    AuditLog save(AuditLog entry);

    /** Super-Admin lookup, newest first; any null filter means "any". */
    PageResponse<AuditLog> search(String action, Long actorId, String resourceType, String result,
                                  Instant from, Instant to, int page, int size);
}
