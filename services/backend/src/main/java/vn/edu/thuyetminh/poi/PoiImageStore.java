package vn.edu.thuyetminh.poi;

import java.util.List;
import java.util.Optional;

/**
 * Persistence port for {@link PoiImage}. POI application services depend on this contract instead of
 * the Spring Data repository, so query derivation, ordering and flush timing stay in the adapter.
 * Only the operations the application actually uses are declared here.
 */
public interface PoiImageStore {

    Optional<PoiImage> findByPoiAndId(Long poiId, Long imageId);

    /** All images of one POI, ordered by {@code sortOrder} then {@code id}. */
    List<PoiImage> listByPoi(Long poiId);

    long countByPoi(Long poiId);

    /** Inserts or updates and flushes immediately (the image must exist before the cover is read back). */
    PoiImage saveNow(PoiImage image);

    /** Updates several images of one POI; changes are flushed with the transaction. */
    void saveAll(List<PoiImage> images);

    /**
     * Removes the row without flushing. The {@link #listByPoi(Long)} call that follows in the same
     * use case sees the removal because Hibernate flushes pending deletes before the query.
     */
    void delete(PoiImage image);
}
