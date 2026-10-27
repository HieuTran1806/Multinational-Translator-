package vn.edu.thuyetminh.analytics;

import java.time.Instant;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.edu.thuyetminh.auth.AuthenticatedAdmin;

/**
 * UC13 — a Seller sees usage and QR statistics for its own data only. The scope comes from the
 * authenticated principal on the server; a seller id sent by the client is ignored by design.
 */
@RestController
@RequestMapping("/api/v1/seller/reports")
@Tag(name = "Seller – Báo cáo của tôi")
@SecurityRequirement(name = "bearer")
public class SellerReportController {

    private final AnalyticsService service;

    public SellerReportController(AnalyticsService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    @Operation(summary = "Thống kê của Seller hiện tại theo khoảng thời gian (UTC)")
    public AnalyticsService.Summary summary(
            @AuthenticationPrincipal AuthenticatedAdmin seller,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return service.sellerSummary(seller.accountId(), from, to);
    }
}
