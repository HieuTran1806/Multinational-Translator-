package vn.edu.thuyetminh.access;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AccessPackageRepository extends JpaRepository<AccessPackage, Long> {

    Optional<AccessPackage> findByCodeAndActiveTrue(String code);
}
