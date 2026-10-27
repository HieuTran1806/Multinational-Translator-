package vn.edu.thuyetminh.analytics;

import java.time.Clock;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.thuyetminh.access.AuthenticatedVisitor;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;

/**
 * Ingests raw usage events (UC13/UC14 metric definitions). Identity comes from the authenticated visitor
 * grant on the server side; {@code eventId} deduplication makes client retries idempotent.
 */
@Service
public class UsageEventService {

    private static final Logger log = LoggerFactory.getLogger(UsageEventService.class);
    private static final Set<String> TYPES = Set.of("poi_view", "audio_play", "session_start");

    private final UsageEventStore store;
    private final Clock clock;

    public UsageEventService(UsageEventStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    @Transactional
    public void record(AuthenticatedVisitor visitor, String eventType, Long poiId, String eventId) {
        if (eventType == null || !TYPES.contains(eventType)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "event_type phải là một trong: poi_view, audio_play, session_start");
        }
        String dedup = eventId == null || eventId.isBlank() ? null : eventId.trim();
        if (dedup != null && (dedup.length() > 64 || !dedup.matches("^[A-Za-z0-9_-]+$"))) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "event_id không hợp lệ");
        }
        if (dedup != null && store.existsByEventId(dedup)) {
            return; // idempotent retry
        }
        try {
            store.save(new UsageEvent(eventType, visitor.grantId(), poiId, dedup, clock.instant()));
        } catch (DataIntegrityViolationException e) {
            // concurrent duplicate with the same dedup key — treat as a no-op
            log.debug("Duplicate usage event {}", dedup);
        }
    }
}
