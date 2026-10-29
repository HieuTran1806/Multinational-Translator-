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

    /** UC10 lists only live Admin accounts; Super Admin accounts are outside its management scope. */
    @Query("select a from Account a where a.deletedAt is null "
            + "and a.role = vn.edu.thuyetminh.auth.AccountRole.ADMIN "
            + "and (:q = '' or lower(a.username) like lower(concat('%', :q, '%')) "
            + "or lower(a.displayName) like lower(concat('%', :q, '%')))")
    Page<Account> searchAdmins(@Param("q") String q, Pageable pageable);
}
