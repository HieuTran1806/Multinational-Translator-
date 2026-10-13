package vn.edu.thuyetminh.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.common.config.AppProperties;

/**
 * Creates the first SUPER_ADMIN account when explicitly enabled
 * ({@code APP_BOOTSTRAP_ADMIN_ENABLED=true} + username/password env vars).
 * <p>No default password exists: if the password is missing or weak, the app refuses to start.
 * The account is only created if the username does not exist yet; an existing password is never overwritten.
 */
@Component
public class BootstrapAdminRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminRunner.class);
    static final int MIN_PASSWORD_LENGTH = 12;

    private final AppProperties props;
    private final AccountRepository accounts;
    private final PasswordEncoder encoder;

    public BootstrapAdminRunner(AppProperties props, AccountRepository accounts, PasswordEncoder encoder) {
        this.props = props;
        this.accounts = accounts;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        AppProperties.Bootstrap b = props.bootstrapAdmin();
        if (!b.enabled()) {
            return;
        }
        String username = b.username() == null ? "" : b.username().trim();
        String password = b.password() == null ? "" : b.password();
        if (!username.matches("^[a-zA-Z0-9_.-]{3,64}$")) {
            throw new IllegalStateException("APP_BOOTSTRAP_ADMIN_USERNAME is missing or invalid");
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException("APP_BOOTSTRAP_ADMIN_PASSWORD must be at least "
                    + MIN_PASSWORD_LENGTH + " characters (no default password is provided)");
        }
        if (accounts.findByUsername(username).isPresent()) {
            log.info("Bootstrap admin '{}' already exists; nothing to do", username);
            return;
        }
        accounts.save(new Account(username, encoder.encode(password), "Super Admin", AccountRole.SUPER_ADMIN));
        log.info("Bootstrap admin '{}' created. Disable APP_BOOTSTRAP_ADMIN_ENABLED afterwards.", username);
    }
}
