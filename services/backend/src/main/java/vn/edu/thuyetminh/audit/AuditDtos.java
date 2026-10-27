package vn.edu.thuyetminh.audit;

import java.time.Instant;

/** Response DTOs for UC15 audit log lookup. */
public final class AuditDtos {

    private AuditDtos() {
    }

    public record AuditLogView(Long id, Instant occurredAt, Long actorId, String actorName, String action,
                               String resourceType, String resourceId, String result, String detail) {

        static AuditLogView from(AuditLog a) {
            return new AuditLogView(a.getId(), a.getOccurredAt(), a.getActorId(), a.getActorName(), a.getAction(),
                    a.getResourceType(), a.getResourceId(), a.getResult(), a.getDetail());
        }
    }
}
