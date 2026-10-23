package vn.edu.thuyetminh.poi;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import vn.edu.thuyetminh.audio.AudioService;
import vn.edu.thuyetminh.language.LanguageService;

/**
 * Pins the persistence order inside {@code upsertTranslation}: the narration change must be flushed
 * before audio invalidation, and the POI change must be flushed last. No Spring context, no database.
 */
class PoiAdminServiceTest {

    private final PoiStore pois = mock(PoiStore.class);
    private final PoiTranslationStore translations = mock(PoiTranslationStore.class);
    private final LanguageService languages = mock(LanguageService.class);
    private final AudioService audio = mock(AudioService.class);
    private final PoiAdminQueryService queries = mock(PoiAdminQueryService.class);
    private final PoiAdminService service = new PoiAdminService(pois, translations, languages, audio, queries,
            Clock.fixed(Instant.parse("2026-03-01T00:00:00Z"), ZoneOffset.UTC));

    @Test
    void changedNarrationSavesAndFlushesBeforeInvalidatingAudio() {
        Poi poi = mock(Poi.class);
        PoiTranslation translation = mock(PoiTranslation.class);
        when(pois.findActive(3L)).thenReturn(Optional.of(poi));
        when(translations.findByPoiAndLanguage(3L, "en")).thenReturn(Optional.of(translation));
        when(translation.getId()).thenReturn(7L);
        when(translation.update("Tên", "mô tả", "Thuyết minh mới")).thenReturn(true);

        service.upsertTranslation(3L, "en", new PoiDtos.TranslationUpsertRequest(" Tên ", " mô tả ", " Thuyết minh mới "));

        InOrder inOrder = inOrder(pois, languages, translations, audio, poi);
        inOrder.verify(pois).findActive(3L);
        inOrder.verify(languages).requireEnabled("en");
        inOrder.verify(translations).findByPoiAndLanguage(3L, "en");
        inOrder.verify(translations).saveNow(translation);
        inOrder.verify(audio).invalidateForTranslation(7L);
        inOrder.verify(poi).touch();
        inOrder.verify(pois).save(poi);
        inOrder.verify(translations).flush();
        verify(translations, never()).save(any());
    }

    @Test
    void unchangedNarrationKeepsAudioAndStillFlushesThePoiChange() {
        Poi poi = mock(Poi.class);
        PoiTranslation translation = mock(PoiTranslation.class);
        when(pois.findActive(3L)).thenReturn(Optional.of(poi));
        when(translations.findByPoiAndLanguage(3L, "en")).thenReturn(Optional.of(translation));
        when(translation.update("Tên", null, "Narration")).thenReturn(false);

        service.upsertTranslation(3L, "en", new PoiDtos.TranslationUpsertRequest("Tên", null, "Narration"));

        verify(translations, never()).saveNow(any());
        verify(audio, never()).invalidateForTranslation(any());
        verify(poi).touch();
        verify(pois).save(poi);
        verify(translations).flush();
    }

    @Test
    void newTranslationIsSavedWithoutImmediateFlush() {
        Poi poi = mock(Poi.class);
        when(pois.findActive(3L)).thenReturn(Optional.of(poi));
        when(translations.findByPoiAndLanguage(3L, "vi")).thenReturn(Optional.empty());
        when(translations.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.upsertTranslation(3L, "vi", new PoiDtos.TranslationUpsertRequest("Tên", null, "Narration"));

        verify(translations).save(any(PoiTranslation.class));
        verify(translations, never()).saveNow(any());
        verify(audio, never()).invalidateForTranslation(any());
        verify(pois).save(poi);
        verify(translations).flush();
    }
}
