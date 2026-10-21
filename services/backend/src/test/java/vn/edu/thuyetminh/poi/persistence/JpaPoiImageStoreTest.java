package vn.edu.thuyetminh.poi.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import vn.edu.thuyetminh.poi.PoiImage;
import vn.edu.thuyetminh.poi.PoiImageRepository;

class JpaPoiImageStoreTest {

    private final PoiImageRepository repository = mock(PoiImageRepository.class);
    private final JpaPoiImageStore store = new JpaPoiImageStore(repository);
    private final PoiImage image = new PoiImage(5L, "images/a.jpg", "image/jpeg", 0);

    @Test
    void findByPoiAndIdKeepsTheRepositoryArgumentOrder() {
        when(repository.findByIdAndPoiId(9L, 5L)).thenReturn(Optional.of(image));

        assertThat(store.findByPoiAndId(5L, 9L)).contains(image);
        verify(repository).findByIdAndPoiId(9L, 5L);
    }

    @Test
    void listByPoiKeepsTheSortOrderQuery() {
        when(repository.findByPoiIdOrderBySortOrderAscIdAsc(5L)).thenReturn(List.of(image));

        assertThat(store.listByPoi(5L)).containsExactly(image);
        verify(repository).findByPoiIdOrderBySortOrderAscIdAsc(5L);
    }

    @Test
    void countByPoiReturnsTheRepositoryCount() {
        when(repository.countByPoiId(5L)).thenReturn(3L);

        assertThat(store.countByPoi(5L)).isEqualTo(3L);
        verify(repository).countByPoiId(5L);
    }

    @Test
    void saveNowFlushesImmediately() {
        when(repository.saveAndFlush(image)).thenReturn(image);

        assertThat(store.saveNow(image)).isSameAs(image);
        verify(repository).saveAndFlush(image);
        verify(repository, never()).save(any());
    }

    @Test
    void saveAllPassesTheListThrough() {
        List<PoiImage> images = List.of(image);

        store.saveAll(images);

        verify(repository).saveAll(images);
    }

    @Test
    void deleteRemovesByEntityWithoutFlushing() {
        store.delete(image);

        verify(repository).delete(image);
        verify(repository, never()).deleteById(any());
        verify(repository, never()).flush();
    }
}
