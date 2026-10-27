package vn.edu.thuyetminh.access;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.edu.thuyetminh.auth.AuthenticatedAdmin;
import vn.edu.thuyetminh.common.web.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/access-qrs")
@Tag(name = "Admin – QR truy cập")
@SecurityRequirement(name = "bearer")
public class AdminAccessQrController {

    private final AccessQrAdminService service;

    public AdminAccessQrController(AccessQrAdminService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo QR truy cập dùng một lần (token chỉ trả về đúng lần này)")
    public AccessDtos.IssuedQr issue(@Valid @RequestBody(required = false) AccessDtos.IssueRequest request,
                                     @AuthenticationPrincipal AuthenticatedAdmin admin) {
        return service.issue(request, admin.accountId());
    }

    @GetMapping
    @Operation(summary = "Danh sách QR, mới nhất trước, lọc theo trạng thái")
    public PageResponse<AccessDtos.QrSummary> list(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size,
                                                   @RequestParam(required = false) AccessQrStatus status) {
        return service.list(status, page, size);
    }

    @PostMapping("/{id}/revoke")
    @Operation(summary = "Thu hồi QR; nếu QR đã được đổi thì quyền truy cập tương ứng cũng chấm dứt")
    public AccessDtos.QrSummary revoke(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedAdmin admin) {
        return service.revoke(id, admin);
    }
}
