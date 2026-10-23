package vn.edu.thuyetminh.auth.persistence;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.auth.Account;
import vn.edu.thuyetminh.auth.AccountRepository;
import vn.edu.thuyetminh.auth.AccountStore;

@Repository
public class JpaAccountStore implements AccountStore {
    private final AccountRepository repository;

    public JpaAccountStore(AccountRepository repository) {
        this.repository = repository;
    }

    @Override public Optional<Account> findByUsername(String username) {
        return repository.findByUsername(username);
    }

    @Override public Optional<Account> findById(Long id) {
        return repository.findById(id);
    }

    @Override public Account save(Account account) {
        return repository.save(account);
    }
}