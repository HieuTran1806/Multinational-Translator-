package vn.edu.thuyetminh.media;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.regex.Pattern;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

/**
 * Stores files below a root directory (mounted as a Docker volume in compose).
 * Keys are validated against a strict pattern and resolved paths must stay inside the root.
 * Not suitable for ephemeral container filesystems in production — see docs/deployment.md.
 */
public class LocalMediaStorage implements MediaStorage {

    static final Pattern KEY_PATTERN = Pattern.compile("^[a-z0-9]+(/[a-z0-9-]+)*/[a-zA-Z0-9-]+\\.[a-z0-9]{2,5}$");

    private final Path root;

    public LocalMediaStorage(Path root) throws IOException {
        this.root = root.toAbsolutePath().normalize();
        Files.createDirectories(this.root);
    }

    @Override
    public void put(String key, InputStream data, long sizeBytes, String contentType) throws IOException {
        Path target = resolve(key);
        Files.createDirectories(target.getParent());
        Path tmp = Files.createTempFile(target.getParent(), ".upload-", ".tmp");
        try {
            Files.copy(data, tmp, StandardCopyOption.REPLACE_EXISTING);
            Files.move(tmp, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } finally {
            Files.deleteIfExists(tmp);
        }
    }

    @Override
    public Resource get(String key) {
        Path p = resolve(key);
        if (!Files.isRegularFile(p)) {
            throw new MediaNotFoundException(key);
        }
        return new FileSystemResource(p);
    }

    @Override
    public boolean exists(String key) {
        return Files.isRegularFile(resolve(key));
    }

    @Override
    public void delete(String key) throws IOException {
        Files.deleteIfExists(resolve(key));
    }

    Path resolve(String key) {
        if (key == null || !KEY_PATTERN.matcher(key).matches()) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        Path p = root.resolve(key).normalize();
        if (!p.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return p;
    }
}
