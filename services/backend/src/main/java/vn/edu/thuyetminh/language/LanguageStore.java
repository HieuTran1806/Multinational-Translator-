package vn.edu.thuyetminh.language;

import java.util.List;
import java.util.Optional;

public interface LanguageStore {
    Optional<Language> findByCode(String code);
    List<Language> listEnabled();
}