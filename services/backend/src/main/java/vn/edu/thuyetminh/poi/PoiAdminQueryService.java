package vn.edu.thuyetminh.poi;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.audio.AudioAsset;
import vn.edu.thuyetminh.audio.AudioService;
import vn.edu.thuyetminh.audio.AudioView;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.web.PageRequests;
import vn.edu.thuyetminh.common.web.PageResponse;
import vn.edu.thuyetminh.tts.TtsJobService;
import vn.edu.thuyetminh.tts.TtsJobView;

/** Read models for the Admin POI API; no mutation operations live here. */
@Service
public class PoiAdminQueryService {
    private final PoiRepository pois;
    private final PoiTranslationRepository translations;
    private final PoiImageRepository images;
    private final AudioService audioService;
    private final TtsJobService ttsJobs;

    public PoiAdminQueryService(PoiRepository pois, PoiTranslationRepository translations, PoiImageRepository images,
                                AudioService audioService, TtsJobService ttsJobs) {
        this.pois = pois;
        this.translations = translations;
        this.images = images;
        this.audioService = audioService;
        this.ttsJobs = ttsJobs;
    }

    @Transactional(readOnly = true)
    public PageResponse<PoiDtos.AdminPoiSummary> list(int page, int size, PoiStatus status, String query) {
        String like = query == null || query.isBlank() ? null : "%" + query.trim().toLowerCase() + "%";
        Page<Poi> result = pois.search(status, like,
                PageRequests.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt").and(Sort.by("id"))));
        List<Long> ids = result.getContent().stream().map(Poi::getId).toList();
        List<PoiTranslation> items = ids.isEmpty() ? List.of() : translations.findByPoiIdIn(ids);
        Map<Long, AudioAsset> currentAudio = audioService.currentAudioByTranslation(items);
        Map<Long, List<PoiTranslation>> byPoi = items.stream()
                .collect(Collectors.groupingBy(translation -> translation.getPoi().getId()));

        return PageResponse.of(result, poi -> new PoiDtos.AdminPoiSummary(poi.getId(), poi.getCode(),
                poi.getDefaultName(), poi.getLatitude(), poi.getLongitude(), poi.getCategory(), poi.getTriggerRadius(),
                poi.getStatus(), poi.isDemo(), poi.getUpdatedAt(),
                byPoi.getOrDefault(poi.getId(), List.of()).stream()
                        .sorted((left, right) -> left.getLanguageCode().compareTo(right.getLanguageCode()))
                        .map(translation -> new PoiDtos.LanguageReadiness(translation.getLanguageCode(), true,
                                readiness(translation, currentAudio.get(translation.getId()))))
                        .toList()));
    }

    @Transactional(readOnly = true)
    public PoiDtos.AdminPoiDetail get(Long id) {
        Poi poi = pois.findById(id).filter(item -> !item.isDeleted())
                .orElseThrow(() -> ApiException.notFound("Địa điểm"));
        return toDetail(poi);
    }

    PoiDtos.AdminTranslationView translationView(PoiTranslation translation) {
        AudioView currentAudio = audioService.currentAudio(translation)
                .map(asset -> AudioView.adminView(asset, true)).orElse(null);
        TtsJobView latestJob = ttsJobs.latestForTranslation(translation.getId()).orElse(null);
        return new PoiDtos.AdminTranslationView(translation.getLanguageCode(), translation.getName(),
                translation.getDescription(), translation.getNarrationText(), translation.getContentVersion(),
                translation.getUpdatedAt(), currentAudio, latestJob);
    }

    private PoiDtos.AudioReadiness readiness(PoiTranslation translation, AudioAsset currentAudio) {
        if (currentAudio != null) {
            return PoiDtos.AudioReadiness.READY;
        }
        return ttsJobs.latestForTranslation(translation.getId())
                .filter(job -> job.contentVersion() == translation.getContentVersion())
                .map(job -> switch (job.status()) {
                    case QUEUED, RUNNING -> PoiDtos.AudioReadiness.PROCESSING;
                    case FAILED -> PoiDtos.AudioReadiness.FAILED;
                    case SUCCEEDED -> PoiDtos.AudioReadiness.NONE;
                })
                .orElse(PoiDtos.AudioReadiness.NONE);
    }

    private PoiDtos.AdminPoiDetail toDetail(Poi poi) {
        List<PoiDtos.AdminTranslationView> translationViews = translations
                .findByPoiIdOrderByLanguageCodeAsc(poi.getId()).stream()
                .map(this::translationView).toList();
        String coverImage = poi.getCoverImageKey() == null ? null
                : "/api/v1/admin/pois/" + poi.getId() + "/image";
        List<PoiDtos.AdminPoiImage> imageViews = images.findByPoiIdOrderBySortOrderAscIdAsc(poi.getId()).stream()
                .map(image -> new PoiDtos.AdminPoiImage(image.getId(),
                        "/api/v1/admin/pois/" + poi.getId() + "/images/" + image.getId(),
                        image.getMimeType(), image.getSortOrder()))
                .toList();
        return new PoiDtos.AdminPoiDetail(poi.getId(), poi.getCode(), poi.getDefaultName(), poi.getLatitude(),
                poi.getLongitude(), poi.getCategory(), poi.getTriggerRadius(), poi.getStatus(), poi.isDemo(),
                coverImage, imageViews, poi.getPublishedAt(), poi.getCreatedAt(), poi.getUpdatedAt(),
                poi.getRowVersion(), translationViews);
    }
}
