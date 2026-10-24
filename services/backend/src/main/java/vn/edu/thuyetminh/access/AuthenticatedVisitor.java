package vn.edu.thuyetminh.access;

import java.time.Instant;

/** Principal for a User request carrying a valid grant. Has no account: UC02 Users never log in. */
public record AuthenticatedVisitor(Long grantId, String packageCode, Instant expiresAt) {
}
