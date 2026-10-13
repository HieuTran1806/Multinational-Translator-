package vn.edu.thuyetminh.tts;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ContentHashTest {

    @Test
    void hashChangesWithTextLanguageOrVoice() {
        String base = TtsJobService.contentHash("google", "vi-VN", null, "Xin chào");
        assertThat(TtsJobService.contentHash("google", "vi-VN", null, "Xin chào")).isEqualTo(base);
        assertThat(TtsJobService.contentHash("google", "vi-VN", null, "Xin chào!")).isNotEqualTo(base);
        assertThat(TtsJobService.contentHash("google", "en-US", null, "Xin chào")).isNotEqualTo(base);
        assertThat(TtsJobService.contentHash("google", "vi-VN", "vi-VN-Standard-A", "Xin chào")).isNotEqualTo(base);
        assertThat(base).hasSize(64);
    }
}
