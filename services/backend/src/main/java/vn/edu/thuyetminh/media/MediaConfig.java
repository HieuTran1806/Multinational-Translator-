package vn.edu.thuyetminh.media;

import java.io.IOException;
import java.nio.file.Path;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import vn.edu.thuyetminh.common.config.AppProperties;

@Configuration
public class MediaConfig {

    @Bean
    MediaStorage mediaStorage(AppProperties props) throws IOException {
        return new LocalMediaStorage(Path.of(props.storage().localRoot()));
    }
}
