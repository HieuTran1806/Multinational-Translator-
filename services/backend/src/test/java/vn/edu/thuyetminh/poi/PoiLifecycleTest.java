package vn.edu.thuyetminh.poi;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class PoiLifecycleTest {

    @Test
    void softDeleteMakesPoiDraftAndRecordsDeletionTimeWithoutRemovingEntity() {
        Poi poi = new Poi("BEN-DUOC", "Bến Dược", 11.14, 106.46);
        poi.publish(Instant.parse("2026-01-01T00:00:00Z"));
        Instant deletedAt = Instant.parse("2026-02-01T00:00:00Z");

        poi.softDelete(deletedAt);

        assertTrue(poi.isDeleted());
        assertEquals(deletedAt, poi.getDeletedAt());
        assertEquals(PoiStatus.DRAFT, poi.getStatus());
        assertFalse(poi.isPublished());
        assertEquals(null, poi.getPublishedAt());
    }

    @Test
    void adminFieldsKeepTheRequestedCategoryAndTriggerRadius() {
        Poi poi = new Poi("BEN-DUOC", "Bến Dược", 11.14, 106.46);
        poi.updateAdminFields("Di tích lịch sử", 125.0);

        assertEquals("Di tích lịch sử", poi.getCategory());
        assertEquals(125.0, poi.getTriggerRadius());
    }
}
