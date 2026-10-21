package vn.edu.thuyetminh.tts;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import vn.edu.thuyetminh.common.config.AppProperties;

@Configuration
public class TtsConfig {

    private static final Logger log = LoggerFactory.getLogger(TtsConfig.class);

    @Bean
    TtsProvider ttsProvider(AppProperties props) {
        String p = props.tts().provider() == null ? "none" : props.tts().provider().trim().toLowerCase();
        return switch (p) {
            case "google" -> new GoogleCloudTtsProvider(props.tts().requestTimeout());
            case "none", "" -> {
                log.info("TTS provider disabled (APP_TTS_PROVIDER=none). Upload audio manually.");
                yield new DisabledTtsProvider("Chưa cấu hình dịch vụ TTS (APP_TTS_PROVIDER=none)");
            }
            default -> throw new IllegalStateException("Unknown APP_TTS_PROVIDER: " + p);
        };
    }
}
