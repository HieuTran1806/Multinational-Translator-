package vn.edu.thuyetminh.media;

import java.io.IOException;
import java.io.InputStream;

/** Framework-independent view of an uploaded file used by application services. */
public interface UploadedFile {
    boolean isEmpty();
    long size();
    String originalFilename();
    InputStream openStream() throws IOException;
}
