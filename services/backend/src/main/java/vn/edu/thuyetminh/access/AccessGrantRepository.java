package vn.edu.thuyetminh.access;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccessGrantRepository extends JpaRepository<AccessGrant, Long> {

    @EntityGraph(attributePaths = {"qr", "qr.accessPackage"})
    Optional<AccessGrant> findByTokenHash(String tokenHash);

    Optional<AccessGrant> findByQrId(Long qrId);
}
