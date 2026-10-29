package vn.edu.thuyetminh.admin;

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
 * UC10 — Super Admin manages Admin/Super Admin accounts: create, update (display name, activation state,
 * static role switch) and reset credentials.
 * <p>Rules taken from UC10 §8 and E2:
 * <ul>
 *   <li>Only a Super Admin may act here (also enforced by SecurityConfig).</li>
 *   <li>A Super Admin must never change its own role or disable itself.</li>
 *   <li>After any operation at least one enabled Super Admin must remain.</li>
 *   <li>Seller accounts stay in UC09; this service rejects them rather than managing them.</li>
 *   <li>Roles stay static (ADMIN/SUPER_ADMIN); no dynamic RBAC (UC11) here.</li>
 * </ul>
 */
@Service
public class AdminAccountService {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountService.class);

    private final AccountStore accounts;
    private final PasswordEncoder passwordEncoder;
    private final AuditService audit;

    public AdminAccountService(AccountStore accounts, PasswordEncoder passwordEncoder, AuditService audit) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminAccountDtos.AdminAccountView> list(String q, AccountRole role, int page, int size,
                                                               AuthenticatedAdmin actor) {
        requireSuperAdmin(actor);
        if (role != null && !isAdminRole(role)) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Chỉ hỗ trợ lọc theo ADMIN hoặc SUPER_ADMIN");
        }
        return accounts.searchAdmins(blankToNull(q), role, page, size).map(AdminAccountDtos.AdminAccountView::from);
    }

    @Transactional
    public AdminAccountDtos.AdminAccountView create(AdminAccountDtos.CreateRequest req, AuthenticatedAdmin actor) {
        requireSuperAdmin(actor);
        String username = req.username().trim();
        if (accounts.findLiveByUsername(username).isPresent()) {
            throw new ApiException(ErrorCode.CONFLICT, "Tên đăng nhập đã tồn tại");
        }
        AccountRole role = req.role() == null ? AccountRole.ADMIN : req.role();
        if (!isAdminRole(role)) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Chỉ được tạo tài khoản ADMIN hoặc SUPER_ADMIN");
        }
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
        boolean self = target.getId().equals(actor.accountId());

        if (req.displayName() != null) {
            target.setDisplayName(blankToNull(req.displayName()));
        }
        if (req.role() != null && req.role() != target.getRole()) {
            if (!isAdminRole(req.role())) {
                throw new ApiException(ErrorCode.BAD_REQUEST, "Chỉ được gán role ADMIN hoặc SUPER_ADMIN");
            }
            if (self) {
                throw new ApiException(ErrorCode.FORBIDDEN, "Không được tự đổi vai trò của chính mình");
            }
            if (wouldLeaveNoActiveSuperAdmin(target)) {
                throw new ApiException(ErrorCode.FORBIDDEN, "Phải còn ít nhất một Super Admin đang hoạt động");
            }
            target.changeRole(req.role());
        }
        if (req.enabled() != null && req.enabled() != target.isEnabled()) {
            if (!req.enabled()) {
                if (self) {
                    throw new ApiException(ErrorCode.FORBIDDEN, "Không được tự vô hiệu hóa chính mình");
                }
                if (wouldLeaveNoActiveSuperAdmin(target)) {
                    throw new ApiException(ErrorCode.FORBIDDEN, "Phải còn ít nhất một Super Admin đang hoạt động");
                }
            }
            target.setEnabled(req.enabled());
        }

        Account saved = accounts.save(target);
        audit.record(AuditService.Actor.from(actor), AuditService.ADMIN_UPDATE, "ACCOUNT", String.valueOf(id),
                AuditService.RESULT_SUCCESS,
                "username=" + saved.getUsername() + ",enabled=" + saved.isEnabled() + ",role=" + saved.getRole());
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

    /** UC10 E2: demoting or disabling an active Super Admin must leave at least one active Super Admin. */
    private boolean wouldLeaveNoActiveSuperAdmin(Account target) {
        if (target.getRole() != AccountRole.SUPER_ADMIN || !target.isEnabled()) {
            return false;
        }
        return accounts.countActiveSuperAdminsExcept(target.getId()) < 1;
    }

    private Account managedAdmin(Long id) {
        return accounts.findLiveById(id)
                .filter(a -> isAdminRole(a.getRole()))
                .orElseThrow(() -> ApiException.notFound("Tài khoản quản trị"));
    }

    private static void requireSuperAdmin(AuthenticatedAdmin actor) {
        if (actor == null || actor.role() != AccountRole.SUPER_ADMIN) {
            throw new ApiException(ErrorCode.FORBIDDEN, "Chỉ Super Admin mới được quản lý tài khoản Admin");
        }
    }

    private static boolean isAdminRole(AccountRole role) {
        return role == AccountRole.ADMIN || role == AccountRole.SUPER_ADMIN;
    }

    /** Optional display name: blank input means "no name", never an empty string in the DB. */
    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
