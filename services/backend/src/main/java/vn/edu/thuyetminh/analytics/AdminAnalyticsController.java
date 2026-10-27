package vn.edu.thuyetminh.analytics;

import java.time.Instant;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * UC14 — system-wide analytics for Admin and Super Admin (hasAnyRole in SecurityConfig).
 * Aggregated data only; no export, no drill-down into raw events.
 */
@RestController
@RequestMapping("/api/v1/admin/analytics")
@Tag(name = "Admin – Analytics")
@SecurityRequirement(name = "bearer")
public class AdminAnalyticsController {

    private final AnalyticsService service;

    public AdminAnalyticsController(AnalyticsService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    @Operation(summary = "Tổng hợp usage toàn hệ thống theo khoảng thời gian (UTC)")
    public AnalyticsService.Summary summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return service.systemSummary(from, to);
    }
}
