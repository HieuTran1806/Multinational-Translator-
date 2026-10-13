package vn.edu.thuyetminh.language;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LanguageRepository extends JpaRepository<Language, String> {

    List<Language> findByEnabledTrueOrderBySortOrderAsc();
}
