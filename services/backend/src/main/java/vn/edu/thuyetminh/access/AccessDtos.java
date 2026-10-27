package vn.edu.thuyetminh.access;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request/response DTOs for UC02 access QR and grants. Tokens are masked in every toString(). */
public final class AccessDtos {

    private AccessDtos() {
    }

    /**
     * {@code deviceId} is a random id the User app generates once and keeps on the device; the server
     * stores only its hash and requires the same value on every later request.
     */
    public record RedeemRequest(
            @NotBlank(message = "Thiếu mã QR") @Size(max = 200) String qrToken,
            @NotBlank(message = "Thiếu mã thiết bị")
            @Pattern(regexp = "^[A-Za-z0-9_-]{16,128}$", message = "Mã thiết bị không hợp lệ") String deviceId) {

        @Override
        public String toString() {
            return "RedeemRequest[qrToken=***, deviceId=***]";
        }
    }

    /** Returned once by a successful redeem; the server keeps only the token hash. */
    public record GrantResponse(String accessToken, String tokenType, Instant expiresAt, String packageCode) {

        @Override
        public String toString() {
            return "GrantResponse[accessToken=***, expiresAt=" + expiresAt + ", packageCode=" + packageCode + "]";
        }
    }

    public record GrantStatus(Long grantId, String packageCode, Instant expiresAt, long remainingSeconds) {
    }

    /** {@code sellerUsername} optionally assigns the QR to a live Seller (UC09/UC13); Admin issues on their behalf. */
    public record IssueRequest(@Size(max = 40) String packageCode, @Size(max = 200) String note,
                               @Size(max = 64) String sellerUsername) {
    }

    /** The only response that carries the plaintext QR token; it cannot be shown again later. */
    public record IssuedQr(Long id, AccessQrStatus status, String packageCode, int durationMinutes, String note,
                           Instant createdAt, String qrToken, String activationUrl) {

        @Override
        public String toString() {
            return "IssuedQr[id=" + id + ", packageCode=" + packageCode + ", qrToken=***]";
        }
    }

    public record QrSummary(Long id, AccessQrStatus status, String packageCode, int durationMinutes, String note,
                            Instant createdAt, Instant redeemedAt, Instant revokedAt) {

        static QrSummary from(AccessQr q) {
            AccessPackage p = q.getAccessPackage();
            return new QrSummary(q.getId(), q.getStatus(), p.getCode(), p.getDurationMinutes(), q.getNote(),
                    q.getCreatedAt(), q.getRedeemedAt(), q.getRevokedAt());
        }
    }
}
