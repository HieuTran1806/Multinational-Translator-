package vn.edu.thuyetminh.seller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

/**
 * UC09 — seller account management API. Reached only with ROLE_ADMIN (Super Admin is rejected by
 * SecurityConfig, matching "Super Admin không được tạo hoặc quản lý Seller").
 */
@RestController
@RequestMapping("/api/v1/admin/sellers")
@Tag(name = "Admin – Tài khoản Seller")
@SecurityRequirement(name = "bearer")
public class SellerAdminController {

    private final SellerAdminService service;

    public SellerAdminController(SellerAdminService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Danh sách Seller (lọc theo từ khóa, mới nhất trước)")
    public PageResponse<SellerDtos.SellerView> list(@RequestParam(required = false) String q,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        return service.list(q, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo tài khoản Seller")
    public SellerDtos.SellerView create(@Valid @RequestBody SellerDtos.CreateRequest request,
                                        @AuthenticationPrincipal AuthenticatedAdmin admin) {
        return service.create(request, admin);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật tên hiển thị và trạng thái hoạt động")
    public SellerDtos.SellerView update(@PathVariable Long id,
                                        @Valid @RequestBody SellerDtos.UpdateRequest request,
                                        @AuthenticationPrincipal AuthenticatedAdmin admin) {
        return service.update(id, request, admin);
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Đặt lại mật khẩu Seller")
    public void resetPassword(@PathVariable Long id,
                              @Valid @RequestBody SellerDtos.ResetPasswordRequest request,
                              @AuthenticationPrincipal AuthenticatedAdmin admin) {
        service.resetPassword(id, request, admin);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Xóa mềm Seller (giữ lịch sử, chặn đăng nhập)")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedAdmin admin) {
        service.delete(id, admin);
    }
}
