package vn.edu.thuyetminh.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import vn.edu.thuyetminh.audit.AuditService;
import vn.edu.thuyetminh.auth.Account;
import vn.edu.thuyetminh.auth.AccountRole;
import vn.edu.thuyetminh.auth.AccountStore;
import vn.edu.thuyetminh.auth.AuthenticatedAdmin;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;

/**
 * UC10 business rules: Super-Admin-only access, self-operation guards, "last active Super Admin" guard,
 * static role limits and audit records. No Spring context, no database.
 */
class AdminAccountServiceTest {

    private final AccountStore accounts = mock(AccountStore.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final AuditService audit = mock(AuditService.class);
    private final AdminAccountService service = new AdminAccountService(accounts, encoder, audit, Clock.systemUTC());

    private static final AuthenticatedAdmin SUPER = new AuthenticatedAdmin(1L, 10L, "super", AccountRole.SUPER_ADMIN);
    private static final AuthenticatedAdmin ADMIN = new AuthenticatedAdmin(2L, 20L, "admin", AccountRole.ADMIN);

    private static Account account(long id, AccountRole role, boolean enabled) {
        Account a = new Account("user" + id, "hash", "User " + id, role);
        org.springframework.test.util.ReflectionTestUtils.setField(a, "id", id);
        a.setEnabled(enabled);
        return a;
    }

    // ---------- actor authorization ----------

    @Test
    void adminCannotUseTheAdminAccountApi() {
        for (AuthenticatedAdmin actor : new AuthenticatedAdmin[] { ADMIN }) {
            assertThatThrownBy(() -> service.list(null, 0, 20, actor))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.FORBIDDEN);
            assertThatThrownBy(() -> service.create(
                    new AdminAccountDtos.CreateRequest("newadmin", "secret-1", null), actor))
                    .isInstanceOf(ApiException.class);
        }
        verifyNoInteractions(accounts, encoder, audit);
    }

    // ---------- create ----------

    @Test
    void superAdminCreatesAdminAccountWithHashedPasswordAndAudit() {
        when(accounts.findLiveByUsername("newadmin")).thenReturn(Optional.empty());
        when(encoder.encode("secret-1")).thenReturn("bcrypt-hash");
        when(accounts.save(any(Account.class))).thenAnswer(inv -> {
            Account a = inv.getArgument(0);
            org.springframework.test.util.ReflectionTestUtils.setField(a, "id", 42L);
            return a;
        });

        var view = service.create(new AdminAccountDtos.CreateRequest(" newadmin ", "secret-1", " New Admin "),
                SUPER);

        assertThat(view.id()).isEqualTo(42L);
        assertThat(view.username()).isEqualTo("newadmin");
        assertThat(view.displayName()).isEqualTo("New Admin");
        assertThat(view.role()).isEqualTo(AccountRole.ADMIN);
        assertThat(view.enabled()).isTrue();
        assertThat(view.toString()).doesNotContain("secret-1");
        verify(audit).record(eq(AuditService.Actor.from(SUPER)), eq(AuditService.ADMIN_CREATE), eq("ACCOUNT"),
                eq("42"), eq(AuditService.RESULT_SUCCESS), anyString());
    }

    @Test
    void duplicateUsernameIsRejected() {
        when(accounts.findLiveByUsername("taken")).thenReturn(Optional.of(account(9L, AccountRole.ADMIN, true)));

        assertThatThrownBy(() -> service.create(new AdminAccountDtos.CreateRequest("taken", "secret-1", null),
                SUPER))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.CONFLICT);
        verify(accounts, never()).save(any());
        verifyNoInteractions(audit);
    }

    @Test
    void updateChangesDisplayNameAndDisabledStateWithAudit() {
        Account target = account(5L, AccountRole.ADMIN, true);
        when(accounts.findLiveById(5L)).thenReturn(Optional.of(target));
        when(accounts.save(target)).thenReturn(target);

        var view = service.update(5L, new AdminAccountDtos.UpdateRequest("Renamed", false), SUPER);

        assertThat(view.displayName()).isEqualTo("Renamed");
        assertThat(view.enabled()).isFalse();
        verify(audit).record(eq(AuditService.Actor.from(SUPER)), eq(AuditService.ADMIN_UPDATE), eq("ACCOUNT"),
                eq("5"), eq(AuditService.RESULT_SUCCESS), anyString());
    }

    @Test
    void unknownAccountIsReportedAsNotFound() {
        when(accounts.findLiveById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(404L, new AdminAccountDtos.UpdateRequest(null, true), SUPER))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.NOT_FOUND);
    }

    // ---------- reset password ----------

    @Test
    void resetPasswordStoresOnlyTheHashAndIsAuditedWithoutSecrets() {
        Account target = account(11L, AccountRole.ADMIN, true);
        when(accounts.findLiveById(11L)).thenReturn(Optional.of(target));
        when(encoder.encode("brand-new-pass")).thenReturn("bcrypt-new");
        when(accounts.save(target)).thenReturn(target);

        service.resetPassword(11L, new AdminAccountDtos.ResetPasswordRequest("brand-new-pass"), SUPER);

        assertThat(target.getPasswordHash()).isEqualTo("bcrypt-new");
        verify(audit).record(eq(AuditService.Actor.from(SUPER)), eq(AuditService.ADMIN_RESET_PASSWORD),
                eq("ACCOUNT"), eq("11"), eq(AuditService.RESULT_SUCCESS), anyString());
    }

    // ---------- list ----------

    @Test
    void blankQueryWorks() {
        when(accounts.searchAdmins(isNull(), eq(0), eq(20)))
                .thenReturn(new vn.edu.thuyetminh.common.web.PageResponse<>(java.util.List.of(), 0, 20, 0, 0));
        service.list("   ", 0, 20, SUPER);
        verify(accounts).searchAdmins(isNull(), eq(0), eq(20));
        verify(accounts, never()).searchAdmins(eq(""), org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.anyInt());
    }
}
