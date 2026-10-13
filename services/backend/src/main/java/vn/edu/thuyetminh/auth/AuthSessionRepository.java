package vn.edu.thuyetminh.auth;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

    @EntityGraph(attributePaths = "account")
    Optional<AuthSession> findByTokenHash(String tokenHash);

    @Modifying
    @Query("delete from AuthSession s where s.expiresAt < :cutoff or s.revokedAt < :cutoff")
    int deleteExpiredBefore(Instant cutoff);
}
