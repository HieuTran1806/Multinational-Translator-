package vn.edu.thuyetminh.admin;

import java.time.Clock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.audit.AuditService;
import vn.edu.thuyetminh.auth.Account;
import vn.edu.thuyetminh.auth.AccountRole;
import vn.edu.thuyetminh.auth.AccountStore;
import vn.edu.thuyetminh.auth.AuthenticatedAdmin;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.common.web.PageResponse;

/**
 * UC10 — Super Admin manages Admin accounts: create, view, update (display name, activation state,
 * fixed ADMIN role), reset credentials and soft delete.
 * <p>Rules taken from UC10 §8 and E2:
 * <ul>
 *   <li>Only a Super Admin may act here (also enforced by SecurityConfig).</li>
 *   <li>Only ADMIN accounts are in scope; Super Admin accounts are never returned or modified here.</li>
 *   <li>The account role is fixed to ADMIN; there is no role editor.</li>
 *   <li>Soft delete applies to ADMIN accounts only; Super Admin accounts cannot be deleted here.</li>
 *   <li>Roles stay static (ADMIN/SUPER_ADMIN); no dynamic RBAC here.</li>
 * </ul>
 */
@Service
public class AdminAccountService {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountService.class);

    private final AccountStore accounts;
    private final PasswordEncoder passwordEncoder;
    private final AuditService audit;
    private final Clock clock;

    public AdminAccountService(AccountStore accounts, PasswordEncoder passwordEncoder, AuditService audit,
                               Clock clock) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminAccountDtos.AdminAccountView> list(String q, int page, int size,
                                                               AuthenticatedAdmin actor) {
        requireSuperAdmin(actor);
        return accounts.searchAdmins(blankToNull(q), page, size).map(AdminAccountDtos.AdminAccountView::from);
    }

    @Transactional(readOnly = true)
    public AdminAccountDtos.AdminAccountView get(Long id, AuthenticatedAdmin actor) {
        requireSuperAdmin(actor);
        return AdminAccountDtos.AdminAccountView.from(managedAdmin(id));
    }

    @Transactional
    public AdminAccountDtos.AdminAccountView create(AdminAccountDtos.CreateRequest req, AuthenticatedAdmin actor) {
        requireSuperAdmin(actor);
        String username = req.username().trim();
        if (accounts.findLiveByUsername(username).isPresent()) {
            throw new ApiException(ErrorCode.CONFLICT, "Tên đăng nhập đã tồn tại");
        }
        AccountRole role = AccountRole.ADMIN;
        Account created = accounts.save(new Account(username, passwordEncoder.encode(req.password()),
                blankToNull(req.displayName()), role));
        audit.record(AuditService.Actor.from(actor), AuditService.ADMIN_CREATE, "ACCOUNT",
                String.valueOf(created.getId()), AuditService.RESULT_SUCCESS,
                "username=" + username + ",role=" + role);
        log.info("Admin account '{}' ({}) created by '{}'", username, role, actor.username());
        return AdminAccountDtos.AdminAccountView.from(created);
    }

    @Transactional
    public AdminAccountDtos.AdminAccountView update(Long id, AdminAccountDtos.UpdateRequest req,
                                                    AuthenticatedAdmin actor) {
        requireSuperAdmin(actor);
        Account target = managedAdmin(id);
        if (req.displayName() != null) {
            target.setDisplayName(blankToNull(req.displayName()));
        }
        if (req.enabled() != null && req.enabled() != target.isEnabled()) {
            target.setEnabled(req.enabled());
        }

        Account saved = accounts.save(target);
        audit.record(AuditService.Actor.from(actor), AuditService.ADMIN_UPDATE, "ACCOUNT", String.valueOf(id),
                AuditService.RESULT_SUCCESS,
                "username=" + saved.getUsername() + ",enabled=" + saved.isEnabled());
        log.info("Admin account id={} updated by '{}'", id, actor.username());
        return AdminAccountDtos.AdminAccountView.from(saved);
    }

    /** UC10 A2: reset credentials to a new admin-provided password (hashed with the existing encoder). */
    @Transactional
    public void resetPassword(Long id, AdminAccountDtos.ResetPasswordRequest req, AuthenticatedAdmin actor) {
        requireSuperAdmin(actor);
        Account target = managedAdmin(id);
        target.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        accounts.save(target);
        audit.record(AuditService.Actor.from(actor), AuditService.ADMIN_RESET_PASSWORD, "ACCOUNT",
                String.valueOf(id), AuditService.RESULT_SUCCESS, "username=" + target.getUsername());
        log.info("Admin account id={} password reset by '{}'", id, actor.username());
    }

    /** UC10: soft delete an Admin account — login and new activity are blocked, history is kept. */
    @Transactional
    public void delete(Long id, AuthenticatedAdmin actor) {
        requireSuperAdmin(actor);
        Account target = managedAdmin(id);
        if (target.getId().equals(actor.accountId())) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Không được xóa chính mình");
        }
        if (target.getRole() != AccountRole.ADMIN) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Chỉ được xóa mềm tài khoản Admin");
        }
        target.softDelete(clock.instant(), actor.accountId());
        accounts.save(target);
        audit.record(AuditService.Actor.from(actor), AuditService.ADMIN_DELETE, "ACCOUNT", String.valueOf(id),
                AuditService.RESULT_SUCCESS, "username=" + target.getUsername());
        log.info("Admin account id={} soft-deleted by '{}'", id, actor.username());
    }

    private Account managedAdmin(Long id) {
        return accounts.findLiveById(id)
                .filter(a -> a.getRole() == AccountRole.ADMIN)
                .orElseThrow(() -> ApiException.notFound("Tài khoản quản trị"));
    }

    private static void requireSuperAdmin(AuthenticatedAdmin actor) {
        if (actor == null || actor.role() != AccountRole.SUPER_ADMIN) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Chỉ Super Admin mới được quản lý tài khoản Admin");
        }
    }

    /** Optional display name: blank input means "no name", never an empty string in the DB. */
    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
