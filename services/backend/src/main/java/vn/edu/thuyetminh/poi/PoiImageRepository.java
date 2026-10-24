package vn.edu.thuyetminh.poi;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PoiImageRepository extends JpaRepository<PoiImage, Long> {
    List<PoiImage> findByPoiIdOrderBySortOrderAscIdAsc(Long poiId);
    long countByPoiId(Long poiId);
    Optional<PoiImage> findByIdAndPoiId(Long id, Long poiId);
}