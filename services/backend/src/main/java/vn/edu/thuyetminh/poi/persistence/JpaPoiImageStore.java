package vn.edu.thuyetminh.poi.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.poi.PoiImage;
import vn.edu.thuyetminh.poi.PoiImageRepository;
import vn.edu.thuyetminh.poi.PoiImageStore;

/** JPA adapter for {@link PoiImageStore}; the only place that knows the Spring Data repository. */
@Repository
public class JpaPoiImageStore implements PoiImageStore {

    private final PoiImageRepository images;

    public JpaPoiImageStore(PoiImageRepository images) {
        this.images = images;
    }

    @Override
    public Optional<PoiImage> findByPoiAndId(Long poiId, Long imageId) {
        return images.findByIdAndPoiId(imageId, poiId);
    }

    @Override
    public List<PoiImage> listByPoi(Long poiId) {
        return images.findByPoiIdOrderBySortOrderAscIdAsc(poiId);
    }

    @Override
    public long countByPoi(Long poiId) {
        return images.countByPoiId(poiId);
    }

    @Override
    public PoiImage saveNow(PoiImage image) {
        return images.saveAndFlush(image);
    }

    @Override
    public void saveAll(List<PoiImage> images) {
        this.images.saveAll(images);
    }

    @Override
    public void delete(PoiImage image) {
        images.delete(image);
    }
}
