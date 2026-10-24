package vn.edu.thuyetminh.poi;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import vn.edu.thuyetminh.audio.AudioView;
import vn.edu.thuyetminh.tts.TtsJobView;

/** API DTOs for POIs. Entities are never serialized directly. */
public final class PoiDtos {

    private PoiDtos() {
    }

    // ---------- Admin requests ----------

    public record PoiUpsertRequest(
            @NotBlank(message = "Mã địa điểm là bắt buộc")
            @Pattern(regexp = "^[A-Z0-9][A-Z0-9_-]{1,49}$",
                    message = "Mã chỉ gồm chữ IN HOA, số, '-' hoặc '_' (2–50 ký tự)")
            String code,
            @NotBlank(message = "Tên mặc định là bắt buộc") @Size(max = 200) String defaultName,
            @NotNull(message = "Vĩ độ là bắt buộc")
            @DecimalMin(value = "-90.0", message = "Vĩ độ phải trong khoảng -90..90")
            @DecimalMax(value = "90.0", message = "Vĩ độ phải trong khoảng -90..90")
            Double latitude,
            @NotNull(message = "Kinh độ là bắt buộc")
            @DecimalMin(value = "-180.0", message = "Kinh độ phải trong khoảng -180..180")
            @DecimalMax(value = "180.0", message = "Kinh độ phải trong khoảng -180..180")
            Double longitude,
            @Size(max = 100, message = "Danh mục tối đa 100 ký tự") String category,
            @DecimalMin(value = "1.0", message = "Bán kính kích hoạt phải từ 1 đến 5000 mét")
            @DecimalMax(value = "5000.0", message = "Bán kính kích hoạt phải từ 1 đến 5000 mét")
            Double triggerRadius,
            /** Optional optimistic-lock token from the last read; mismatch returns 409. */
            Long rowVersion) {
    }

    public record TranslationUpsertRequest(
            @NotBlank(message = "Tên hiển thị là bắt buộc") @Size(max = 200) String name,
            @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự") String description,
            @NotBlank(message = "Nội dung thuyết minh là bắt buộc")
            @Size(max = 20000, message = "Nội dung thuyết minh tối đa 20000 ký tự") String narrationText) {
    }

    // ---------- Admin responses ----------

    /** Per-language readiness shown in the admin list. */
    public enum AudioReadiness { NONE, READY, PROCESSING, FAILED }

    public record LanguageReadiness(String languageCode, boolean hasContent, AudioReadiness audio) {
    }

    public record AdminPoiSummary(Long id, String code, String defaultName, double latitude, double longitude,
                                  String category, double triggerRadius, PoiStatus status, boolean demo, Instant updatedAt,
                                  List<LanguageReadiness> languages) {
    }

    public record AdminTranslationView(String languageCode, String name, String description, String narrationText,
                                       int contentVersion, Instant updatedAt, AudioView currentAudio,
                                       TtsJobView latestJob) {
    }

    public record AdminPoiImage(Long id, String url, String mimeType, int sortOrder) { }

    public record AdminPoiDetail(Long id, String code, String defaultName, double latitude, double longitude,
                                 String category, double triggerRadius, PoiStatus status, boolean demo, String imageUrl,
                                 List<AdminPoiImage> images, Instant publishedAt,
                                 Instant createdAt, Instant updatedAt, long rowVersion,
                                 List<AdminTranslationView> translations) {
    }

    // ---------- Public responses ----------

    public record PublicPoiSummary(Long id, String code, String name, double latitude, double longitude,
                                   String imageUrl, String category, double triggerRadius,
                                   List<String> languages, Instant updatedAt) {
    }

    public record PublicPoiDetail(Long id, String code, String requestedLanguage, String language,
                                  boolean fallback, List<String> availableLanguages, String name,
                                  String description, String narrationText, int contentVersion, AudioView audio,
                                  String imageUrl, List<String> images, String category, double triggerRadius,
                                  double latitude, double longitude, Instant updatedAt) {
    }

    public record OfflineTranslation(String languageCode, String name, String description, String narrationText,
                                     int contentVersion, AudioView audio) {
    }

    /** Everything the mobile app needs to use one POI offline. URLs are relative to the API base. */
    public record OfflineManifest(Long poiId, String code, String manifestVersion, Instant generatedAt,
                                  String defaultName, double latitude, double longitude, String imageUrl,
                                  String imageMimeType, String category, double triggerRadius, Instant updatedAt,
                                  List<OfflineTranslation> translations) {
    }
}
