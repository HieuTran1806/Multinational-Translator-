package vn.edu.thuyetminh.media;

import java.io.IOException;
import java.io.InputStream;
import java.util.regex.Pattern;

import org.springframework.core.io.AbstractResource;
import org.springframework.core.io.Resource;

import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/** Durable object storage backed by an S3-compatible endpoint such as Cloudflare R2. */
public final class R2MediaStorage implements MediaStorage, AutoCloseable {

    private static final Pattern KEY_PATTERN =
            Pattern.compile("^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,254}$");

    private final S3Client client;
    private final String bucket;

    public R2MediaStorage(S3Client client, String bucket) {
        if (client == null || bucket == null || bucket.isBlank()) {
            throw new IllegalArgumentException("R2 client and bucket are required");
        }
        this.client = client;
        this.bucket = bucket;
    }

    @Override
    public void put(String key, InputStream data, long sizeBytes, String contentType) throws IOException {
        validateKey(key);
        if (sizeBytes < 0) throw new IllegalArgumentException("Invalid media size");
        try {
            client.putObject(PutObjectRequest.builder()
                            .bucket(bucket).key(key).contentType(contentType).contentLength(sizeBytes).build(),
                    RequestBody.fromInputStream(data, sizeBytes));
        } catch (SdkException e) {
            throw new IOException("Could not store media object", e);
        }
    }

    /**
     * Returns a repeatable resource. Spring MVC may open it more than once when serving byte ranges,
     * so each read obtains a fresh object stream and contentLength comes from HEAD metadata.
     */
    @Override
    public Resource get(String key) {
        validateKey(key);
        head(key); // Fail as a normal not-found error before the response is committed.
        return new R2Resource(client, bucket, key);
    }

    @Override
    public boolean exists(String key) {
        validateKey(key);
        try {
            client.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
            return true;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) return false;
            throw e;
        }
    }

    @Override
    public void delete(String key) throws IOException {
        validateKey(key);
        try {
            client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (SdkException e) {
            throw new IOException("Could not delete media object", e);
        }
    }

    private long head(String key) {
        try {
            return client.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build()).contentLength();
        } catch (S3Exception e) {
            if (e.statusCode() == 404) throw new MediaNotFoundException(key);
            throw e;
        }
    }

    private static void validateKey(String key) {
        if (key == null || !KEY_PATTERN.matcher(key).matches()
                || key.startsWith("/") || key.contains("//")
                || java.util.Arrays.stream(key.split("/", -1)).anyMatch(part -> part.equals(".") || part.equals(".."))) {
            throw new IllegalArgumentException("Invalid storage key");
        }
    }

    @Override
    public void close() {
        client.close();
    }

    private static final class R2Resource extends AbstractResource {
        private final S3Client client;
        private final String bucket;
        private final String key;

        private R2Resource(S3Client client, String bucket, String key) {
            this.client = client;
            this.bucket = bucket;
            this.key = key;
        }

        @Override
        public InputStream getInputStream() throws IOException {
            try {
                ResponseInputStream<GetObjectResponse> stream = client.getObject(
                        GetObjectRequest.builder().bucket(bucket).key(key).build());
                return stream;
            } catch (SdkException e) {
                if (e instanceof S3Exception s3 && s3.statusCode() == 404) {
                    throw new MediaNotFoundException(key);
                }
                throw new IOException("Could not read media object", e);
            }
        }

        @Override
        public long contentLength() {
            try {
                return client.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build()).contentLength();
            } catch (S3Exception e) {
                if (e.statusCode() == 404) throw new MediaNotFoundException(key);
                throw e;
            }
        }

        @Override
        public String getFilename() {
            return key.substring(key.lastIndexOf('/') + 1);
        }

        @Override
        public String getDescription() {
            return "R2 media object";
        }
    }
}
