package vn.edu.thuyetminh.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.core.io.Resource;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

class R2MediaStorageTest {

    @Test
    void putUsesConfiguredBucketKeyContentTypeAndLength() throws Exception {
        S3Client client = mock(S3Client.class);
        R2MediaStorage storage = new R2MediaStorage(client, "audio-bucket");
        byte[] bytes = "test audio".getBytes(StandardCharsets.UTF_8);

        storage.put("audio/test-01.wav", new ByteArrayInputStream(bytes), bytes.length, "audio/wav");

        ArgumentCaptor<PutObjectRequest> request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(client).putObject(request.capture(), any(software.amazon.awssdk.core.sync.RequestBody.class));
        assertThat(request.getValue().bucket()).isEqualTo("audio-bucket");
        assertThat(request.getValue().key()).isEqualTo("audio/test-01.wav");
        assertThat(request.getValue().contentType()).isEqualTo("audio/wav");
        assertThat(request.getValue().contentLength()).isEqualTo((long) bytes.length);
    }

    @Test
    void rejectsTraversalAndAbsoluteKeysBeforeCallingStorage() {
        S3Client client = mock(S3Client.class);
        R2MediaStorage storage = new R2MediaStorage(client, "audio-bucket");

        assertThatThrownBy(() -> storage.exists("../secret"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.exists("/audio/file.wav"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.exists("audio//file.wav"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void reportsObjectExistenceFromHeadObject() {
        S3Client client = mock(S3Client.class);
        when(client.headObject(any(HeadObjectRequest.class))).thenReturn(HeadObjectResponse.builder().build());
        R2MediaStorage storage = new R2MediaStorage(client, "audio-bucket");

        assertThat(storage.exists("audio/test.wav")).isTrue();
    }

    @Test
    void returnedResourceUsesHeadMetadataForRepeatableRangeReads() throws Exception {
        S3Client client = mock(S3Client.class);
        when(client.headObject(any(HeadObjectRequest.class)))
                .thenReturn(HeadObjectResponse.builder().contentLength(42L).build());
        R2MediaStorage storage = new R2MediaStorage(client, "audio-bucket");

        Resource resource = storage.get("audio/test.wav");

        assertThat(resource.getFilename()).isEqualTo("test.wav");
        assertThat(resource.contentLength()).isEqualTo(42L);
        verify(client, org.mockito.Mockito.times(2)).headObject(any(HeadObjectRequest.class));
    }

    @Test
    void constructorRequiresBucketAndClient() {
        assertThatThrownBy(() -> new R2MediaStorage(null, "bucket"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new R2MediaStorage(mock(S3Client.class), " "))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
