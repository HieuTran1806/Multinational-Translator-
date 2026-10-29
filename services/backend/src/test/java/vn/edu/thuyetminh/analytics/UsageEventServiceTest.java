package vn.edu.thuyetminh.analytics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import vn.edu.thuyetminh.access.AuthenticatedVisitor;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;

class UsageEventServiceTest {

    private final UsageEventStore store = mock(UsageEventStore.class);
    private final Instant now = Instant.parse("2026-10-29T12:00:00Z");
    private final Clock clock = Clock.fixed(now, ZoneOffset.UTC);
    private final AuthenticatedVisitor visitor = new AuthenticatedVisitor(42L, "DEMO_24H", now.plusSeconds(3600));
    private UsageEventService service;

    @BeforeEach
    void setUp() {
        service = new UsageEventService(store, clock);
    }

    @Test
    void recordsValidEventWithGrant() {
        service.record(visitor, "poi_view", 10L, "evt-01");

        ArgumentCaptor<UsageEvent> captor = ArgumentCaptor.forClass(UsageEvent.class);
        verify(store).save(captor.capture());

        UsageEvent saved = captor.getValue();
        assertThat(saved.getEventType()).isEqualTo("poi_view");
        assertThat(saved.getGrantId()).isEqualTo(42L);
        assertThat(saved.getPoiId()).isEqualTo(10L);
        assertThat(saved.getEventId()).isEqualTo("evt-01");
        assertThat(saved.getOccurredAt()).isEqualTo(now);
    }

    @Test
    void rejectsInvalidEventType() {
        assertThatThrownBy(() -> service.record(visitor, "invalid_type", 10L, "evt-02"))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode())
                .isEqualTo(ErrorCode.VALIDATION_FAILED);

        verify(store, never()).save(any());
    }

    @Test
    void dedupIgnoresAlreadyStoredEventId() {
        when(store.existsByEventId("evt-dup")).thenReturn(true);

        service.record(visitor, "session_start", null, "evt-dup");

        verify(store, never()).save(any());
    }

    @Test
    void rejectsMalformedEventId() {
        assertThatThrownBy(() -> service.record(visitor, "audio_play", null, "bad id with spaces!"))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode())
                .isEqualTo(ErrorCode.VALIDATION_FAILED);

        verify(store, never()).save(any());
    }
}
