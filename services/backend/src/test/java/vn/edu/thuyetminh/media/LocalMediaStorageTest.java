package vn.edu.thuyetminh.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalMediaStorageTest {

    @TempDir
    Path dir;

    @Test
    void storesAndReadsBack() throws Exception {
        LocalMediaStorage s = new LocalMediaStorage(dir);
        s.put("audio/abc-123.mp3", new ByteArrayInputStream(new byte[]{1, 2, 3}), 3, "audio/mpeg");
        assertThat(s.exists("audio/abc-123.mp3")).isTrue();
        assertThat(Files.readAllBytes(s.get("audio/abc-123.mp3").getFile().toPath())).containsExactly(1, 2, 3);
        s.delete("audio/abc-123.mp3");
        assertThat(s.exists("audio/abc-123.mp3")).isFalse();
    }

    @Test
    void rejectsPathTraversalAndOddKeys() throws Exception {
        LocalMediaStorage s = new LocalMediaStorage(dir);
        for (String bad : new String[]{"../etc/passwd", "audio/../../x.mp3", "/abs/x.mp3", "audio/x", "a\\b.mp3",
                "", "audio/x.mp3/../../y.mp3"}) {
            assertThatThrownBy(() -> s.resolve(bad)).as(bad).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    void missingFileIsReportedAsNotFound() throws Exception {
        LocalMediaStorage s = new LocalMediaStorage(dir);
        assertThatThrownBy(() -> s.get("audio/missing.mp3")).isInstanceOf(MediaNotFoundException.class);
    }
}
