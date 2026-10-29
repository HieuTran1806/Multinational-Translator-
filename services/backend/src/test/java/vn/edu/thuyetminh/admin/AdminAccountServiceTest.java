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
    private final AdminAccountService service = new AdminAccountService(accounts, encoder, audit);

    private static final AuthenticatedAdmin SUPER = new AuthenticatedAdmin(1L, 10L, "super", AccountRole.SUPER_ADMIN);
    private static final AuthenticatedAdmin ADMIN = new AuthenticatedAdmin(2L, 20L, "admin", AccountRole.ADMIN);
    private static final AuthenticatedAdmin SELLER = new AuthenticatedAdmin(3L, 30L, "seller", AccountRole.SELLER);

    private static Account account(long id, AccountRole role, boolean enabled) {
        Account a = new Account("user" + id, "hash", "User " + id, role);
        org.springframework.test.util.ReflectionTestUtils.setField(a, "id", id);
        a.setEnabled(enabled);
        return a;
    }

    // ---------- actor authorization ----------

    @Test
    void adminAndSellerCannotUseTheAdminAccountApi() {
        for (AuthenticatedAdmin actor : new AuthenticatedAdmin[] { ADMIN, SELLER }) {
            assertThatThrownBy(() -> service.list(null, null, 0, 20, actor))
                    .isInstanceOf(ApiException.class)
                    .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.FORBIDDEN);
            assertThatThrownBy(() -> service.create(
                    new AdminAccountDtos.CreateRequest("newadmin", "secret-1", null, null), actor))
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

        var view = service.create(new AdminAccountDtos.CreateRequest(" newadmin ", "secret-1", " New Admin ", null),
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

        assertThatThrownBy(() -> service.create(new AdminAccountDtos.CreateRequest("taken", "secret-1", null, null),
                SUPER))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.CONFLICT);
        verify(accounts, never()).save(any());
        verifyNoInteractions(audit);
    }

    @Test
    void sellerRoleCannotBeCreatedThroughTheAdminApi() {
        when(accounts.findLiveByUsername("x_seller")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(
                new AdminAccountDtos.CreateRequest("x_seller", "secret-1", null, AccountRole.SELLER), SUPER))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.BAD_REQUEST);
        verify(accounts, never()).save(any());
    }

    // ---------- update ----------

    @Test
    void updateChangesDisplayNameAndDisabledStateWithAudit() {
        Account target = account(5L, AccountRole.ADMIN, true);
        when(accounts.findLiveById(5L)).thenReturn(Optional.of(target));
        when(accounts.save(target)).thenReturn(target);

        var view = service.update(5L, new AdminAccountDtos.UpdateRequest("Renamed", false, null), SUPER);

        assertThat(view.displayName()).isEqualTo("Renamed");
        assertThat(view.enabled()).isFalse();
        verify(audit).record(eq(AuditService.Actor.from(SUPER)), eq(AuditService.ADMIN_UPDATE), eq("ACCOUNT"),
                eq("5"), eq(AuditService.RESULT_SUCCESS), anyString());
    }

    @Test
    void superAdminCannotDisableItself() {
        Account self = account(1L, AccountRole.SUPER_ADMIN, true);
        when(accounts.findLiveById(1L)).thenReturn(Optional.of(self));

        assertThatThrownBy(() -> service.update(1L, new AdminAccountDtos.UpdateRequest(null, false, null), SUPER))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.FORBIDDEN);
        assertThat(self.isEnabled()).isTrue();
        verify(accounts, never()).save(any());
        verifyNoInteractions(audit);
    }

    @Test
    void superAdminCannotChangeItsOwnRole() {
        Account self = account(1L, AccountRole.SUPER_ADMIN, true);
        when(accounts.findLiveById(1L)).thenReturn(Optional.of(self));

        assertThatThrownBy(() -> service.update(1L,
                new AdminAccountDtos.UpdateRequest(null, null, AccountRole.ADMIN), SUPER))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.FORBIDDEN);
        assertThat(self.getRole()).isEqualTo(AccountRole.SUPER_ADMIN);
        verify(accounts, never()).save(any());
    }

    @Test
    void lastActiveSuperAdminCannotBeDisabledOrDemoted() {
        Account lastSuper = account(7L, AccountRole.SUPER_ADMIN, true);
        when(accounts.findLiveById(7L)).thenReturn(Optional.of(lastSuper));
        when(accounts.countActiveSuperAdminsExcept(7L)).thenReturn(0L);

        assertThatThrownBy(() -> service.update(7L, new AdminAccountDtos.UpdateRequest(null, false, null), SUPER))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.FORBIDDEN);
        assertThatThrownBy(() -> service.update(7L,
                new AdminAccountDtos.UpdateRequest(null, null, AccountRole.ADMIN), SUPER))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.FORBIDDEN);
        assertThat(lastSuper.isEnabled()).isTrue();
        assertThat(lastSuper.getRole()).isEqualTo(AccountRole.SUPER_ADMIN);
        verifyNoInteractions(audit);
    }

    @Test
    void anotherSuperAdminCanBeDisabledWhenOneRemains() {
        Account other = account(8L, AccountRole.SUPER_ADMIN, true);
        when(accounts.findLiveById(8L)).thenReturn(Optional.of(other));
        when(accounts.countActiveSuperAdminsExcept(8L)).thenReturn(1L);
        when(accounts.save(other)).thenReturn(other);

        var view = service.update(8L, new AdminAccountDtos.UpdateRequest(null, false, null), SUPER);

        assertThat(view.enabled()).isFalse();
        verify(audit).record(eq(AuditService.Actor.from(SUPER)), eq(AuditService.ADMIN_UPDATE), eq("ACCOUNT"),
                eq("8"), eq(AuditService.RESULT_SUCCESS), anyString());
    }

    @Test
    void sellerAccountsAreNotManageableHere() {
        when(accounts.findLiveById(3L)).thenReturn(Optional.of(account(3L, AccountRole.SELLER, true)));

        assertThatThrownBy(() -> service.update(3L, new AdminAccountDtos.UpdateRequest(null, false, null), SUPER))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    void unknownAccountIsReportedAsNotFound() {
        when(accounts.findLiveById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(404L, new AdminAccountDtos.UpdateRequest(null, true, null), SUPER))
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
    void listRejectsSellerRoleFilterAndBlankQueryWorks() {
        assertThatThrownBy(() -> service.list("x", AccountRole.SELLER, 0, 20, SUPER))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode()).isEqualTo(ErrorCode.BAD_REQUEST);

        when(accounts.searchAdmins(isNull(), isNull(), eq(0), eq(20)))
                .thenReturn(new vn.edu.thuyetminh.common.web.PageResponse<>(java.util.List.of(), 0, 20, 0, 0));
        service.list("   ", null, 0, 20, SUPER);
        verify(accounts).searchAdmins(isNull(), isNull(), eq(0), eq(20));
        verify(accounts, never()).searchAdmins(eq(""), any(), org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.anyInt());
    }
}
