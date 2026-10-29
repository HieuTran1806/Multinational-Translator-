package vn.edu.thuyetminh.analytics;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsageEventRepository extends JpaRepository<UsageEvent, Long> {

    boolean existsByEventId(String eventId);

    /** UC14: per-day counts for the whole system. 'to' is exclusive. */
    @Query("""
            select new vn.edu.thuyetminh.analytics.DailyCount(cast(e.occurredAt as LocalDate), e.eventType, count(e))
            from UsageEvent e
            where e.occurredAt >= :from and e.occurredAt < :to
            group by cast(e.occurredAt as LocalDate), e.eventType
            order by cast(e.occurredAt as LocalDate)
            """)
    List<DailyCount> countDaily(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
            select e.eventType, count(e)
            from UsageEvent e
            where e.occurredAt >= :from and e.occurredAt < :to
            group by e.eventType
            """)
    List<Object[]> countTotals(@Param("from") Instant from, @Param("to") Instant to);

    /** UC14: most viewed POIs, most viewed first (the service keeps the top slice). */
    @Query("""
            select e.poiId, count(e)
            from UsageEvent e
            where e.eventType = 'poi_view' and e.poiId is not null
              and e.occurredAt >= :from and e.occurredAt < :to
            group by e.poiId
            order by count(e) desc
            """)
    List<Object[]> countViewsByPoi(@Param("from") Instant from, @Param("to") Instant to);
}
