package vn.edu.thuyetminh.audit;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Filters use the "empty means any" convention (the adapter substitutes sentinel values for null,
     * because Postgres cannot determine the type of unbound null parameters).
     */
    @Query("""
            select a from AuditLog a
            where (:action = '' or a.action = :action)
              and (cast(:actorId as long) is null or a.actorId = :actorId)
              and (:resourceType = '' or a.resourceType = :resourceType)
              and (:result = '' or a.result = :result)
              and a.occurredAt >= :from
              and a.occurredAt < :to
            """)
    Page<AuditLog> search(@Param("action") String action,
                          @Param("actorId") Long actorId,
                          @Param("resourceType") String resourceType,
                          @Param("result") String result,
                          @Param("from") Instant from,
                          @Param("to") Instant to,
                          Pageable pageable);
}
