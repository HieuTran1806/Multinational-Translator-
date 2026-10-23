package vn.edu.thuyetminh.poi;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.audio.AudioService;
import vn.edu.thuyetminh.audio.AudioView;
import vn.edu.thuyetminh.common.config.AppProperties;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.media.DetectedMedia;
import vn.edu.thuyetminh.media.MediaStorage;
import vn.edu.thuyetminh.media.UploadedFile;

/** Application service for POI image and audio asset mutations. */
@Service
public class PoiMediaService {
    private static final Logger log = LoggerFactory.getLogger(PoiMediaService.class);

    private final PoiStore pois;
    private final PoiTranslationStore translations;
    private final PoiImageStore images;
    private final PoiAdminQueryService poiAdminQueries;
    private final AudioService audioService;
    private final MediaStorage storage;
    private final AppProperties props;

    public PoiMediaService(PoiStore pois, PoiTranslationStore translations, PoiImageStore images,
                           PoiAdminQueryService poiAdminQueries, AudioService audioService, MediaStorage storage,
                           AppProperties props) {
        this.pois = pois;
        this.translations = translations;
        this.images = images;
        this.poiAdminQueries = poiAdminQueries;
        this.audioService = audioService;
        this.storage = storage;
        this.props = props;
    }

    @Transactional
    public AudioView uploadAudio(Long poiId, String languageCode, UploadedFile file) {
        Poi poi = requirePoi(poiId);
        PoiTranslation translation = translations.findByPoiAndLanguage(poiId, languageCode)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND,
                        "Hãy lưu nội dung ngôn ngữ '" + languageCode + "' trước khi gắn audio"));
        var asset = audioService.storeUpload(translation, file);
        poi.touch();
        pois.save(poi);
        return AudioView.adminView(asset, true);
    }

    @Transactional
    public PoiDtos.AdminPoiDetail uploadImage(Long poiId, UploadedFile file) {
        Poi poi = requirePoi(poiId);
        long imageCount = images.countByPoi(poiId);
        if (imageCount >= 6) {
            throw new ApiException(ErrorCode.CONFLICT, "Mỗi POI chỉ được có tối đa 6 ảnh");
        }
        if (file == null || file.isEmpty()) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Vui lòng chọn ảnh");
        }
        if (file.size() > props.upload().maxImageBytes()) {
            throw new ApiException(ErrorCode.PAYLOAD_TOO_LARGE, "Ảnh vượt quá "
                    + (props.upload().maxImageBytes() / (1024 * 1024)) + " MB");
        }

        DetectedMedia type;
        try (InputStream input = file.openStream()) {
            type = DetectedMedia.detect(input.readNBytes(12));
        } catch (IOException e) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Không đọc được file ảnh");
        }
        if (type == null || type.isAudio()) {
            throw new ApiException(ErrorCode.UNSUPPORTED_MEDIA, "Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP");
        }

        String key = "images/" + UUID.randomUUID() + "." + type.extension();
        try (InputStream input = file.openStream()) {
            storage.put(key, input, file.size(), type.mimeType());
        } catch (IOException e) {
            log.error("Failed to store POI image", e);
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "Không lưu được ảnh");
        }
        images.saveNow(new PoiImage(poiId, key, type.mimeType(), (int) imageCount));
        if (poi.getCoverImageKey() == null) {
            poi.setCoverImage(key, type.mimeType());
        }
        poi.touch();
        pois.saveNow(poi);
        return poiAdminQueries.get(poiId);
    }

    @Transactional
    public PoiDtos.AdminPoiDetail deleteImage(Long poiId, Long imageId) {
        Poi poi = requirePoi(poiId);
        PoiImage image = images.findByPoiAndId(poiId, imageId)
                .orElseThrow(() -> ApiException.notFound("Ảnh địa điểm"));
        String key = image.getStorageKey();
        images.delete(image);
        List<PoiImage> remaining = images.listByPoi(poiId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setSortOrder(i);
        }
        if (key.equals(poi.getCoverImageKey())) {
            PoiImage first = remaining.isEmpty() ? null : remaining.get(0);
            poi.setCoverImage(first == null ? null : first.getStorageKey(), first == null ? null : first.getMimeType());
        }
        poi.touch();
        pois.saveNow(poi);
        try {
            storage.delete(key);
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Could not delete removed POI image {}", key);
        }
        return poiAdminQueries.get(poiId);
    }

    @Transactional
    public PoiDtos.AdminPoiDetail reorderImages(Long poiId, List<Long> imageIds) {
        Poi poi = requirePoi(poiId);
        List<PoiImage> current = images.listByPoi(poiId);
        if (imageIds == null || imageIds.size() != current.size()
                || !new HashSet<>(imageIds).equals(current.stream().map(PoiImage::getId).collect(Collectors.toSet()))) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Thứ tự ảnh phải chứa đủ các ID ảnh của POI, không trùng lặp");
        }
        Map<Long, PoiImage> byId = current.stream().collect(Collectors.toMap(PoiImage::getId, image -> image));
        for (int i = 0; i < imageIds.size(); i++) {
            byId.get(imageIds.get(i)).setSortOrder(i);
        }
        images.saveAll(current);
        PoiImage first = imageIds.isEmpty() ? null : byId.get(imageIds.get(0));
        poi.setCoverImage(first == null ? null : first.getStorageKey(), first == null ? null : first.getMimeType());
        poi.touch();
        pois.saveNow(poi);
        return poiAdminQueries.get(poiId);
    }

    @Transactional(readOnly = true)
    public PoiImage requireImageEntity(Long poiId, Long imageId) {
        requirePoi(poiId);
        return images.findByPoiAndId(poiId, imageId).orElseThrow(() -> ApiException.notFound("Ảnh địa điểm"));
    }

    @Transactional(readOnly = true)
    public Poi requireEntity(Long poiId) {
        return requirePoi(poiId);
    }

    private Poi requirePoi(Long id) {
        return pois.findActive(id).orElseThrow(() -> ApiException.notFound("Địa điểm"));
    }
}
