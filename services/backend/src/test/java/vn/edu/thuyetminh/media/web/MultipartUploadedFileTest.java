package vn.edu.thuyetminh.media.web;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class MultipartUploadedFileTest {
    @Test
    void exposesUploadMetadataAndStreamWithoutLeakingSpringTypeToApplicationCode() throws Exception {
        byte[] content = "audio-content".getBytes(StandardCharsets.UTF_8);
        var file = new MultipartUploadedFile(new MockMultipartFile("file", "voice.wav", "audio/wav", content));

        assertThat(file.isEmpty()).isFalse();
        assertThat(file.size()).isEqualTo(content.length);
        assertThat(file.originalFilename()).isEqualTo("voice.wav");
        try (var input = file.openStream()) {
            assertThat(input.readAllBytes()).containsExactly(content);
        }
    }
}
