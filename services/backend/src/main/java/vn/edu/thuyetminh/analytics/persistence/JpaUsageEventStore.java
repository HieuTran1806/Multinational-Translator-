package vn.edu.thuyetminh.analytics.persistence;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Repository;

import vn.edu.thuyetminh.analytics.DailyCount;
import vn.edu.thuyetminh.analytics.UsageEvent;
import vn.edu.thuyetminh.analytics.UsageEventRepository;
import vn.edu.thuyetminh.analytics.UsageEventStore;

@Repository
public class JpaUsageEventStore implements UsageEventStore {

    /** Postgres cannot determine the type of unbound null parameters (42P18), so open ranges use sentinels. */
    private static final Instant EPOCH = Instant.EPOCH;
    private static final Instant FAR_FUTURE = Instant.parse("9999-12-31T00:00:00Z");

    private final UsageEventRepository repository;

    public JpaUsageEventStore(UsageEventRepository repository) {
        this.repository = repository;
    }

    @Override public UsageEvent save(UsageEvent event) {
        return repository.saveAndFlush(event);
    }

    @Override public boolean existsByEventId(String eventId) {
        return repository.existsByEventId(eventId);
    }

    @Override public List<DailyCount> countDaily(Instant from, Instant to) {
        return repository.countDaily(range(from), rangeTo(to));
    }

    @Override public List<Object[]> countTotals(Instant from, Instant to) {
        return repository.countTotals(range(from), rangeTo(to));
    }

    @Override public List<Object[]> countViewsByPoi(Instant from, Instant to) {
        return repository.countViewsByPoi(range(from), rangeTo(to));
    }

    private static Instant range(Instant from) {
        return from == null ? EPOCH : from;
    }

    private static Instant rangeTo(Instant to) {
        return to == null ? FAR_FUTURE : to;
    }
}
