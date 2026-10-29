package vn.edu.thuyetminh.analytics;

import java.time.Instant;
import java.util.List;

/** Persistence port for raw usage events (UC14). */
public interface UsageEventStore {

    UsageEvent save(UsageEvent event);

    boolean existsByEventId(String eventId);

    List<DailyCount> countDaily(Instant from, Instant to);

    /** Rows of [eventType, count]. */
    List<Object[]> countTotals(Instant from, Instant to);

    /** Rows of [poiId, viewCount], most viewed first. */
    List<Object[]> countViewsByPoi(Instant from, Instant to);
}
