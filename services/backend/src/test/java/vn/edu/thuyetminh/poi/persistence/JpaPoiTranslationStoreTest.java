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

import vn.edu.thuyetminh.poi.Poi;
import vn.edu.thuyetminh.poi.PoiTranslation;
import vn.edu.thuyetminh.poi.PoiTranslationRepository;

class JpaPoiTranslationStoreTest {

    private final PoiTranslationRepository repository = mock(PoiTranslationRepository.class);
    private final JpaPoiTranslationStore store = new JpaPoiTranslationStore(repository);
    private final PoiTranslation translation = new PoiTranslation(
            new Poi("P1", "Tên", 10, 106), "en", "Name", "desc", "Narration");

    @Test
    void listByPoiKeepsTheLanguageOrderedQuery() {
        when(repository.findByPoiIdOrderByLanguageCodeAsc(7L)).thenReturn(List.of(translation));

        assertThat(store.listByPoi(7L)).containsExactly(translation);
        verify(repository).findByPoiIdOrderByLanguageCodeAsc(7L);
    }

    @Test
    void listByPoisPassesTheIdCollectionThrough() {
        List<Long> poiIds = List.of(1L, 2L);
        when(repository.findByPoiIdIn(poiIds)).thenReturn(List.of(translation));

        assertThat(store.listByPois(poiIds)).containsExactly(translation);
        verify(repository).findByPoiIdIn(poiIds);
    }

    @Test
    void findByPoiAndLanguageKeepsBothQueryArguments() {
        when(repository.findByPoiIdAndLanguageCode(7L, "vi")).thenReturn(Optional.of(translation));

        assertThat(store.findByPoiAndLanguage(7L, "vi")).contains(translation);
        verify(repository).findByPoiIdAndLanguageCode(7L, "vi");
    }

    @Test
    void saveDoesNotFlush() {
        when(repository.save(translation)).thenReturn(translation);

        assertThat(store.save(translation)).isSameAs(translation);
        verify(repository).save(translation);
        verify(repository, never()).saveAndFlush(any());
        verify(repository, never()).flush();
    }

    @Test
    void saveNowFlushesImmediately() {
        when(repository.saveAndFlush(translation)).thenReturn(translation);

        assertThat(store.saveNow(translation)).isSameAs(translation);
        verify(repository).saveAndFlush(translation);
        verify(repository, never()).save(any());
    }

    @Test
    void flushFlushesThePersistenceContext() {
        store.flush();

        verify(repository).flush();
    }
}
