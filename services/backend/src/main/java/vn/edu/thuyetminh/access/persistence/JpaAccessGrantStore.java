package vn.edu.thuyetminh.access.persistence;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.access.AccessGrant;
import vn.edu.thuyetminh.access.AccessGrantRepository;
import vn.edu.thuyetminh.access.AccessGrantStore;

/** JPA adapter for {@link AccessGrantStore}. */
@Repository
public class JpaAccessGrantStore implements AccessGrantStore {

    private final AccessGrantRepository grants;

    public JpaAccessGrantStore(AccessGrantRepository grants) {
        this.grants = grants;
    }

    @Override
    public Optional<AccessGrant> findByTokenHash(String tokenHash) {
        return grants.findByTokenHash(tokenHash);
    }

    @Override
    public Optional<AccessGrant> findByQrId(Long qrId) {
        return grants.findByQrId(qrId);
    }

    @Override
    public AccessGrant saveNow(AccessGrant grant) {
        return grants.saveAndFlush(grant);
    }
}
