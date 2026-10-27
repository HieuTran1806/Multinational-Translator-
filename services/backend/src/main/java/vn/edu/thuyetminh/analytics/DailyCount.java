package vn.edu.thuyetminh.analytics;

import java.time.LocalDate;

/** Projection row for per-day usage counts (UTC calendar day). */
public record DailyCount(LocalDate day, String eventType, long count) {
}
