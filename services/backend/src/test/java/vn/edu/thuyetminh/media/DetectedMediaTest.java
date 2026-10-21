package vn.edu.thuyetminh.media;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

class DetectedMediaTest {

    private static byte[] pad(byte[] head) {
        byte[] b = new byte[16];
        System.arraycopy(head, 0, b, 0, head.length);
        return b;
    }

    @Test
    void detectsSupportedAudioAndImages() {
        assertThat(DetectedMedia.detect(pad("ID3".getBytes(StandardCharsets.US_ASCII)))).isEqualTo(DetectedMedia.MP3);
        assertThat(DetectedMedia.detect(pad(new byte[]{(byte) 0xFF, (byte) 0xFB}))).isEqualTo(DetectedMedia.MP3);
        assertThat(DetectedMedia.detect(pad("RIFF\0\0\0\0WAVE".getBytes(StandardCharsets.US_ASCII))))
                .isEqualTo(DetectedMedia.WAV);
        assertThat(DetectedMedia.detect(pad("OggS".getBytes(StandardCharsets.US_ASCII)))).isEqualTo(DetectedMedia.OGG);
        assertThat(DetectedMedia.detect(pad("\0\0\0 ftypM4A ".getBytes(StandardCharsets.ISO_8859_1))))
                .isEqualTo(DetectedMedia.M4A);
        assertThat(DetectedMedia.detect(pad(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF})))
                .isEqualTo(DetectedMedia.JPEG);
        assertThat(DetectedMedia.detect(pad(new byte[]{(byte) 0x89, 'P', 'N', 'G'}))).isEqualTo(DetectedMedia.PNG);
    }

    @Test
    void rejectsUnknownOrTooShortContent() {
        assertThat(DetectedMedia.detect(pad("<html>".getBytes(StandardCharsets.US_ASCII)))).isNull();
        assertThat(DetectedMedia.detect(pad("%PDF-1.7".getBytes(StandardCharsets.US_ASCII)))).isNull();
        assertThat(DetectedMedia.detect(new byte[3])).isNull();
        assertThat(DetectedMedia.detect(null)).isNull();
    }
}
