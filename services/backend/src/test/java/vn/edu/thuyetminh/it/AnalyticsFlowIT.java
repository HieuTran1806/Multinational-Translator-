package vn.edu.thuyetminh.it;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.jayway.jsonpath.JsonPath;

import vn.edu.thuyetminh.support.AbstractIntegrationTest;

/** UC14 system analytics and usage-event ingestion, using visitor grants independent of account roles. */
class AnalyticsFlowIT extends AbstractIntegrationTest {

    private String superAdminToken(String username) throws Exception {
        jdbc.update("INSERT INTO account (username, password_hash, display_name, role) VALUES (?, ?, ?, 'SUPER_ADMIN')",
                username, encoder.encode("it-super-password-123"), "IT " + username);
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"it-super-password-123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }
    private record ActivatedGrant(String grantToken, String deviceId) {
    }

    private ActivatedGrant activateQr() throws Exception {
        String qrBody = mvc.perform(post("/api/v1/admin/access-qrs").header("Authorization", bearer(login()))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String qrToken = JsonPath.read(qrBody, "$.qrToken");
        String deviceId = "it-device-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        return new ActivatedGrant(redeem(qrToken, deviceId), deviceId);
    }

    @Test
    void usageEventsAreCountedInSystemAnalyticsAndSuperAdminIsDenied() throws Exception {
        ActivatedGrant grant = activateQr();
        mvc.perform(post("/api/v1/public/usage-events").header("Authorization", bearer(grant.grantToken()))
                        .header("X-Device-Id", grant.deviceId()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"poi_view\",\"eventId\":\"evt-1\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/public/usage-events").header("Authorization", bearer(grant.grantToken()))
                        .header("X-Device-Id", grant.deviceId()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"poi_view\",\"eventId\":\"evt-1\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/public/usage-events").header("Authorization", bearer(grant.grantToken()))
                        .header("X-Device-Id", grant.deviceId()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"audio_play\"}"))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/admin/analytics/summary").header("Authorization", bearer(login())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totals.poi_view").value(1))
                .andExpect(jsonPath("$.totals.audio_play").value(1))
                .andExpect(jsonPath("$.generatedAt").isNotEmpty());

        mvc.perform(get("/api/v1/admin/analytics/summary")
                        .header("Authorization", bearer(superAdminToken("it_super_analytics"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void usageEventsRequireValidGrant() throws Exception {
        mvc.perform(post("/api/v1/public/usage-events").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"poi_view\"}"))
                .andExpect(status().isUnauthorized());
        ActivatedGrant grant = activateQr();
        mvc.perform(post("/api/v1/public/usage-events").header("Authorization", bearer(grant.grantToken()))
                        .header("X-Device-Id", grant.deviceId()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"hack\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalidTimeRangeIsRejected() throws Exception {
        mvc.perform(get("/api/v1/admin/analytics/summary").header("Authorization", bearer(login()))
                        .param("from", "2026-01-02T00:00:00Z").param("to", "2026-01-01T00:00:00Z"))
                .andExpect(status().isBadRequest());
    }
}
