package vn.edu.thuyetminh.audit;

import java.time.Instant;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.edu.thuyetminh.common.web.PageResponse;

/**
 * UC15 — audit log lookup. Super Admin only (see SecurityConfig): Admin must not see the
 * system-wide audit log. Records are append-only; this controller exposes read-only access.
 */
@RestController
@RequestMapping("/api/v1/admin/audit")
@Tag(name = "Admin – Audit log")
@SecurityRequirement(name = "bearer")
public class AuditLogController {

    private final AuditService service;

    public AuditLogController(AuditService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Tra cứu audit log, mới nhất trước, có lọc và phân trang")
    public PageResponse<AuditDtos.AuditLogView> list(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.search(action, actorId, resourceType, result, from, to, page, size)
                .map(AuditDtos.AuditLogView::from);
    }
}
