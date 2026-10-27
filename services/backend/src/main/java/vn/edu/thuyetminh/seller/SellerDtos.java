package vn.edu.thuyetminh.seller;

import java.time.Instant;

import vn.edu.thuyetminh.auth.Account;

/** Request/response DTOs for UC09 seller account management. */
public final class SellerDtos {

    private SellerDtos() {
    }

    public record CreateRequest(
            @jakarta.validation.constraints.NotBlank(message = "Vui lòng nhập tên đăng nhập")
            @jakarta.validation.constraints.Size(min = 3, max = 64, message = "Tên đăng nhập 3..64 ký tự")
            @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới và gạch ngang")
            String username,
            @jakarta.validation.constraints.NotBlank(message = "Vui lòng nhập mật khẩu")
            @jakarta.validation.constraints.Size(min = 6, max = 200, message = "Mật khẩu tối thiểu 6 ký tự")
            String password,
            @jakarta.validation.constraints.Size(max = 120, message = "Tên hiển thị tối đa 120 ký tự")
            String displayName) {

        @Override
        public String toString() {
            return "CreateRequest[username=" + username + ", password=***]";
        }
    }

    public record UpdateRequest(
            @jakarta.validation.constraints.Size(max = 120, message = "Tên hiển thị tối đa 120 ký tự")
            String displayName,
            Boolean enabled) {
    }

    public record ResetPasswordRequest(
            @jakarta.validation.constraints.NotBlank(message = "Vui lòng nhập mật khẩu mới")
            @jakarta.validation.constraints.Size(min = 6, max = 200, message = "Mật khẩu tối thiểu 6 ký tự")
            String newPassword) {

        @Override
        public String toString() {
            return "ResetPasswordRequest[newPassword=***]";
        }
    }

    public record SellerView(Long id, String username, String displayName, boolean enabled, Instant createdAt,
                             Instant deletedAt) {

        static SellerView from(Account a) {
            return new SellerView(a.getId(), a.getUsername(), a.getDisplayName(), a.isEnabled(), a.getCreatedAt(),
                    a.getDeletedAt());
        }
    }
}
