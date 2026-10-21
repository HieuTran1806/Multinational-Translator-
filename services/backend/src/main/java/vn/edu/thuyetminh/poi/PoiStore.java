package vn.edu.thuyetminh.poi;

import java.util.Optional;

import vn.edu.thuyetminh.common.web.PageResponse;

/**
 * Persistence port for the POI aggregate. Application services depend on this contract instead of
 * the Spring Data repository, so query paging, sorting and the soft-delete filter stay in the
 * adapter. Only the operations the application actually uses are declared here.
 */
public interface PoiStore {

    /** A POI that has not been soft-deleted. */
    Optional<Poi> findActive(Long id);

    /** A POI that is published (soft-deleted or draft POIs are reported as absent). */
    Optional<Poi> findPublished(Long id);

    java.util.List<Poi> findDemoPublished();

    boolean isCodeTaken(String code);

    boolean isCodeTakenByOther(String code, Long id);

    /** Admin list: every status, newest change first. */
    PageResponse<Poi> search(PoiStatus status, String nameOrCodeLike, int page, int size);

    /** Public list: published POIs ordered by name. */
    PageResponse<Poi> listPublished(int page, int size);

    Poi save(Poi poi);

    /**
     * Saves and synchronises with the database immediately, so optimistic-locking and
     * unique-constraint violations are raised inside the use case (before the read model is built).
     */
    Poi saveNow(Poi poi);
}
