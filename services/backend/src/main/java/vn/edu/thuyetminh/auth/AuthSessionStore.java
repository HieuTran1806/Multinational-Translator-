package vn.edu.thuyetminh.auth;

import java.time.Instant;
import java.util.Optional;

public interface AuthSessionStore {
    Optional<AuthSession> findByTokenHash(String tokenHash);
    Optional<AuthSession> findById(Long id);
    AuthSession save(AuthSession session);
    int deleteExpiredBefore(Instant cutoff);
}