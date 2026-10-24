package vn.edu.thuyetminh.poi.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.web.PageResponse;
import vn.edu.thuyetminh.poi.Poi;
import vn.edu.thuyetminh.poi.PoiRepository;
import vn.edu.thuyetminh.poi.PoiStatus;

class JpaPoiStoreTest {

    private final PoiRepository repository = mock(PoiRepository.class);
    private final JpaPoiStore store = new JpaPoiStore(repository);

    @Test
    void searchKeepsAdminOrderAndCopiesPageMetadata() {
        Poi poi = new Poi("BEN-DUOC", "Bến Dược", 11.14, 106.46);
        when(repository.search(isNull(), eq("%bến%"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(poi), PageRequest.of(1, 2), 5));

        PageResponse<Poi> result = store.search(null, "%bến%", 1, 2);

        assertThat(result.items()).containsExactly(poi);
        assertThat(result.page()).isEqualTo(1);
        assertThat(result.size()).isEqualTo(2);
        assertThat(result.totalItems()).isEqualTo(5);
        assertThat(result.totalPages()).isEqualTo(3);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).search(isNull(), eq("%bến%"), pageable.capture());
        assertThat(ordersOf(pageable.getValue())).containsExactly("updatedAt:DESC", "id:ASC");
    }

    @Test
    void listPublishedOnlyAsksForPublishedPoisOrderedByName() {
        when(repository.findByStatus(eq(PoiStatus.PUBLISHED), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        store.listPublished(0, 20);

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findByStatus(eq(PoiStatus.PUBLISHED), pageable.capture());
        assertThat(ordersOf(pageable.getValue())).containsExactly("defaultName:ASC", "id:ASC");
    }

    @Test
    void findActiveHidesSoftDeletedPois() {
        Poi deleted = new Poi("OLD", "Cũ", 10, 106);
        deleted.softDelete(Instant.parse("2026-01-01T00:00:00Z"));
        when(repository.findById(1L)).thenReturn(Optional.of(deleted));

        assertThat(store.findActive(1L)).isEmpty();
    }

    @Test
    void outOfRangePageSizeIsRejectedBeforeQuerying() {
        assertThrows(ApiException.class, () -> store.search(null, null, 0, 101));

        verify(repository, never()).search(any(), any(), any());
    }

    private static List<String> ordersOf(Pageable pageable) {
        Sort sort = pageable.getSort();
        return sort.stream().map(order -> order.getProperty() + ":" + order.getDirection()).toList();
    }
}
