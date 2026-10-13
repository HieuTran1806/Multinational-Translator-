package vn.edu.thuyetminh.poi;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.edu.thuyetminh.common.web.PageResponse;

@RestController
@RequestMapping("/api/v1/public/pois")
@Tag(name = "Public – POI", description = "Khách xem/nghe không cần đăng nhập; chỉ POI đã công khai")
public class PublicPoiController {

    private final PoiPublicService service;

    public PublicPoiController(PoiPublicService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Danh sách POI công khai (phân trang)")
    public PageResponse<PoiDtos.PublicPoiSummary> list(@RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "50") int size,
                                                       @RequestParam(defaultValue = "vi") String lang) {
        return service.list(page, size, lang);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết POI theo ngôn ngữ, kèm audio hiện hành (nếu có)")
    public PoiDtos.PublicPoiDetail detail(@PathVariable Long id, @RequestParam(defaultValue = "vi") String lang) {
        return service.detail(id, lang);
    }

    @GetMapping("/{id}/offline-manifest")
    @Operation(summary = "Manifest để mobile tải nội dung + audio dùng offline")
    public PoiDtos.OfflineManifest manifest(@PathVariable Long id) {
        return service.offlineManifest(id);
    }
}
