package vn.edu.thuyetminh.poi;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PoiTranslationTest {

    @Test
    void contentVersionChangesOnlyWhenNarrationChanges() {
        PoiTranslation t = new PoiTranslation(new Poi("P1", "Name", 10, 106), "en", "A", "d", "Hello");
        assertThat(t.getContentVersion()).isEqualTo(1);

        assertThat(t.update("B", "new description", "Hello")).isFalse();
        assertThat(t.getContentVersion()).isEqualTo(1);

        assertThat(t.update("B", "new description", "Hello world")).isTrue();
        assertThat(t.getContentVersion()).isEqualTo(2);
    }

    @Test
    void publicFallbackPrefersRequestedThenVietnamese() {
        Poi p = new Poi("P1", "Name", 10, 106);
        var vi = new PoiTranslation(p, "vi", "VI", null, "x");
        var en = new PoiTranslation(p, "en", "EN", null, "y");
        assertThat(PoiPublicService.pick(java.util.List.of(vi, en), "en")).contains(en);
        assertThat(PoiPublicService.pick(java.util.List.of(vi, en), "ja")).contains(vi);
        assertThat(PoiPublicService.pick(java.util.List.of(en), "ja")).contains(en);
        assertThat(PoiPublicService.pick(java.util.List.of(), "vi")).isEmpty();
    }
}
