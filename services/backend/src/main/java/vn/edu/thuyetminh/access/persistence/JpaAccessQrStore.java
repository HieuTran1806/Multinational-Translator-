package vn.edu.thuyetminh.access.persistence;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.access.AccessPackage;
import vn.edu.thuyetminh.access.AccessPackageRepository;
import vn.edu.thuyetminh.access.AccessQr;
import vn.edu.thuyetminh.access.AccessQrRepository;
import vn.edu.thuyetminh.access.AccessQrStatus;
import vn.edu.thuyetminh.access.AccessQrStore;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.common.web.PageResponse;

/** JPA adapter for {@link AccessQrStore}. */
@Repository
public class JpaAccessQrStore implements AccessQrStore {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));

    private final AccessQrRepository qrs;
    private final AccessPackageRepository packages;

    public JpaAccessQrStore(AccessQrRepository qrs, AccessPackageRepository packages) {
        this.qrs = qrs;
        this.packages = packages;
    }

    @Override
    public Optional<AccessPackage> findActivePackage(String code) {
        return packages.findByCodeAndActiveTrue(code);
    }

    @Override
    public Optional<AccessQr> findById(Long id) {
        return qrs.findById(id);
    }

    @Override
    public Optional<AccessQr> findByTokenHash(String tokenHash) {
        return qrs.findByTokenHash(tokenHash);
    }

    @Override
    public PageResponse<AccessQr> search(AccessQrStatus status, int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "page phải >= 0 và size trong khoảng 1.." + MAX_PAGE_SIZE);
        }
        Page<AccessQr> result = qrs.search(status, PageRequest.of(page, size, NEWEST_FIRST));
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Override
    public AccessQr save(AccessQr qr) {
        return qrs.saveAndFlush(qr);
    }

    @Override
    public boolean markRedeemed(String tokenHash, Instant now) {
        return qrs.markRedeemed(tokenHash, now, AccessQrStatus.ISSUED, AccessQrStatus.REDEEMED) == 1;
    }

    @Override
    public java.util.Map<AccessQrStatus, Long> countBySellerGroupByStatus(Long sellerId) {
        java.util.Map<AccessQrStatus, Long> counts = new java.util.EnumMap<>(AccessQrStatus.class);
        for (Object[] row : qrs.countBySellerGroupByStatus(sellerId)) {
            counts.put((AccessQrStatus) row[0], (Long) row[1]);
        }
        return counts;
    }
}
