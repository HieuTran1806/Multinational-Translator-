package vn.edu.thuyetminh.auth;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByUsername(String username);

    Optional<Account> findByUsernameAndDeletedAtIsNull(String username);

    Optional<Account> findByIdAndDeletedAtIsNull(Long id);

    /** UC09: live accounts only (soft-deleted ones are invisible); empty q means any. */
    @Query("select a from Account a where a.deletedAt is null "
            + "and a.role = vn.edu.thuyetminh.auth.AccountRole.SELLER "
            + "and (:q = '' or lower(a.username) like lower(concat('%', :q, '%')) "
            + "or lower(a.displayName) like lower(concat('%', :q, '%')))")
    Page<Account> searchSellers(@Param("q") String q, Pageable pageable);

    long countByRoleAndDeletedAtIsNull(AccountRole role);
}
