package vn.edu.thuyetminh.access;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/public/access")
@Tag(name = "User – Truy cập QR", description = "UC02: quét QR để kích hoạt quyền User, không cần tài khoản")
public class PublicAccessController {

    private final AccessGrantService service;

    public PublicAccessController(AccessGrantService service) {
        this.service = service;
    }

    @PostMapping("/redeem")
    @Operation(summary = "Đổi QR (dùng một lần) lấy quyền truy cập có thời hạn, gắn với thiết bị")
    public AccessDtos.GrantResponse redeem(@Valid @RequestBody AccessDtos.RedeemRequest request) {
        return service.redeem(request);
    }

    @GetMapping("/me")
    @Operation(summary = "Kiểm tra quyền hiện tại và thời hạn còn lại",
            security = @SecurityRequirement(name = "bearer"))
    public AccessDtos.GrantStatus me(@AuthenticationPrincipal AuthenticatedVisitor visitor) {
        return service.me(visitor);
    }
}
