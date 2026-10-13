package vn.edu.thuyetminh.auth;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Đăng nhập / đăng xuất quản trị viên")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập, trả về bearer token có thời hạn")
    public AuthDtos.LoginResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    @Operation(summary = "Thu hồi token hiện tại", security = @SecurityRequirement(name = "bearer"))
    public ResponseEntity<Void> logout(@AuthenticationPrincipal AuthenticatedAdmin principal) {
        authService.logout(principal);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Thông tin tài khoản hiện tại", security = @SecurityRequirement(name = "bearer"))
    public AuthDtos.AccountResponse me(@AuthenticationPrincipal AuthenticatedAdmin principal) {
        return authService.me(principal);
    }
}
