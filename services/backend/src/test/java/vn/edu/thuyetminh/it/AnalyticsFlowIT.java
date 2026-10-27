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

/** UC13 (seller report, own data only) + UC14 (system analytics) + usage-event ingestion. */
class AnalyticsFlowIT extends AbstractIntegrationTest {

    private String createSeller(String username) throws Exception {
        String body = mvc.perform(post("/api/v1/admin/sellers").header("Authorization", bearer(login()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"seller-pass-1\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return String.valueOf(((Number) JsonPath.read(body, "$.id")).longValue());
    }

    private String sellerToken(String username) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"seller-pass-1\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    /** Issues a QR assigned to the seller, redeems it on a device, returns grant headers + seller token. */
    private record SellerGrant(String sellerToken, String grantToken, String deviceId) {
    }

    private SellerGrant activateSellerQr(String username) throws Exception {
        createSeller(username);
        String token = sellerToken(username);
        String qrBody = mvc.perform(post("/api/v1/admin/access-qrs").header("Authorization", bearer(login()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sellerUsername\":\"" + username + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String qrToken = JsonPath.read(qrBody, "$.qrToken");
        String deviceId = "it-device-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        String grant = redeem(qrToken, deviceId);
        return new SellerGrant(token, grant, deviceId);
    }

    @Test
    void usageEventsAreCountedForSystemAndSellerScope() throws Exception {
        SellerGrant g = activateSellerQr("seller_r1");

        // two poi_view events, one duplicated by event_id -> dedup to one
        mvc.perform(post("/api/v1/public/usage-events").header("Authorization", bearer(g.grantToken()))
                        .header("X-Device-Id", g.deviceId()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"poi_view\",\"eventId\":\"evt-1\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/public/usage-events").header("Authorization", bearer(g.grantToken()))
                        .header("X-Device-Id", g.deviceId()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"poi_view\",\"eventId\":\"evt-1\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/public/usage-events").header("Authorization", bearer(g.grantToken()))
                        .header("X-Device-Id", g.deviceId()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"audio_play\"}"))
                .andExpect(status().isNoContent());

        // UC14: system totals (admin)
        mvc.perform(get("/api/v1/admin/analytics/summary").header("Authorization", bearer(login())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totals.poi_view").value(1))
                .andExpect(jsonPath("$.totals.audio_play").value(1))
                .andExpect(jsonPath("$.generatedAt").isNotEmpty());

        // UC13: the seller sees the same usage, scoped to its own QRs
        mvc.perform(get("/api/v1/seller/reports/summary").header("Authorization", bearer(g.sellerToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totals.poi_view").value(1))
                .andExpect(jsonPath("$.qrByStatus.REDEEMED").value(1));

        // another seller must not see the first seller's data (E2); its own QR is redeemed but has no usage
        SellerGrant other = activateSellerQr("seller_r2");
        mvc.perform(get("/api/v1/seller/reports/summary").header("Authorization", bearer(other.sellerToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totals").isEmpty())
                .andExpect(jsonPath("$.qrByStatus.REDEEMED").value(1));
    }

    @Test
    void usageEventsRequireValidGrant() throws Exception {
        mvc.perform(post("/api/v1/public/usage-events").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"poi_view\"}"))
                .andExpect(status().isUnauthorized());
        // invalid event type rejected even with a grant
        SellerGrant g = activateSellerQr("seller_r3");
        mvc.perform(post("/api/v1/public/usage-events").header("Authorization", bearer(g.grantToken()))
                        .header("X-Device-Id", g.deviceId()).contentType(MediaType.APPLICATION_JSON)
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
