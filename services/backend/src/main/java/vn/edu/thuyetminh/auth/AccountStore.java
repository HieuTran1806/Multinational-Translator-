package vn.edu.thuyetminh.auth;

import java.util.Optional;
import vn.edu.thuyetminh.common.web.PageResponse;

public interface AccountStore {
    Optional<Account> findByUsername(String username);
    Optional<Account> findById(Long id);
    Optional<Account> findLiveByUsername(String username);
    Optional<Account> findLiveById(Long id);
    Account save(Account account);
    PageResponse<Account> searchAdmins(String q, int page, int size);
}
