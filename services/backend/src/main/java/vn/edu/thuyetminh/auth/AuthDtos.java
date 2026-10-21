package vn.edu.thuyetminh.auth;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request/response DTOs for authentication endpoints. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "Vui lòng nhập tên đăng nhập") @Size(max = 64) String username,
            @NotBlank(message = "Vui lòng nhập mật khẩu") @Size(max = 200) String password) {

        @Override
        public String toString() {
            return "LoginRequest[username=" + username + ", password=***]";
        }
    }

    public record AccountResponse(Long id, String username, String displayName, AccountRole role) {

        static AccountResponse from(Account a) {
            return new AccountResponse(a.getId(), a.getUsername(), a.getDisplayName(), a.getRole());
        }
    }

    /** Token is returned once; the server keeps only its hash. */
    public record LoginResponse(String accessToken, String tokenType, Instant expiresAt, AccountResponse account) {

        @Override
        public String toString() {
            return "LoginResponse[accessToken=***, expiresAt=" + expiresAt + ", account=" + account + "]";
        }
    }
}
