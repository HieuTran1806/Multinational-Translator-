package vn.edu.thuyetminh.poi;

import java.time.Clock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.audio.AudioService;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.language.LanguageService;

@Service
public class PoiAdminService {

    private static final Logger log = LoggerFactory.getLogger(PoiAdminService.class);

    private final PoiStore pois;
    private final PoiTranslationStore translations;
    private final LanguageService languages;
    private final AudioService audioService;
    private final PoiAdminQueryService queries;
    private final Clock clock;

    public PoiAdminService(PoiStore pois, PoiTranslationStore translations, LanguageService languages,
                           AudioService audioService, PoiAdminQueryService queries, Clock clock) {
        this.pois = pois;
        this.translations = translations;
        this.languages = languages;
        this.audioService = audioService;
        this.queries = queries;
        this.clock = clock;
    }

    @Transactional
    public PoiDtos.AdminPoiDetail create(PoiDtos.PoiUpsertRequest req) {
        if (pois.isCodeTaken(req.code())) {
            throw new ApiException(ErrorCode.CONFLICT, "Mã địa điểm '" + req.code() + "' đã tồn tại");
        }
        Poi poi = new Poi(req.code(), req.defaultName().trim(), req.latitude(), req.longitude());
        poi.updateAdminFields(req.category(), req.triggerRadius() == null ? 50.0 : req.triggerRadius());
        poi = pois.save(poi);
        log.info("POI {} ({}) created", poi.getId(), poi.getCode());
        return queries.get(poi.getId());
    }

    @Transactional
    public PoiDtos.AdminPoiDetail update(Long id, PoiDtos.PoiUpsertRequest req) {
        Poi poi = require(id);
        if (req.rowVersion() != null && req.rowVersion() != poi.getRowVersion()) {
            throw new ApiException(ErrorCode.CONFLICT, "Địa điểm đã được người khác cập nhật, vui lòng tải lại");
        }
        if (pois.isCodeTakenByOther(req.code(), id)) {
            throw new ApiException(ErrorCode.CONFLICT, "Mã địa điểm '" + req.code() + "' đã tồn tại");
        }
        poi.update(req.code(), req.defaultName().trim(), req.latitude(), req.longitude());
        poi.updateAdminFields(req.category(), req.triggerRadius() == null ? poi.getTriggerRadius() : req.triggerRadius());
        pois.saveNow(poi);
        return queries.get(poi.getId());
    }

    /** UC10 strict readiness gate: English content and current, ready audio are both required. */
    @Transactional
    public PoiDtos.AdminPoiDetail publish(Long id) {
        Poi poi = require(id);
        PoiTranslation english = translations.findByPoiAndLanguage(id, "en").orElse(null);
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
            pois.saveNow(poi);
        }
        return queries.get(poi.getId());
    }

    @Transactional
    public PoiDtos.AdminPoiDetail unpublish(Long id) {
        Poi poi = require(id);
        if (poi.isPublished()) {
            poi.unpublish();
            pois.saveNow(poi);
        }
        return queries.get(poi.getId());
    }

    @Transactional
    public PoiDtos.AdminTranslationView upsertTranslation(Long poiId, String lang,
                                                          PoiDtos.TranslationUpsertRequest req) {
        Poi poi = require(poiId);
        languages.requireEnabled(lang);
        String name = req.name().trim();
        String description = req.description() == null ? null : req.description().trim();
        String narration = req.narrationText().trim();
        PoiTranslation t = translations.findByPoiAndLanguage(poiId, lang).orElse(null);
        if (t == null) {
            t = translations.save(new PoiTranslation(poi, lang, name, description, narration));
        } else if (t.update(name, description, narration)) {
            // Narration changed -> all previous audio becomes STALE and is never served again.
            translations.saveNow(t);
            audioService.invalidateForTranslation(t.getId());
        }
        poi.touch();
        pois.save(poi);
        translations.flush();
        return queries.translationView(t);
    }

    @Transactional
    public void softDelete(Long id) {
        Poi poi = require(id);
        poi.softDelete(clock.instant());
        pois.saveNow(poi);
        log.info("POI {} ({}) soft-deleted", poi.getId(), poi.getCode());
    }

    private Poi require(Long id) {
        return pois.findActive(id).orElseThrow(() -> ApiException.notFound("Địa điểm"));
    }
}
