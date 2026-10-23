package vn.edu.thuyetminh.poi.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.poi.PoiTranslation;
import vn.edu.thuyetminh.poi.PoiTranslationRepository;
import vn.edu.thuyetminh.poi.PoiTranslationStore;

/** JPA adapter for the POI translation persistence port. */
@Repository
public class JpaPoiTranslationStore implements PoiTranslationStore {
    private final PoiTranslationRepository translations;

    public JpaPoiTranslationStore(PoiTranslationRepository translations) {
        this.translations = translations;
    }

    @Override
    public Optional<PoiTranslation> findByPoiAndLanguage(Long poiId, String languageCode) {
        return translations.findByPoiIdAndLanguageCode(poiId, languageCode);
    }

    @Override
    public Optional<PoiTranslation> findById(Long id) {
        return translations.findById(id);
    }

    @Override
    public List<PoiTranslation> listByPoi(Long poiId) {
        return translations.findByPoiIdOrderByLanguageCodeAsc(poiId);
    }

    @Override
    public List<PoiTranslation> listByPois(Collection<Long> poiIds) {
        return translations.findByPoiIdIn(poiIds);
    }

    @Override
    public PoiTranslation save(PoiTranslation translation) {
        return translations.save(translation);
    }

    @Override
    public PoiTranslation saveNow(PoiTranslation translation) {
        return translations.saveAndFlush(translation);
    }

    @Override
    public void flush() {
        translations.flush();
    }
}