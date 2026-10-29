package vn.edu.thuyetminh.admin;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import vn.edu.thuyetminh.auth.Account;
import vn.edu.thuyetminh.auth.AccountRole;

/** Request/response DTOs for UC10 admin account management (Super Admin only). */
public final class AdminAccountDtos {

    private AdminAccountDtos() {
    }

    /** UC10 §5.3: Super Admin creates an Admin (or another Super Admin) account. */
    public record CreateRequest(
            @NotBlank(message = "Vui lòng nhập tên đăng nhập")
            @Size(min = 3, max = 64, message = "Tên đăng nhập 3..64 ký tự")
            @Pattern(regexp = "^[a-zA-Z0-9_.-]+$",
                    message = "Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới và gạch ngang")
            String username,
            @NotBlank(message = "Vui lòng nhập mật khẩu")
            @Size(min = 6, max = 200, message = "Mật khẩu tối thiểu 6 ký tự")
            String password,
            @Size(max = 120, message = "Tên hiển thị tối đa 120 ký tự")
            String displayName,
            AccountRole role) {

        @Override
        public String toString() {
            return "CreateRequest[username=" + username + ", password=***, role=" + role + "]";
        }
    }

    /** UC10 A1/A2 + §8: display name, activation state and role (role is a static ADMIN/SUPER_ADMIN switch). */
    public record UpdateRequest(
            @Size(max = 120, message = "Tên hiển thị tối đa 120 ký tự")
            String displayName,
            Boolean enabled,
            AccountRole role) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Vui lòng nhập mật khẩu mới")
            @Size(min = 6, max = 200, message = "Mật khẩu tối thiểu 6 ký tự")
            String newPassword) {

        @Override
        public String toString() {
            return "ResetPasswordRequest[newPassword=***]";
        }
    }

    /** Never carries the password hash or any credential material. */
    public record AdminAccountView(Long id, String username, String displayName, AccountRole role, boolean enabled,
                                   Instant createdAt) {

        static AdminAccountView from(Account a) {
            return new AdminAccountView(a.getId(), a.getUsername(), a.getDisplayName(), a.getRole(), a.isEnabled(),
                    a.getCreatedAt());
        }
    }
}
