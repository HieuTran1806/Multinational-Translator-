package vn.edu.thuyetminh.media;

public class MediaNotFoundException extends RuntimeException {

    public MediaNotFoundException(String key) {
        super("Media not found: " + key);
    }
}
