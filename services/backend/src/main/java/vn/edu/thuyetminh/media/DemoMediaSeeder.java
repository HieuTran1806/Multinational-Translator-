package vn.edu.thuyetminh.media;

import java.io.ByteArrayInputStream;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.poi.Poi;
import vn.edu.thuyetminh.poi.PoiStore;

/**
 * DEV PROFILE ONLY. Creates a minimal 1x1 PNG placeholder and attaches it as cover image
 * to demo POIs that have no cover yet. Idempotent: skips if file or cover already exists.
 */
@Component
@Profile("dev")
public class DemoMediaSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoMediaSeeder.class);
    static final String PLACEHOLDER_KEY = "images/demo-placeholder.png";

    // Minimal valid 1x1 white PNG (67 bytes)
    private static final byte[] PNG_1X1 = {
        (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
        0x08, 0x02, 0x00, 0x00, 0x00, (byte) 0x90, 0x77, 0x53, // 8-bit RGB
        (byte) 0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, (byte) 0xD7, 0x63, (byte) 0xF8, (byte) 0xCF, (byte) 0xC0, 0x00,
        0x00, 0x00, 0x02, 0x00, 0x01, (byte) 0xE2, 0x21, (byte) 0xBC,
        0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
        0x44, (byte) 0xAE, 0x42, 0x60, (byte) 0x82
    };

    private final MediaStorage storage;
    private final PoiStore pois;

    public DemoMediaSeeder(MediaStorage storage, PoiStore pois) {
        this.storage = storage;
        this.pois = pois;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensurePlaceholder();
        attachCoverImages();
    }

    private void ensurePlaceholder() {
        if (storage.exists(PLACEHOLDER_KEY)) {
            return;
        }
        try {
            storage.put(PLACEHOLDER_KEY, new ByteArrayInputStream(PNG_1X1), PNG_1X1.length, "image/png");
            log.info("[DEMO] created placeholder image {}", PLACEHOLDER_KEY);
        } catch (Exception e) {
            log.warn("[DEMO] could not create placeholder image: {}", e.getMessage());
        }
    }

    private void attachCoverImages() {
        List<Poi> demoPois = pois.findDemoPublished();
        for (Poi p : demoPois) {
            if (p.getCoverImageKey() != null) {
                continue;
            }
            p.setCoverImage(PLACEHOLDER_KEY, "image/png");
            pois.save(p);
            log.info("[DEMO] attached placeholder cover to POI {}", p.getCode());
        }
    }
}
