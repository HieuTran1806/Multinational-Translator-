package vn.edu.thuyetminh.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Tests for atomic write integrity, error handling, and key validation edge cases.
 */
class LocalMediaStorageIntegrityTest {

    @TempDir
    Path dir;

    @Test
    void failedWriteDoesNotLeavePartialFile() throws Exception {
        LocalMediaStorage s = new LocalMediaStorage(dir);
        String key = "audio/test-file.mp3";

        InputStream failingStream = new InputStream() {
            int count = 0;
            @Override
            public int read() throws IOException {
                if (count++ >= 5) throw new IOException("simulated write failure");
                return 0x42;
            }
        };

        assertThatThrownBy(() -> s.put(key, failingStream, 100, "audio/mpeg"))
                .isInstanceOf(IOException.class);

        // The target file must not exist after a failed put
        assertThat(s.exists(key)).isFalse();

        // No orphaned temp files should remain in the parent directory
        Path parent = dir.resolve("audio");
        if (Files.isDirectory(parent)) {
            long tmpFiles = Files.list(parent)
                    .filter(p -> p.getFileName().toString().startsWith(".upload-"))
                    .count();
            assertThat(tmpFiles).isZero();
        }
    }

    @Test
    void rejectsKeyWithUnderscoreInDirectorySegment() throws Exception {
        LocalMediaStorage s = new LocalMediaStorage(dir);
        // KEY_PATTERN allows [a-z0-9] for directory segments, underscores only in filename
        assertThatThrownBy(() -> s.resolve("my_dir/file.mp3"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void acceptsValidKeysWithHyphensAndDots() throws Exception {
        LocalMediaStorage s = new LocalMediaStorage(dir);
        // Should not throw
        s.resolve("images/my-demo-file.png");
        s.resolve("audio/recording-01.wav");
        s.resolve("media/sub-dir/deep/file.m4a");
    }

    @Test
    void rejectsKeyExceedingExtensionLength() throws Exception {
        LocalMediaStorage s = new LocalMediaStorage(dir);
        // Extension must be 2-5 chars per regex
        assertThatThrownBy(() -> s.resolve("audio/file.toolongext"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void exceptionMessageDoesNotLeakInternalPath() throws Exception {
        LocalMediaStorage s = new LocalMediaStorage(dir);
        try {
            s.get("../secret.txt");
        } catch (IllegalArgumentException e) {
            assertThat(e.getMessage()).doesNotContain(dir.toString());
        }
    }

    @Test
    void mediaNotFoundExceptionContainsKeyNotPath() throws Exception {
        LocalMediaStorage s = new LocalMediaStorage(dir);
        try {
            s.get("audio/nonexistent.mp3");
        } catch (MediaNotFoundException e) {
            assertThat(e.getMessage()).contains("audio/nonexistent.mp3");
            assertThat(e.getMessage()).doesNotContain(dir.toString());
        }
    }
}
