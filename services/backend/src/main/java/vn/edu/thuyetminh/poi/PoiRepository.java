package vn.edu.thuyetminh.poi;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PoiRepository extends JpaRepository<Poi, Long> {

    @Query("select p from Poi p where p.status = :status and p.deletedAt is null")
    Page<Poi> findByStatus(PoiStatus status, Pageable pageable);

    @Query("select p from Poi p where p.id = :id and p.status = :status and p.deletedAt is null")
    Optional<Poi> findByIdAndStatus(Long id, PoiStatus status);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    @Query("""
            select p from Poi p
            where p.deletedAt is null
              and (:status is null or p.status = :status)
              and (:q is null or lower(p.defaultName) like :q or lower(p.code) like :q)
            """)
    Page<Poi> search(PoiStatus status, String q, Pageable pageable);
}
