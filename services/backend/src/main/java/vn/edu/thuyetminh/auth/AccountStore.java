package vn.edu.thuyetminh.auth;

import java.util.Optional;

public interface AccountStore {
    Optional<Account> findByUsername(String username);
    Optional<Account> findById(Long id);
    Account save(Account account);
}