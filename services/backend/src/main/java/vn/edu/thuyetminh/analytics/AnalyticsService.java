package vn.edu.thuyetminh.analytics;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;

/**
 * UC14 system-scope summary. All aggregation happens in the database; a UTC day is the reporting unit
 * and timestamps are stored/returned in UTC (UI renders Asia/Ho_Chi_Minh).
 */
@Service
public class AnalyticsService {

    private static final int TOP_POI_LIMIT = 10;

    private final UsageEventStore usageEvents;
    private final Clock clock;

    public AnalyticsService(UsageEventStore usageEvents, Clock clock) {
        this.usageEvents = usageEvents;
        this.clock = clock;
    }

    public record Summary(Map<String, Long> totals, List<DailyCount> daily,
                          List<PoiViews> topPois, Instant generatedAt) {
    }

    public record PoiViews(Long poiId, long views) {
    }

    @Transactional(readOnly = true)
    public Summary systemSummary(Instant from, Instant to) {
        Range range = validatedRange(from, to);
        Map<String, Long> totals = toTotals(usageEvents.countTotals(range.from(), range.to()));
        List<PoiViews> top = usageEvents.countViewsByPoi(range.from(), range.to()).stream()
                .limit(TOP_POI_LIMIT)
                .map(row -> new PoiViews((Long) row[0], (Long) row[1])).toList();
        return new Summary(totals, usageEvents.countDaily(range.from(), range.to()), top, clock.instant());
    }

    private record Range(Instant from, Instant to) {
    }

    private Range validatedRange(Instant from, Instant to) {
        if (from == null && to == null) {
            to = clock.instant();
            from = to.minus(Duration.ofDays(30));
        } else if (from == null) {
            from = to.minus(Duration.ofDays(30));
        } else if (to == null) {
            to = clock.instant();
        }
        if (!from.isBefore(to)) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "Khoảng thời gian không hợp lệ: 'from' phải trước 'to'");
        }
        return new Range(from, to);
    }

    private static Map<String, Long> toTotals(List<Object[]> rows) {
        Map<String, Long> totals = new HashMap<>();
        for (Object[] row : rows) {
            totals.put((String) row[0], (Long) row[1]);
        }
        return totals;
    }
}
