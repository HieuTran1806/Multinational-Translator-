package vn.edu.thuyetminh.tts;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.edu.thuyetminh.auth.AuthenticatedAdmin;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin – TTS")
@SecurityRequirement(name = "bearer")
public class TtsAdminController {

    private final TtsJobService service;

    public TtsAdminController(TtsJobService service) {
        this.service = service;
    }

    @GetMapping("/tts/status")
    @Operation(summary = "TTS đã được cấu hình chưa")
    public TtsJobService.TtsStatus status() {
        return service.status();
    }

    @PostMapping("/pois/{poiId}/translations/{lang}/tts")
    @Operation(summary = "Yêu cầu tạo audio bằng Google Cloud TTS (bất đồng bộ, polling trạng thái)")
    public ResponseEntity<TtsJobView> request(@PathVariable Long poiId, @PathVariable String lang,
                                              @AuthenticationPrincipal AuthenticatedAdmin principal) {
        TtsJobView view = service.requestGeneration(poiId, lang, principal.accountId());
        return ResponseEntity.status(view.reusedExisting() ? HttpStatus.OK : HttpStatus.ACCEPTED).body(view);
    }

    @GetMapping("/tts/jobs/{jobId}")
    @Operation(summary = "Trạng thái tác vụ TTS")
    public TtsJobView job(@PathVariable Long jobId) {
        return service.getJob(jobId);
    }
}
