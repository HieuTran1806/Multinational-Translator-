package vn.edu.thuyetminh.admin;

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
 * UC10 — admin account management API. Reached only with ROLE_SUPER_ADMIN (SecurityConfig matcher sits
 * before the ADMIN-only /api/v1/admin/** rule); the service repeats the check server-side.
 */
@RestController
@RequestMapping("/api/v1/admin/accounts")
@Tag(name = "Admin – Tài khoản Admin")
@SecurityRequirement(name = "bearer")
public class AdminAccountController {

    private final AdminAccountService service;

    public AdminAccountController(AdminAccountService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Danh sách tài khoản Admin (lọc từ khóa, mới nhất trước)")
    public PageResponse<AdminAccountDtos.AdminAccountView> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AuthenticatedAdmin admin) {
        return service.list(q, page, size, admin);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết tài khoản Admin")
    public AdminAccountDtos.AdminAccountView get(@PathVariable Long id,
                                                   @AuthenticationPrincipal AuthenticatedAdmin admin) {
        return service.get(id, admin);
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo tài khoản Admin")
    public AdminAccountDtos.AdminAccountView create(@Valid @RequestBody AdminAccountDtos.CreateRequest request,
                                                    @AuthenticationPrincipal AuthenticatedAdmin admin) {
        return service.create(request, admin);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật tên hiển thị và trạng thái hoạt động")
    public AdminAccountDtos.AdminAccountView update(@PathVariable Long id,
                                                    @Valid @RequestBody AdminAccountDtos.UpdateRequest request,
                                                    @AuthenticationPrincipal AuthenticatedAdmin admin) {
        return service.update(id, request, admin);
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Đặt lại mật khẩu tài khoản Admin")
    public void resetPassword(@PathVariable Long id,
                              @Valid @RequestBody AdminAccountDtos.ResetPasswordRequest request,
                              @AuthenticationPrincipal AuthenticatedAdmin admin) {
        service.resetPassword(id, request, admin);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Xóa mềm tài khoản Admin (chặn đăng nhập, giữ lịch sử)")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedAdmin admin) {
        service.delete(id, admin);
    }
}
