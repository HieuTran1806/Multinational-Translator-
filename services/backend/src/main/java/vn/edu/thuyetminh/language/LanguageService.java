package vn.edu.thuyetminh.language;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;

@Service
public class LanguageService {

    public record LanguageResponse(String code, String name, String nativeName) {
        static LanguageResponse from(Language l) {
            return new LanguageResponse(l.getCode(), l.getName(), l.getNativeName());
        }
    }

    private final LanguageStore repo;

    public LanguageService(LanguageStore repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<LanguageResponse> listEnabled() {
        return repo.listEnabled().stream().map(LanguageResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Language requireEnabled(String code) {
        return repo.findByCode(code == null ? "" : code)
                .filter(Language::isEnabled)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Ngôn ngữ '" + code + "' không được hỗ trợ"));
    }
}
