package vn.edu.thuyetminh.poi;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.edu.thuyetminh.audio.AudioView;
import vn.edu.thuyetminh.common.web.PageResponse;
import vn.edu.thuyetminh.media.web.MultipartUploadedFile;

@RestController
@RequestMapping("/api/v1/admin/pois")
@Tag(name = "Admin – POI")
@SecurityRequirement(name = "bearer")
public class AdminPoiController {

    private final PoiAdminService service;
    private final PoiAdminQueryService queries;
    private final PoiMediaService mediaService;

    public AdminPoiController(PoiAdminService service, PoiAdminQueryService queries, PoiMediaService mediaService) {
        this.service = service;
        this.queries = queries;
        this.mediaService = mediaService;
    }

    @GetMapping
    @Operation(summary = "Danh sách POI (mọi trạng thái), phân trang, lọc theo trạng thái / từ khoá")
    public PageResponse<PoiDtos.AdminPoiSummary> list(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size,
                                                      @RequestParam(required = false) PoiStatus status,
                                                      @RequestParam(required = false) String q) {
        return queries.list(page, size, status, q);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo POI (mặc định ở trạng thái nháp)")
    public PoiDtos.AdminPoiDetail create(@Valid @RequestBody PoiDtos.PoiUpsertRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public PoiDtos.AdminPoiDetail get(@PathVariable Long id) {
        return queries.get(id);
    }

    @PutMapping("/{id}")
    public PoiDtos.AdminPoiDetail update(@PathVariable Long id, @Valid @RequestBody PoiDtos.PoiUpsertRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Xóa mềm POI; giữ lại nội dung và media để tránh mất dữ liệu liên quan")
    public void delete(@PathVariable Long id) {
        service.softDelete(id);
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Công khai POI (cần nội dung tiếng Anh và audio tiếng Anh sẵn sàng)")
    public PoiDtos.AdminPoiDetail publish(@PathVariable Long id) {
        return service.publish(id);
    }

    @PostMapping("/{id}/unpublish")
    @Operation(summary = "Chuyển POI về nháp")
    public PoiDtos.AdminPoiDetail unpublish(@PathVariable Long id) {
        return service.unpublish(id);
    }

    @PutMapping("/{id}/translations/{lang}")
    @Operation(summary = "Lưu nội dung theo ngôn ngữ. Sửa nội dung thuyết minh làm audio cũ hết hiệu lực.")
    public PoiDtos.AdminTranslationView upsertTranslation(@PathVariable Long id, @PathVariable String lang,
                                                          @Valid @RequestBody PoiDtos.TranslationUpsertRequest req) {
        return service.upsertTranslation(id, lang, req);
    }

    @PostMapping(value = "/{id}/translations/{lang}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tải audio (MP3/M4A/WAV/OGG) cho phiên bản nội dung hiện tại")
    public AudioView uploadAudio(@PathVariable Long id, @PathVariable String lang,
                                 @RequestPart("file") MultipartFile file) {
        return mediaService.uploadAudio(id, lang, new MultipartUploadedFile(file));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @Operation(summary = "Xóa một ảnh của POI")
    public PoiDtos.AdminPoiDetail deleteImage(@PathVariable Long id, @PathVariable Long imageId) {
        return mediaService.deleteImage(id, imageId);
    }

    @PutMapping("/{id}/images/order")
    @Operation(summary = "Cập nhật thứ tự ảnh của POI")
    public PoiDtos.AdminPoiDetail reorderImages(@PathVariable Long id, @RequestBody java.util.List<Long> imageIds) {
        return mediaService.reorderImages(id, imageIds);
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải ảnh đại diện (JPEG/PNG/WEBP)")
    public PoiDtos.AdminPoiDetail uploadImage(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return mediaService.uploadImage(id, new MultipartUploadedFile(file));
    }
}
