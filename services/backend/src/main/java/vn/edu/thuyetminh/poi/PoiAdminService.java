package vn.edu.thuyetminh.poi;

import java.io.IOException;
import java.io.InputStream;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import vn.edu.thuyetminh.audio.AudioAsset;
import vn.edu.thuyetminh.audio.AudioService;
import vn.edu.thuyetminh.audio.AudioView;
import vn.edu.thuyetminh.common.config.AppProperties;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.common.web.PageRequests;
import vn.edu.thuyetminh.common.web.PageResponse;
import vn.edu.thuyetminh.language.LanguageService;
import vn.edu.thuyetminh.media.DetectedMedia;
import vn.edu.thuyetminh.media.MediaStorage;
import vn.edu.thuyetminh.tts.TtsJobService;
import vn.edu.thuyetminh.tts.TtsJobView;

@Service
public class PoiAdminService {

    private static final Logger log = LoggerFactory.getLogger(PoiAdminService.class);

    private final PoiRepository pois;
    private final PoiTranslationRepository translations;
    private final PoiImageRepository images;
    private final LanguageService languages;
    private final AudioService audioService;
    private final TtsJobService ttsJobs;
    private final MediaStorage storage;
    private final AppProperties props;
    private final Clock clock;

    public PoiAdminService(PoiRepository pois, PoiTranslationRepository translations, PoiImageRepository images,
                           LanguageService languages, AudioService audioService, TtsJobService ttsJobs,
                           MediaStorage storage, AppProperties props, Clock clock) {
        this.pois = pois;
        this.translations = translations;
        this.images = images;
        this.languages = languages;
        this.audioService = audioService;
        this.ttsJobs = ttsJobs;
        this.storage = storage;
        this.props = props;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<PoiDtos.AdminPoiSummary> list(int page, int size, PoiStatus status, String q) {
        String like = (q == null || q.isBlank()) ? null : "%" + q.trim().toLowerCase() + "%";
        Page<Poi> result = pois.search(status, like,
                PageRequests.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt").and(Sort.by("id"))));
        List<Long> ids = result.getContent().stream().map(Poi::getId).toList();
        List<PoiTranslation> ts = ids.isEmpty() ? List.of() : translations.findByPoiIdIn(ids);
        Map<Long, AudioAsset> current = audioService.currentAudioByTranslation(ts);
        Map<Long, List<PoiTranslation>> byPoi = ts.stream()
                .collect(Collectors.groupingBy(t -> t.getPoi().getId()));
        return PageResponse.of(result, p -> new PoiDtos.AdminPoiSummary(p.getId(), p.getCode(), p.getDefaultName(),
                p.getLatitude(), p.getLongitude(), p.getCategory(), p.getTriggerRadius(), p.getStatus(), p.isDemo(), p.getUpdatedAt(),
                byPoi.getOrDefault(p.getId(), List.of()).stream()
                        .sorted((a, b) -> a.getLanguageCode().compareTo(b.getLanguageCode()))
                        .map(t -> new PoiDtos.LanguageReadiness(t.getLanguageCode(), true,
                                readiness(t, current.get(t.getId()))))
                        .toList()));
    }

    private PoiDtos.AudioReadiness readiness(PoiTranslation t, AudioAsset currentAudio) {
        if (currentAudio != null) {
            return PoiDtos.AudioReadiness.READY;
        }
        return ttsJobs.latestForTranslation(t.getId())
                .filter(j -> j.contentVersion() == t.getContentVersion())
                .map(j -> switch (j.status()) {
                    case QUEUED, RUNNING -> PoiDtos.AudioReadiness.PROCESSING;
                    case FAILED -> PoiDtos.AudioReadiness.FAILED;
                    case SUCCEEDED -> PoiDtos.AudioReadiness.NONE;
                })
                .orElse(PoiDtos.AudioReadiness.NONE);
    }

    @Transactional(readOnly = true)
    public PoiDtos.AdminPoiDetail get(Long id) {
        return toDetail(require(id));
    }

    @Transactional
    public PoiDtos.AdminPoiDetail create(PoiDtos.PoiUpsertRequest req) {
        if (pois.existsByCode(req.code())) {
            throw new ApiException(ErrorCode.CONFLICT, "Mã địa điểm '" + req.code() + "' đã tồn tại");
        }
        Poi poi = new Poi(req.code(), req.defaultName().trim(), req.latitude(), req.longitude());
        poi.updateAdminFields(req.category(), req.triggerRadius() == null ? 50.0 : req.triggerRadius());
        poi = pois.save(poi);
        log.info("POI {} ({}) created", poi.getId(), poi.getCode());
        return toDetail(poi);
    }

    @Transactional
    public PoiDtos.AdminPoiDetail update(Long id, PoiDtos.PoiUpsertRequest req) {
        Poi poi = require(id);
        if (req.rowVersion() != null && req.rowVersion() != poi.getRowVersion()) {
            throw new ApiException(ErrorCode.CONFLICT, "Địa điểm đã được người khác cập nhật, vui lòng tải lại");
        }
        if (pois.existsByCodeAndIdNot(req.code(), id)) {
            throw new ApiException(ErrorCode.CONFLICT, "Mã địa điểm '" + req.code() + "' đã tồn tại");
        }
        poi.update(req.code(), req.defaultName().trim(), req.latitude(), req.longitude());
        poi.updateAdminFields(req.category(), req.triggerRadius() == null ? poi.getTriggerRadius() : req.triggerRadius());
        pois.saveAndFlush(poi);
        return toDetail(poi);
    }

    /** UC10 strict readiness gate: English content and current, ready audio are both required. */
    @Transactional
    public PoiDtos.AdminPoiDetail publish(Long id) {
        Poi poi = require(id);
        PoiTranslation english = translations.findByPoiIdAndLanguageCode(id, "en").orElse(null);
        if (english == null) {
            throw new ApiException(ErrorCode.PUBLISH_NOT_READY,
                    "Cần lưu nội dung tiếng Anh trước khi công khai POI");
        }
        if (audioService.currentAudio(english).isEmpty()) {
            throw new ApiException(ErrorCode.PUBLISH_NOT_READY,
                    "Cần có audio tiếng Anh ở trạng thái sẵn sàng trước khi công khai POI");
        }
        if (!poi.isPublished()) {
            poi.publish(clock.instant());
            pois.saveAndFlush(poi);
        }
        return toDetail(poi);
    }

    @Transactional
    public PoiDtos.AdminPoiDetail unpublish(Long id) {
        Poi poi = require(id);
        if (poi.isPublished()) {
            poi.unpublish();
            pois.saveAndFlush(poi);
        }
        return toDetail(poi);
    }

    @Transactional
    public PoiDtos.AdminTranslationView upsertTranslation(Long poiId, String lang,
                                                          PoiDtos.TranslationUpsertRequest req) {
        Poi poi = require(poiId);
        languages.requireEnabled(lang);
        String name = req.name().trim();
        String description = req.description() == null ? null : req.description().trim();
        String narration = req.narrationText().trim();
        PoiTranslation t = translations.findByPoiIdAndLanguageCode(poiId, lang).orElse(null);
        if (t == null) {
            t = translations.save(new PoiTranslation(poi, lang, name, description, narration));
        } else if (t.update(name, description, narration)) {
            // Narration changed -> all previous audio becomes STALE and is never served again.
            translations.saveAndFlush(t);
            audioService.invalidateForTranslation(t.getId());
        }
        poi.touch();
        pois.save(poi);
        translations.flush();
        return toTranslationView(t);
    }

    @Transactional
    public AudioView uploadAudio(Long poiId, String lang, MultipartFile file) {
        Poi poi = require(poiId);
        PoiTranslation t = requireTranslation(poiId, lang);
        AudioAsset asset = audioService.storeUpload(t, file);
        poi.touch();
        pois.save(poi);
        return AudioView.adminView(asset, true);
    }

    @Transactional
    public PoiDtos.AdminPoiDetail uploadImage(Long poiId, MultipartFile file) {
        Poi poi = require(poiId);
        long imageCount = images.countByPoiId(poiId);
        if (imageCount >= 6) {
            throw new ApiException(ErrorCode.CONFLICT, "Mỗi POI chỉ được có tối đa 6 ảnh");
        }
        if (file == null || file.isEmpty()) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Vui lòng chọn ảnh");
        }
        if (file.getSize() > props.upload().maxImageBytes()) {
            throw new ApiException(ErrorCode.PAYLOAD_TOO_LARGE, "Ảnh vượt quá "
                    + (props.upload().maxImageBytes() / (1024 * 1024)) + " MB");
        }
        DetectedMedia type;
        try (InputStream in = file.getInputStream()) {
            type = DetectedMedia.detect(in.readNBytes(12));
        } catch (IOException e) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Không đọc được file ảnh");
        }
        if (type == null || type.isAudio()) {
            throw new ApiException(ErrorCode.UNSUPPORTED_MEDIA, "Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP");
        }
        String key = "images/" + UUID.randomUUID() + "." + type.extension();
        try (InputStream in = file.getInputStream()) {
            storage.put(key, in, file.getSize(), type.mimeType());
        } catch (IOException e) {
            log.error("Failed to store POI image", e);
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "Không lưu được ảnh");
        }
        images.saveAndFlush(new PoiImage(poiId, key, type.mimeType(), (int) imageCount));
        if (poi.getCoverImageKey() == null) {
            poi.setCoverImage(key, type.mimeType());
        }
        poi.touch();
        pois.saveAndFlush(poi);
        return toDetail(poi);
    }

    @Transactional
    public void softDelete(Long id) {
        Poi poi = require(id);
        poi.softDelete(clock.instant());
        pois.saveAndFlush(poi);
        log.info("POI {} ({}) soft-deleted", poi.getId(), poi.getCode());
    }

    @Transactional
    public PoiDtos.AdminPoiDetail deleteImage(Long poiId, Long imageId) {
        Poi poi = require(poiId);
        PoiImage image = images.findByIdAndPoiId(imageId, poiId)
                .orElseThrow(() -> ApiException.notFound("Ảnh địa điểm"));
        String key = image.getStorageKey();
        images.delete(image);
        List<PoiImage> remaining = images.findByPoiIdOrderBySortOrderAscIdAsc(poiId);
        for (int i = 0; i < remaining.size(); i++) remaining.get(i).setSortOrder(i);
        if (key.equals(poi.getCoverImageKey())) {
            PoiImage first = remaining.isEmpty() ? null : remaining.get(0);
            poi.setCoverImage(first == null ? null : first.getStorageKey(), first == null ? null : first.getMimeType());
        }
        poi.touch();
        pois.saveAndFlush(poi);
        try { storage.delete(key); } catch (IOException | IllegalArgumentException e) {
            log.warn("Could not delete removed POI image {}", key);
        }
        return toDetail(poi);
    }

    @Transactional
    public PoiDtos.AdminPoiDetail reorderImages(Long poiId, List<Long> imageIds) {
        Poi poi = require(poiId);
        List<PoiImage> current = images.findByPoiIdOrderBySortOrderAscIdAsc(poiId);
        if (imageIds == null || imageIds.size() != current.size()
                || !new java.util.HashSet<>(imageIds).equals(current.stream().map(PoiImage::getId)
                        .collect(Collectors.toSet()))) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Thứ tự ảnh phải chứa đủ các ID ảnh của POI, không trùng lặp");
        }
        Map<Long, PoiImage> byId = current.stream().collect(Collectors.toMap(PoiImage::getId, image -> image));
        for (int i = 0; i < imageIds.size(); i++) byId.get(imageIds.get(i)).setSortOrder(i);
        images.saveAll(current);
        PoiImage first = imageIds.isEmpty() ? null : byId.get(imageIds.get(0));
        poi.setCoverImage(first == null ? null : first.getStorageKey(), first == null ? null : first.getMimeType());
        poi.touch();
        pois.saveAndFlush(poi);
        return toDetail(poi);
    }

    @Transactional(readOnly = true)
    public PoiImage requireImageEntity(Long poiId, Long imageId) {
        require(poiId);
        return images.findByIdAndPoiId(imageId, poiId).orElseThrow(() -> ApiException.notFound("Ảnh địa điểm"));
    }

    private Poi require(Long id) {
        return pois.findById(id).filter(p -> !p.isDeleted())
                .orElseThrow(() -> ApiException.notFound("Địa điểm"));
    }

    private PoiTranslation requireTranslation(Long poiId, String lang) {
        return translations.findByPoiIdAndLanguageCode(poiId, lang).orElseThrow(() -> new ApiException(
                ErrorCode.NOT_FOUND, "Hãy lưu nội dung ngôn ngữ '" + lang + "' trước khi gắn audio"));
    }

    private PoiDtos.AdminPoiDetail toDetail(Poi p) {
        List<PoiDtos.AdminTranslationView> views = new ArrayList<>();
        for (PoiTranslation t : translations.findByPoiIdOrderByLanguageCodeAsc(p.getId())) {
            views.add(toTranslationView(t));
        }
        String image = p.getCoverImageKey() == null ? null : "/api/v1/admin/pois/" + p.getId() + "/image";
        List<PoiDtos.AdminPoiImage> imageViews = images.findByPoiIdOrderBySortOrderAscIdAsc(p.getId()).stream()
                .map(i -> new PoiDtos.AdminPoiImage(i.getId(), "/api/v1/admin/pois/" + p.getId() + "/images/" + i.getId(),
                        i.getMimeType(), i.getSortOrder())).toList();
        return new PoiDtos.AdminPoiDetail(p.getId(), p.getCode(), p.getDefaultName(), p.getLatitude(),
                p.getLongitude(), p.getCategory(), p.getTriggerRadius(), p.getStatus(), p.isDemo(), image, imageViews, p.getPublishedAt(), p.getCreatedAt(),
                p.getUpdatedAt(), p.getRowVersion(), views);
    }

    private PoiDtos.AdminTranslationView toTranslationView(PoiTranslation t) {
        AudioView current = audioService.currentAudio(t).map(a -> AudioView.adminView(a, true)).orElse(null);
        TtsJobView job = ttsJobs.latestForTranslation(t.getId()).orElse(null);
        return new PoiDtos.AdminTranslationView(t.getLanguageCode(), t.getName(), t.getDescription(),
                t.getNarrationText(), t.getContentVersion(), t.getUpdatedAt(), current, job);
    }

    /** Used by streaming endpoints. */
    @Transactional(readOnly = true)
    public Poi requireEntity(Long id) {
        return require(id);
    }
}
