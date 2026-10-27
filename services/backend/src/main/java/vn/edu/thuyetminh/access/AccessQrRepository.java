package vn.edu.thuyetminh.access;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface AccessQrRepository extends JpaRepository<AccessQr, Long> {

    @EntityGraph(attributePaths = "accessPackage")
    Optional<AccessQr> findByTokenHash(String tokenHash);

    @EntityGraph(attributePaths = "accessPackage")
    @Query("select q from AccessQr q where (:status is null or q.status = :status)")
    Page<AccessQr> search(AccessQrStatus status, Pageable pageable);

    /**
     * Atomic single-use transition. PostgreSQL row locking makes a concurrent second UPDATE wait and
     * then re-check {@code status = ISSUED}, so exactly one caller gets 1 row back.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update AccessQr q set q.status = :redeemed, q.redeemedAt = :now "
            + "where q.tokenHash = :tokenHash and q.status = :issued")
    int markRedeemed(String tokenHash, Instant now, AccessQrStatus issued, AccessQrStatus redeemed);

    /** UC13: QR counts per owning seller, grouped by status. */
    @Query("select q.status, count(q) from AccessQr q where q.sellerId = :sellerId group by q.status")
    List<Object[]> countBySellerGroupByStatus(@org.springframework.data.repository.query.Param("sellerId") Long sellerId);
}
