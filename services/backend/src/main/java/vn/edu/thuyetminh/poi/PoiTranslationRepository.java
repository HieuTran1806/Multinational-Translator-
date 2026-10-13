package vn.edu.thuyetminh.poi;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PoiTranslationRepository extends JpaRepository<PoiTranslation, Long> {

    List<PoiTranslation> findByPoiIdOrderByLanguageCodeAsc(Long poiId);

    List<PoiTranslation> findByPoiIdIn(Collection<Long> poiIds);

    Optional<PoiTranslation> findByPoiIdAndLanguageCode(Long poiId, String languageCode);
}
