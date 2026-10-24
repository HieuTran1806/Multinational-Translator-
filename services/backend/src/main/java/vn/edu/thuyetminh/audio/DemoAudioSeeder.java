package vn.edu.thuyetminh.audio;

import java.io.IOException;
import java.io.InputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.poi.PoiStore;
import vn.edu.thuyetminh.poi.PoiTranslationStore;

/**
 * DEV PROFILE ONLY. Attaches the bundled demo WAV fixtures (simple tones, NOT speech) to the
 * published demo POIs if they have no current audio, so the mobile flow can be demonstrated
 * without Google Cloud credentials. These files are marked as uploads named "demo-*.wav".
 */
@Component
@Profile("dev")
public class DemoAudioSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoAudioSeeder.class);

    private final PoiStore pois;
    private final PoiTranslationStore translations;
    private final AudioService audioService;

    public DemoAudioSeeder(PoiStore pois, PoiTranslationStore translations, AudioService audioService) {
        this.pois = pois;
        this.translations = translations;
        this.audioService = audioService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        pois.findDemoPublished().forEach(p ->
                translations.listByPoi(p.getId()).forEach(t -> {
                    if (audioService.currentAudio(t).isPresent()) {
                        return;
                    }
                    String name = "demo-" + t.getLanguageCode() + ".wav";
                    ClassPathResource res = new ClassPathResource("demo-audio/" + name);
                    if (!res.exists()) {
                        return;
                    }
                    try (InputStream in = res.getInputStream()) {
                        audioService.storeUploadBytes(t, in.readAllBytes(), name);
                        log.info("[DEMO] attached {} to POI {} ({})", name, p.getCode(), t.getLanguageCode());
                    } catch (IOException e) {
                        log.warn("[DEMO] could not attach demo audio: {}", e.getMessage());
                    }
                }));
    }
}
