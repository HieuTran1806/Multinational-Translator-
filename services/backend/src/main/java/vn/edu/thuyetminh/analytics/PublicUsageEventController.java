package vn.edu.thuyetminh.analytics;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.edu.thuyetminh.access.AuthenticatedVisitor;

/**
 * UC13/UC14 metric ingestion from the User app. Requires a valid visitor grant; the grant id is taken
 * from the authenticated principal, never from the request body.
 */
@RestController
@RequestMapping("/api/v1/public/usage-events")
@Tag(name = "User – Số liệu sử dụng")
@SecurityRequirement(name = "bearer")
public class PublicUsageEventController {

    private final UsageEventService service;

    public PublicUsageEventController(UsageEventService service) {
        this.service = service;
    }

    public record IngestRequest(String eventType, Long poiId, String eventId) {
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Ghi nhận sự kiện sử dụng (poi_view / audio_play / session_start)")
    public void record(@Valid @RequestBody IngestRequest request,
                       @AuthenticationPrincipal AuthenticatedVisitor visitor) {
        service.record(visitor, request.eventType(), request.poiId(), request.eventId());
    }
}
