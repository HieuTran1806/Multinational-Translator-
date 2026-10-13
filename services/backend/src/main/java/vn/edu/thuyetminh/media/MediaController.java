package vn.edu.thuyetminh.media;

import java.time.Duration;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.edu.thuyetminh.audio.AudioAsset;
import vn.edu.thuyetminh.audio.AudioAssetStatus;
import vn.edu.thuyetminh.audio.AudioService;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.poi.Poi;
import vn.edu.thuyetminh.poi.PoiAdminService;
import vn.edu.thuyetminh.poi.PoiPublicService;
import vn.edu.thuyetminh.poi.PoiTranslation;
import vn.edu.thuyetminh.poi.PoiTranslationRepository;

/**
 * Streams audio and images. Spring MVC handles HTTP Range requests for {@link Resource} bodies,
 * which mobile media players use for seeking/streaming.
 */
@RestController
@Tag(name = "Media")
public class MediaController {

    private final AudioService audioService;
    private final PoiTranslationRepository translations;
    private final PoiPublicService publicService;
    private final PoiAdminService adminService;
    private final MediaStorage storage;

    public MediaController(AudioService audioService, PoiTranslationRepository translations,
                           PoiPublicService publicService, PoiAdminService adminService, MediaStorage storage) {
        this.audioService = audioService;
        this.translations = translations;
        this.publicService = publicService;
        this.adminService = adminService;
        this.storage = storage;
    }

    @GetMapping("/api/v1/public/audio/{assetId}")
    @Operation(summary = "Phát/tải audio hiện hành của POI đã công khai")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> publicAudio(@PathVariable Long assetId) {
        AudioAsset a = audioService.findById(assetId).orElseThrow(() -> ApiException.notFound("Audio"));
        PoiTranslation t = translations.findById(a.getTranslationId())
                .orElseThrow(() -> ApiException.notFound("Audio"));
        // Only the current audio of a published POI is public; stale versions are never served.
        if (a.getStatus() != AudioAssetStatus.READY || a.getContentVersion() != t.getContentVersion()
                || !t.getPoi().isPublished()) {
            throw ApiException.notFound("Audio");
        }
        return stream(a.getStorageKey(), a.getMimeType(), true);
    }

    @GetMapping("/api/v1/admin/audio/{assetId}")
    @Operation(summary = "Nghe thử audio (quản trị, mọi trạng thái)")
    public ResponseEntity<Resource> adminAudio(@PathVariable Long assetId) {
        AudioAsset a = audioService.findById(assetId).orElseThrow(() -> ApiException.notFound("Audio"));
        return stream(a.getStorageKey(), a.getMimeType(), false);
    }

    @GetMapping("/api/v1/public/pois/{poiId}/image")
    public ResponseEntity<Resource> publicImage(@PathVariable Long poiId) {
        Poi p = publicService.requirePublished(poiId);
        if (p.getCoverImageKey() == null) {
            throw ApiException.notFound("Ảnh");
        }
        return stream(p.getCoverImageKey(), p.getCoverImageType(), true);
    }

    @GetMapping("/api/v1/admin/pois/{poiId}/image")
    public ResponseEntity<Resource> adminImage(@PathVariable Long poiId) {
        Poi p = adminService.requireEntity(poiId);
        if (p.getCoverImageKey() == null) {
            throw ApiException.notFound("Ảnh");
        }
        return stream(p.getCoverImageKey(), p.getCoverImageType(), false);
    }

    private ResponseEntity<Resource> stream(String key, String mime, boolean publicCache) {
        Resource r;
        try {
            r = storage.get(key);
        } catch (MediaNotFoundException | IllegalArgumentException e) {
            throw ApiException.notFound("File");
        }
        CacheControl cc = publicCache ? CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic()
                : CacheControl.noStore();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mime == null ? "application/octet-stream" : mime))
                .cacheControl(cc)
                .header("X-Content-Type-Options", "nosniff")
                .body(r);
    }
}
