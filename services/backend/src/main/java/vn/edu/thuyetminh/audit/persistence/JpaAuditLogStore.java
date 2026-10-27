package vn.edu.thuyetminh.audit.persistence;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.audit.AuditLog;
import vn.edu.thuyetminh.audit.AuditLogRepository;
import vn.edu.thuyetminh.audit.AuditLogStore;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.common.web.PageResponse;

@Repository
public class JpaAuditLogStore implements AuditLogStore {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "occurredAt")
            .and(Sort.by(Sort.Direction.DESC, "id"));

    private final AuditLogRepository repository;

    public JpaAuditLogStore(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Override public AuditLog save(AuditLog entry) {
        return repository.saveAndFlush(entry);
    }

    @Override public PageResponse<AuditLog> search(String action, Long actorId, String resourceType, String result,
                                                   Instant from, Instant to, int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "page phải >= 0 và size trong khoảng 1.." + MAX_PAGE_SIZE);
        }
        Page<AuditLog> result1 = repository.search(nullToEmpty(action), actorId, nullToEmpty(resourceType),
                nullToEmpty(result),
                from == null ? Instant.EPOCH : from,                      // Postgres cannot type unbound nulls (42P18)
                to == null ? FAR_FUTURE : to, PageRequest.of(page, size, NEWEST_FIRST));
        return new PageResponse<>(result1.getContent(), result1.getNumber(), result1.getSize(),
                result1.getTotalElements(), result1.getTotalPages());
    }

    private static final Instant FAR_FUTURE = Instant.parse("9999-12-31T00:00:00Z");

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
