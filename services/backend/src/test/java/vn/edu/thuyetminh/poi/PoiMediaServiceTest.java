package vn.edu.thuyetminh.poi;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import vn.edu.thuyetminh.audio.AudioService;
import vn.edu.thuyetminh.media.MediaStorage;

/**
 * Pins the order of {@code deleteImage}: row removal before the remaining-image query, persistence
 * before the physical file delete. No Spring context, no database.
 */
class PoiMediaServiceTest {

    private final PoiStore pois = mock(PoiStore.class);
    private final PoiTranslationStore translations = mock(PoiTranslationStore.class);
    private final PoiImageStore images = mock(PoiImageStore.class);
    private final PoiAdminQueryService queries = mock(PoiAdminQueryService.class);
    private final AudioService audio = mock(AudioService.class);
    private final MediaStorage storage = mock(MediaStorage.class);
    private final PoiMediaService service = new PoiMediaService(pois, translations, images, queries, audio, storage,
            null);

    @Test
    void deletingTheCoverImageRenumbersTheRestAndDeletesTheFileAfterPersisting() throws Exception {
        Poi poi = mock(Poi.class);
        PoiImage deleted = mock(PoiImage.class);
        PoiImage remaining = mock(PoiImage.class);
        when(pois.findActive(3L)).thenReturn(Optional.of(poi));
        when(images.findByPoiAndId(3L, 9L)).thenReturn(Optional.of(deleted));
        when(deleted.getStorageKey()).thenReturn("images/a.jpg");
        when(poi.getCoverImageKey()).thenReturn("images/a.jpg");
        when(images.listByPoi(3L)).thenReturn(List.of(remaining));
        when(remaining.getStorageKey()).thenReturn("images/b.png");
        when(remaining.getMimeType()).thenReturn("image/png");

        service.deleteImage(3L, 9L);

        InOrder inOrder = inOrder(pois, images, poi, remaining, storage, queries);
        inOrder.verify(pois).findActive(3L);
        inOrder.verify(images).findByPoiAndId(3L, 9L);
        inOrder.verify(images).delete(deleted);
        inOrder.verify(images).listByPoi(3L);
        inOrder.verify(remaining).setSortOrder(0);
        inOrder.verify(poi).setCoverImage("images/b.png", "image/png");
        inOrder.verify(poi).touch();
        inOrder.verify(pois).saveNow(poi);
        inOrder.verify(storage).delete("images/a.jpg");
        inOrder.verify(queries).get(3L);
        verify(images, never()).saveNow(any());
        verify(images, never()).saveAll(any());
    }

    @Test
    void deletingANonCoverImageKeepsTheCoverAndStillDeletesTheFileLast() throws Exception {
        Poi poi = mock(Poi.class);
        PoiImage deleted = mock(PoiImage.class);
        when(pois.findActive(3L)).thenReturn(Optional.of(poi));
        when(images.findByPoiAndId(3L, 9L)).thenReturn(Optional.of(deleted));
        when(deleted.getStorageKey()).thenReturn("images/a.jpg");
        when(poi.getCoverImageKey()).thenReturn("images/cover.jpg");
        when(images.listByPoi(3L)).thenReturn(List.of());

        service.deleteImage(3L, 9L);

        InOrder inOrder = inOrder(images, poi, pois, storage);
        inOrder.verify(images).delete(deleted);
        inOrder.verify(images).listByPoi(3L);
        inOrder.verify(pois).saveNow(poi);
        inOrder.verify(storage).delete("images/a.jpg");
        verify(poi, never()).setCoverImage(any(), any());
    }
}
