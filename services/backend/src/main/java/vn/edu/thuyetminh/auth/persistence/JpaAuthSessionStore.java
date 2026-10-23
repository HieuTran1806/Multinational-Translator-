package vn.edu.thuyetminh.auth.persistence;

import java.time.Instant;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.auth.AuthSession;
import vn.edu.thuyetminh.auth.AuthSessionRepository;
import vn.edu.thuyetminh.auth.AuthSessionStore;

@Repository
public class JpaAuthSessionStore implements AuthSessionStore {
    private final AuthSessionRepository repository;

    public JpaAuthSessionStore(AuthSessionRepository repository) {
        this.repository = repository;
    }

    @Override public Optional<AuthSession> findByTokenHash(String tokenHash) {
        return repository.findByTokenHash(tokenHash);
    }

    @Override public Optional<AuthSession> findById(Long id) {
        return repository.findById(id);
    }

    @Override public AuthSession save(AuthSession session) {
        return repository.save(session);
    }

    @Override public int deleteExpiredBefore(Instant cutoff) {
        return repository.deleteExpiredBefore(cutoff);
    }
}