package vn.edu.thuyetminh.media;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import vn.edu.thuyetminh.common.config.AppProperties;

@Configuration
public class MediaConfig {

    @Bean
    @ConditionalOnProperty(prefix = "app.storage", name = "provider", havingValue = "local", matchIfMissing = true)
    MediaStorage localMediaStorage(AppProperties props) throws IOException {
        return new LocalMediaStorage(Path.of(props.storage().localRoot()));
    }

    @Bean
    @ConditionalOnProperty(prefix = "app.storage", name = "provider", havingValue = "r2")
    R2MediaStorage r2MediaStorage(
            @Value("${R2_ENDPOINT:}") String endpoint,
            @Value("${R2_BUCKET:}") String bucket,
            @Value("${R2_ACCESS_KEY_ID:}") String accessKeyId,
            @Value("${R2_SECRET_ACCESS_KEY:}") String secretAccessKey,
            @Value("${R2_REGION:auto}") String region) {
        require(endpoint, "R2_ENDPOINT");
        require(bucket, "R2_BUCKET");
        require(accessKeyId, "R2_ACCESS_KEY_ID");
        require(secretAccessKey, "R2_SECRET_ACCESS_KEY");
        S3Client client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                .build();
        return new R2MediaStorage(client, bucket);
    }

    private static void require(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required storage configuration: " + name);
        }
    }
}
