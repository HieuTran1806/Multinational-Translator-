package vn.edu.thuyetminh.auth;

/** Principal placed in the SecurityContext after a bearer token is validated. */
public record AuthenticatedAdmin(Long accountId, Long sessionId, String username, AccountRole role) {
}
