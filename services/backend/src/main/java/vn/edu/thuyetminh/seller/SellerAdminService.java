package vn.edu.thuyetminh.seller;

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
 * UC09 — Admin creates and manages Seller accounts. Sellers never self-register; Super Admin must not
 * manage Sellers (enforced by SecurityConfig: /api/v1/admin/** requires ROLE_ADMIN). Soft delete keeps
 * related business data while blocking login and new activity.
 */
@Service
public class SellerAdminService {

    private static final Logger log = LoggerFactory.getLogger(SellerAdminService.class);

    private final AccountStore accounts;
    private final PasswordEncoder passwordEncoder;
    private final AuditService audit;
    private final Clock clock;

    public SellerAdminService(AccountStore accounts, PasswordEncoder passwordEncoder, AuditService audit,
                              Clock clock) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<SellerDtos.SellerView> list(String q, int page, int size) {
        return accounts.searchSellers(blankToNull(q), page, size).map(SellerDtos.SellerView::from);
    }

    @Transactional
    public SellerDtos.SellerView create(SellerDtos.CreateRequest req, AuthenticatedAdmin admin) {
        String username = req.username().trim();
        if (accounts.findLiveByUsername(username).isPresent()) {
            throw new ApiException(ErrorCode.CONFLICT, "Tên đăng nhập đã tồn tại");
        }
        Account seller = accounts.save(new Account(username, passwordEncoder.encode(req.password()),
                req.displayName() == null || req.displayName().isBlank() ? null : req.displayName().trim(),
                AccountRole.SELLER));
        audit.record(AuditService.Actor.from(admin), AuditService.SELLER_CREATE, "ACCOUNT",
                String.valueOf(seller.getId()), AuditService.RESULT_SUCCESS, "username=" + username);
        log.info("Seller '{}' created by '{}'", username, admin.username());
        return SellerDtos.SellerView.from(seller);
    }

    @Transactional
    public SellerDtos.SellerView update(Long id, SellerDtos.UpdateRequest req, AuthenticatedAdmin admin) {
        Account seller = liveSeller(id);
        if (req.displayName() != null) {
            seller.setDisplayName(req.displayName().isBlank() ? null : req.displayName().trim());
        }
        if (req.enabled() != null) {
            seller.setEnabled(req.enabled());
        }
        audit.record(AuditService.Actor.from(admin), AuditService.SELLER_UPDATE, "ACCOUNT", String.valueOf(id),
                AuditService.RESULT_SUCCESS, "displayName=" + seller.getDisplayName() + ", enabled=" + seller.isEnabled());
        return SellerDtos.SellerView.from(accounts.save(seller));
    }

    /** A1/E2: soft delete — history survives; login and new activity are blocked by the live lookups. */
    @Transactional
    public void delete(Long id, AuthenticatedAdmin admin) {
        Account seller = liveSeller(id);
        seller.softDelete(clock.instant(), admin.accountId());
        accounts.save(seller);
        audit.record(AuditService.Actor.from(admin), AuditService.SELLER_DELETE, "ACCOUNT", String.valueOf(id),
                AuditService.RESULT_SUCCESS, "username=" + seller.getUsername());
        log.info("Seller id={} soft-deleted by '{}'", id, admin.username());
    }

    /** A3: reset credentials to a new admin-provided password. */
    @Transactional
    public void resetPassword(Long id, SellerDtos.ResetPasswordRequest req, AuthenticatedAdmin admin) {
        Account seller = liveSeller(id);
        seller.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        accounts.save(seller);
        audit.record(AuditService.Actor.from(admin), AuditService.SELLER_RESET_PASSWORD, "ACCOUNT",
                String.valueOf(id), AuditService.RESULT_SUCCESS, null);
        log.info("Seller id={} password reset by '{}'", id, admin.username());
    }

    private Account liveSeller(Long id) {
        return accounts.findLiveById(id)
                .filter(a -> a.getRole() == AccountRole.SELLER)
                .orElseThrow(() -> ApiException.notFound("Tài khoản Seller"));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
