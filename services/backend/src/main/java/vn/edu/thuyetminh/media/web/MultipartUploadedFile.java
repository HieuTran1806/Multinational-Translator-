package vn.edu.thuyetminh.media.web;

import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

import org.springframework.web.multipart.MultipartFile;

import vn.edu.thuyetminh.media.UploadedFile;

/** Adapts Spring MVC's upload type to the application-facing file contract. */
public final class MultipartUploadedFile implements UploadedFile {
    private final MultipartFile file;

    public MultipartUploadedFile(MultipartFile file) {
        this.file = Objects.requireNonNull(file, "file");
    }

    @Override
    public boolean isEmpty() {
        return file.isEmpty();
    }

    @Override
    public long size() {
        return file.getSize();
    }

    @Override
    public String originalFilename() {
        return file.getOriginalFilename();
    }

    @Override
    public InputStream openStream() throws IOException {
        return file.getInputStream();
    }
}
