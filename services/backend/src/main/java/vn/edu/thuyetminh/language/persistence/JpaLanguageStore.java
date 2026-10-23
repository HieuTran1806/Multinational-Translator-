package vn.edu.thuyetminh.language.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.language.Language;
import vn.edu.thuyetminh.language.LanguageRepository;
import vn.edu.thuyetminh.language.LanguageStore;

@Repository
public class JpaLanguageStore implements LanguageStore {
    private final LanguageRepository repository;

    public JpaLanguageStore(LanguageRepository repository) {
        this.repository = repository;
    }

    @Override public Optional<Language> findByCode(String code) {
        return repository.findById(code);
    }

    @Override public List<Language> listEnabled() {
        return repository.findByEnabledTrueOrderBySortOrderAsc();
    }
}