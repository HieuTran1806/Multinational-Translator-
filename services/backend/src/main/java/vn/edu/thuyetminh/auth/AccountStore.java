package vn.edu.thuyetminh.auth;

import java.util.Optional;

import vn.edu.thuyetminh.common.web.PageResponse;

public interface AccountStore {
    Optional<Account> findByUsername(String username);
    Optional<Account> findById(Long id);
    /** Live (non soft-deleted) lookups used for login, authentication and business operations. */
    Optional<Account> findLiveByUsername(String username);
    Optional<Account> findLiveById(Long id);
    Account save(Account account);
    /** UC09: live Seller accounts, optional search on username/display name, newest first. */
    PageResponse<Account> searchSellers(String q, int page, int size);
}
