package vn.edu.thuyetminh.language;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Languages")
public class LanguageController {

    private final LanguageService service;

    public LanguageController(LanguageService service) {
        this.service = service;
    }

    @GetMapping({"/api/v1/public/languages", "/api/v1/admin/languages"})
    @Operation(summary = "Danh sách ngôn ngữ thuyết minh đang bật")
    public List<LanguageService.LanguageResponse> list() {
        return service.listEnabled();
    }
}
