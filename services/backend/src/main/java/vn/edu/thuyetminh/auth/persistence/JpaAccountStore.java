package vn.edu.thuyetminh.auth.persistence;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.auth.Account;
import vn.edu.thuyetminh.auth.AccountRepository;
import vn.edu.thuyetminh.auth.AccountRole;
import vn.edu.thuyetminh.auth.AccountStore;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.common.web.PageResponse;

@Repository
public class JpaAccountStore implements AccountStore {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "createdAt");

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

    @Override public Optional<Account> findLiveByUsername(String username) {
        return repository.findByUsernameAndDeletedAtIsNull(username);
    }

    @Override public Optional<Account> findLiveById(Long id) {
        return repository.findByIdAndDeletedAtIsNull(id);
    }

    @Override public Account save(Account account) {
        return repository.save(account);
    }

    @Override public PageResponse<Account> searchAdmins(String q, int page, int size) {
        String query = q == null ? "" : q;
        return toPage(repository.searchAdmins(query, pageRequest(page, size)));
    }

    private static PageRequest pageRequest(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "page phải >= 0 và size trong khoảng 1.." + MAX_PAGE_SIZE);
        }
        return PageRequest.of(page, size, NEWEST_FIRST);
    }

    private static PageResponse<Account> toPage(Page<Account> result) {
        return new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }
}
