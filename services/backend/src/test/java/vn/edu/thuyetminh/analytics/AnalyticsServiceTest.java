package vn.edu.thuyetminh.analytics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;

class AnalyticsServiceTest {

    private final UsageEventStore store = mock(UsageEventStore.class);
    private final Instant now = Instant.parse("2026-10-29T12:00:00Z");
    private final Clock clock = Clock.fixed(now, ZoneOffset.UTC);
    private AnalyticsService service;

    @BeforeEach
    void setUp() {
        service = new AnalyticsService(store, clock);
    }

    @Test
    void defaultRangePopulatesBothFromAndToBasedOnClock() {
        when(store.countTotals(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"poi_view", 5L}));
        when(store.countViewsByPoi(any(), any())).thenReturn(List.<Object[]>of());
        when(store.countDaily(any(), any())).thenReturn(List.of());

        AnalyticsService.Summary summary = service.systemSummary(null, null);

        assertThat(summary).isNotNull();
        assertThat(summary.totals()).containsEntry("poi_view", 5L);
        assertThat(summary.generatedAt()).isEqualTo(now);

        ArgumentCaptor<Instant> fromCap = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> toCap = ArgumentCaptor.forClass(Instant.class);
        verify(store).countTotals(fromCap.capture(), toCap.capture());

        assertThat(toCap.getValue()).isEqualTo(now);
        assertThat(fromCap.getValue()).isEqualTo(now.minus(Duration.ofDays(30)));
    }

    @Test
    void singleEndPointsAreDefaultedConsistently() {
        when(store.countTotals(any(), any())).thenReturn(List.<Object[]>of());
        when(store.countViewsByPoi(any(), any())).thenReturn(List.<Object[]>of());
        when(store.countDaily(any(), any())).thenReturn(List.of());

        Instant customFrom = now.minus(Duration.ofDays(7));
        service.systemSummary(customFrom, null);

        ArgumentCaptor<Instant> fromCap = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> toCap = ArgumentCaptor.forClass(Instant.class);
        verify(store).countTotals(fromCap.capture(), toCap.capture());

        assertThat(fromCap.getValue()).isEqualTo(customFrom);
        assertThat(toCap.getValue()).isEqualTo(now);
    }

    @Test
    void invalidRangeThrowsApiException() {
        Instant t1 = Instant.parse("2026-10-29T12:00:00Z");
        Instant t2 = Instant.parse("2026-10-28T12:00:00Z");

        assertThatThrownBy(() -> service.systemSummary(t1, t2))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode())
                .isEqualTo(ErrorCode.BAD_REQUEST);

        assertThatThrownBy(() -> service.systemSummary(t1, t1))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getCode())
                .isEqualTo(ErrorCode.BAD_REQUEST);
    }
}
