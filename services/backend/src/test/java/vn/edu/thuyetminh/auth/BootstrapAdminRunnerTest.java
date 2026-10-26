package vn.edu.thuyetminh.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import vn.edu.thuyetminh.common.config.AppProperties;

class BootstrapAdminRunnerTest {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Test
    void canBootstrapProjectOwnerAsAdminWithoutChangingRolePermissions() {
        InMemoryAccountStore store = new InMemoryAccountStore();
        BootstrapAdminRunner runner = runner(true, "owner", "a-strong-password-123", "ADMIN", store);

        runner.run(new DefaultApplicationArguments(new String[0]));

        Account created = store.findByUsername("owner").orElseThrow();
        assertEquals(AccountRole.ADMIN, created.getRole());
        assertEquals("Project Owner", created.getDisplayName());
        assertTrue(encoder.matches("a-strong-password-123", created.getPasswordHash()));
        assertFalse(created.getPasswordHash().equals("a-strong-password-123"));
    }

    @Test
    void keepsSuperAdminAsTheDefaultBootstrapRole() {
        InMemoryAccountStore store = new InMemoryAccountStore();
        BootstrapAdminRunner runner = runner(true, "owner", "a-strong-password-123", null, store);

        runner.run(new DefaultApplicationArguments(new String[0]));

        assertEquals(AccountRole.SUPER_ADMIN, store.findByUsername("owner").orElseThrow().getRole());
    }

    @Test
    void rejectsUnknownBootstrapRole() {
        InMemoryAccountStore store = new InMemoryAccountStore();
        BootstrapAdminRunner runner = runner(true, "owner", "a-strong-password-123", "ROOT", store);

        assertThrows(IllegalStateException.class,
                () -> runner.run(new DefaultApplicationArguments(new String[0])));
        assertTrue(store.accounts.isEmpty());
    }

    @Test
    void doesNotCreateAnAccountWhenBootstrapIsDisabled() {
        InMemoryAccountStore store = new InMemoryAccountStore();
        BootstrapAdminRunner runner = runner(false, "owner", "a-strong-password-123", "ADMIN", store);

        runner.run(new DefaultApplicationArguments(new String[0]));

        assertTrue(store.accounts.isEmpty());
    }

    private BootstrapAdminRunner runner(boolean enabled, String username, String password, String role,
                                        InMemoryAccountStore store) {
        AppProperties props = new AppProperties(
                new AppProperties.Cors(List.of()),
                new AppProperties.Auth(Duration.ofHours(8)),
                new AppProperties.Bootstrap(enabled, username, password, role),
                new AppProperties.Storage("./data/media"),
                new AppProperties.Upload(20 * 1024 * 1024L, 5 * 1024 * 1024L),
                new AppProperties.Tts("none", 4500, Duration.ofSeconds(30), 3, true, Duration.ofMinutes(10)),
                new AppProperties.Access("DEMO_24H", "http://localhost:5174/activate"));
        return new BootstrapAdminRunner(props, store, encoder);
    }

    private static final class InMemoryAccountStore implements AccountStore {
        private final Map<String, Account> accounts = new HashMap<>();

        @Override
        public Optional<Account> findByUsername(String username) {
            return Optional.ofNullable(accounts.get(username));
        }

        @Override
        public Optional<Account> findById(Long id) {
            return accounts.values().stream().filter(a -> id.equals(a.getId())).findFirst();
        }

        @Override
        public Account save(Account account) {
            accounts.put(account.getUsername(), account);
            return account;
        }
    }
}
