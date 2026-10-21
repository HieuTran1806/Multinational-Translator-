package vn.edu.thuyetminh.poi.persistence;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.common.web.PageResponse;
import vn.edu.thuyetminh.poi.Poi;
import vn.edu.thuyetminh.poi.PoiRepository;
import vn.edu.thuyetminh.poi.PoiStatus;
import vn.edu.thuyetminh.poi.PoiStore;

/** JPA adapter for {@link PoiStore}; the only place that knows about Spring Data paging and sorting. */
@Repository
public class JpaPoiStore implements PoiStore {

    private static final Sort ADMIN_LIST_ORDER = Sort.by(Sort.Direction.DESC, "updatedAt").and(Sort.by("id"));
    private static final Sort PUBLIC_LIST_ORDER = Sort.by("defaultName").and(Sort.by("id"));

    private final PoiRepository pois;

    public JpaPoiStore(PoiRepository pois) {
        this.pois = pois;
    }

    @Override
    public Optional<Poi> findActive(Long id) {
        return pois.findById(id).filter(poi -> !poi.isDeleted());
    }

    @Override
    public Optional<Poi> findPublished(Long id) {
        return pois.findByIdAndStatus(id, PoiStatus.PUBLISHED);
    }

    @Override
    public java.util.List<Poi> findDemoPublished() {
        return pois.findAll().stream().filter(Poi::isDemo).filter(Poi::isPublished).toList();
    }

    @Override
    public boolean isCodeTaken(String code) {
        return pois.existsByCode(code);
    }

    @Override
    public boolean isCodeTakenByOther(String code, Long id) {
        return pois.existsByCodeAndIdNot(code, id);
    }

    @Override
    public PageResponse<Poi> search(PoiStatus status, String nameOrCodeLike, int page, int size) {
        return toPageResponse(pois.search(status, nameOrCodeLike, PageRequests.of(page, size, ADMIN_LIST_ORDER)));
    }

    @Override
    public PageResponse<Poi> listPublished(int page, int size) {
        return toPageResponse(pois.findByStatus(PoiStatus.PUBLISHED, PageRequests.of(page, size, PUBLIC_LIST_ORDER)));
    }

    @Override
    public Poi save(Poi poi) {
        return pois.save(poi);
    }

    @Override
    public Poi saveNow(Poi poi) {
        return pois.saveAndFlush(poi);
    }

    private static PageResponse<Poi> toPageResponse(Page<Poi> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
