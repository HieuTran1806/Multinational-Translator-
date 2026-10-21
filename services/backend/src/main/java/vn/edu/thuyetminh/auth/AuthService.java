package vn.edu.thuyetminh.auth;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.common.Hashing;
import vn.edu.thuyetminh.common.config.AppProperties;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;

/**
 * Opaque bearer-token sessions:
 * <ul>
 *   <li>token = 32 random bytes (SecureRandom), Base64URL — returned to the client once;</li>
 *   <li>DB stores only SHA-256(token), with an absolute expiry ({@code app.auth.session-ttl});</li>
 *   <li>logout sets {@code revoked_at}, so the token stops working immediately.</li>
 * </ul>
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AccountStore accounts;
    private final AuthSessionStore sessions;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties props;
    private final Clock clock;
    /** BCrypt hash of a random value; used to equalise timing when the username does not exist. */
    private final String dummyHash;

    public AuthService(AccountStore accounts, AuthSessionStore sessions, PasswordEncoder passwordEncoder,
                       AppProperties props, Clock clock) {
        this.accounts = accounts;
        this.sessions = sessions;
        this.passwordEncoder = passwordEncoder;
        this.props = props;
        this.clock = clock;
        this.dummyHash = passwordEncoder.encode(newToken());
    }

    @Transactional
    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest req) {
        Optional<Account> found = accounts.findByUsername(req.username().trim());
        boolean ok;
        if (found.isPresent()) {
            ok = passwordEncoder.matches(req.password(), found.get().getPasswordHash()) && found.get().isEnabled();
        } else {
            passwordEncoder.matches(req.password(), dummyHash); // constant-ish time, result ignored
            ok = false;
        }
        if (!ok) {
            log.info("Failed admin login for username='{}'", sanitize(req.username()));
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS, "Sai tên đăng nhập hoặc mật khẩu");
        }
        Account account = found.get();
        String token = newToken();
        Instant now = clock.instant();
        Instant expiresAt = now.plus(props.auth().sessionTtl()).truncatedTo(ChronoUnit.SECONDS);
        sessions.save(new AuthSession(account, Hashing.sha256Hex(token), now, expiresAt));
        log.info("Admin '{}' logged in", account.getUsername());
        return new AuthDtos.LoginResponse(token, "Bearer", expiresAt, AuthDtos.AccountResponse.from(account));
    }

    /** Returns the principal for a valid token, or empty if unknown / expired / revoked / disabled. */
    @Transactional
    public Optional<AuthenticatedAdmin> authenticate(String rawToken) {
        if (rawToken == null || rawToken.isBlank() || rawToken.length() > 200) {
            return Optional.empty();
        }
        Instant now = clock.instant();
        return sessions.findByTokenHash(Hashing.sha256Hex(rawToken))
                .filter(s -> s.isActive(now))
                .filter(s -> s.getAccount().isEnabled())
                .map(s -> {
                    // write at most once per minute to limit DB churn
                    if (s.getLastUsedAt() == null || s.getLastUsedAt().isBefore(now.minusSeconds(60))) {
                        s.touch(now);
                    }
                    Account a = s.getAccount();
                    return new AuthenticatedAdmin(a.getId(), s.getId(), a.getUsername(), a.getRole());
                });
    }

    @Transactional
    public void logout(AuthenticatedAdmin principal) {
        sessions.findById(principal.sessionId()).ifPresent(s -> s.revoke(clock.instant()));
    }

    @Transactional(readOnly = true)
    public AuthDtos.AccountResponse me(AuthenticatedAdmin principal) {
        return accounts.findById(principal.accountId())
                .map(AuthDtos.AccountResponse::from)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED, "Phiên đăng nhập không hợp lệ"));
    }

    /** Housekeeping: remove sessions that expired / were revoked more than a day ago. */
    @Scheduled(fixedDelayString = "PT1H", initialDelayString = "PT5M")
    @Transactional
    public void purgeOldSessions() {
        int removed = sessions.deleteExpiredBefore(clock.instant().minus(1, ChronoUnit.DAYS));
        if (removed > 0) {
            log.info("Purged {} old auth sessions", removed);
        }
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sanitize(String s) {
        String v = s == null ? "" : s.replaceAll("[^a-zA-Z0-9_.@-]", "?");
        return v.length() > 64 ? v.substring(0, 64) : v;
    }
}
