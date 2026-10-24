package vn.edu.thuyetminh.poi;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.audio.AudioAsset;
import vn.edu.thuyetminh.audio.AudioService;
import vn.edu.thuyetminh.audio.AudioView;
import vn.edu.thuyetminh.common.Hashing;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.web.PageResponse;

/**
 * Read-only API for visitors. Every method filters on {@code status = PUBLISHED}: a draft POI is
 * reported as 404 both in lists and on direct access (by id, audio or image URL).
 */
@Service
public class PoiPublicService {

    public static final String DEFAULT_LANGUAGE = "vi";

    private final PoiStore pois;
    private final PoiTranslationStore translations;
    private final PoiImageStore images;
    private final AudioService audioService;

    public PoiPublicService(PoiStore pois, PoiTranslationStore translations, PoiImageStore images,
                            AudioService audioService) {
        this.pois = pois;
        this.translations = translations;
        this.images = images;
        this.audioService = audioService;
    }

    @Transactional(readOnly = true)
    public PageResponse<PoiDtos.PublicPoiSummary> list(int page, int size, String lang) {
        PageResponse<Poi> result = pois.listPublished(page, size);
        List<Long> ids = result.items().stream().map(Poi::getId).toList();
        Map<Long, List<PoiTranslation>> byPoi = ids.isEmpty() ? Map.of()
                : translations.listByPois(ids).stream().collect(Collectors.groupingBy(t -> t.getPoi().getId()));
        return result.map(p -> {
            List<PoiTranslation> ts = byPoi.getOrDefault(p.getId(), List.of());
            String name = pick(ts, lang).map(PoiTranslation::getName).orElse(p.getDefaultName());
            return new PoiDtos.PublicPoiSummary(p.getId(), p.getCode(), name, p.getLatitude(), p.getLongitude(),
                    imageUrl(p), p.getCategory(), p.getTriggerRadius(), languagesOf(ts), p.getUpdatedAt());
        });
    }

    @Transactional(readOnly = true)
    public PoiDtos.PublicPoiDetail detail(Long id, String lang) {
        Poi p = requirePublished(id);
        List<PoiTranslation> ts = translations.listByPoi(id);
        PoiTranslation t = pick(ts, lang).orElseThrow(() -> ApiException.notFound("Nội dung địa điểm"));
        AudioView audio = audioService.currentAudio(t).map(AudioView::publicView).orElse(null);
        String requested = lang == null ? DEFAULT_LANGUAGE : lang;
        return new PoiDtos.PublicPoiDetail(p.getId(), p.getCode(), requested, t.getLanguageCode(),
                !t.getLanguageCode().equals(requested), languagesOf(ts), t.getName(), t.getDescription(),
                t.getNarrationText(), t.getContentVersion(), audio, imageUrl(p), imageUrls(p.getId()), p.getCategory(),
                p.getTriggerRadius(), p.getLatitude(), p.getLongitude(), p.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public PoiDtos.OfflineManifest offlineManifest(Long id) {
        Poi p = requirePublished(id);
        List<PoiTranslation> ts = translations.listByPoi(id);
        Map<Long, AudioAsset> audio = audioService.currentAudioByTranslation(ts);
        List<PoiDtos.OfflineTranslation> items = ts.stream().map(t -> new PoiDtos.OfflineTranslation(
                t.getLanguageCode(), t.getName(), t.getDescription(), t.getNarrationText(), t.getContentVersion(),
                Optional.ofNullable(audio.get(t.getId())).map(AudioView::publicView).orElse(null))).toList();
        StringBuilder sig = new StringBuilder().append(p.getId()).append('|').append(p.getUpdatedAt())
                .append('|').append(p.getCoverImageKey());
        for (PoiDtos.OfflineTranslation it : items) {
            sig.append('|').append(it.languageCode()).append(':').append(it.contentVersion()).append(':')
                    .append(it.name()).append(':').append(it.description())
                    .append(':').append(it.audio() == null ? "-" : it.audio().sha256());
        }
        String version = Hashing.sha256Hex(sig.toString()).substring(0, 16);
        return new PoiDtos.OfflineManifest(p.getId(), p.getCode(), version, Instant.now(), p.getDefaultName(),
                p.getLatitude(), p.getLongitude(), imageUrl(p), p.getCoverImageType(), p.getCategory(),
                p.getTriggerRadius(), p.getUpdatedAt(), items);
    }

    @Transactional(readOnly = true)
    public Poi requirePublished(Long id) {
        return pois.findPublished(id).orElseThrow(() -> ApiException.notFound("Địa điểm"));
    }

    /** Requested language, else Vietnamese, else first available. */
    static Optional<PoiTranslation> pick(List<PoiTranslation> ts, String lang) {
        return ts.stream().filter(t -> t.getLanguageCode().equals(lang)).findFirst()
                .or(() -> ts.stream().filter(t -> t.getLanguageCode().equals(DEFAULT_LANGUAGE)).findFirst())
                .or(() -> ts.stream().min(Comparator.comparing(PoiTranslation::getLanguageCode)));
    }

    private static List<String> languagesOf(List<PoiTranslation> ts) {
        return ts.stream().map(PoiTranslation::getLanguageCode).sorted().toList();
    }

    @Transactional(readOnly = true)
    public PoiImage requirePublishedImage(Long poiId, Long imageId) {
        requirePublished(poiId);
        return images.findByPoiAndId(poiId, imageId).orElseThrow(() -> ApiException.notFound("Ảnh"));
    }

    private List<String> imageUrls(Long poiId) {
        return images.listByPoi(poiId).stream()
                .map(i -> "/api/v1/public/pois/" + poiId + "/images/" + i.getId()).toList();
    }

    private static String imageUrl(Poi p) {
        return p.getCoverImageKey() == null ? null : "/api/v1/public/pois/" + p.getId() + "/image";
    }
}
