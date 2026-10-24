package vn.edu.thuyetminh.poi;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Persistence port for POI translations. */
public interface PoiTranslationStore {
    Optional<PoiTranslation> findByPoiAndLanguage(Long poiId, String languageCode);
    Optional<PoiTranslation> findById(Long id);
    /** All translations of one POI, ordered by language code. */
    List<PoiTranslation> listByPoi(Long poiId);
    /** Translations of several POIs in one query (batch list views). */
    List<PoiTranslation> listByPois(Collection<Long> poiIds);
    /** Inserts or updates without flushing. */
    PoiTranslation save(PoiTranslation translation);
    /** Saves and synchronises with the database immediately. */
    PoiTranslation saveNow(PoiTranslation translation);
    /** Flushes the persistence context, including pending changes of the same use case. */
    void flush();
}