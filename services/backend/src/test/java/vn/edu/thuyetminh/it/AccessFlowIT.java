package vn.edu.thuyetminh.it;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.jayway.jsonpath.JsonPath;

import vn.edu.thuyetminh.access.AccessDtos;
import vn.edu.thuyetminh.access.AccessGrantService;
import vn.edu.thuyetminh.common.error.ApiException;
import vn.edu.thuyetminh.common.error.ErrorCode;
import vn.edu.thuyetminh.support.AbstractIntegrationTest;

/** UC02 — scan a single-use QR, get a time-limited grant bound to the device, use the User API. */
class AccessFlowIT extends AbstractIntegrationTest {

    private static final String DEVICE_A = "device-aaaaaaaaaaaaaaaa";
    private static final String DEVICE_B = "device-bbbbbbbbbbbbbbbb";

    @Autowired
    private AccessGrantService accessGrantService;

    @Test
    void userApisRequireAGrantExceptLanguagesAndRedeem() throws Exception {
        mvc.perform(get("/api/v1/public/pois"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("ACCESS_REQUIRED"));
        mvc.perform(get("/api/v1/public/audio/1")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/public/access/me")).andExpect(status().isUnauthorized());
        // The scan screen still needs the language list (UC01) before any QR is redeemed.
        mvc.perform(get("/api/v1/public/languages")).andExpect(status().isOk());
    }

    @Test
    void adminIssuesQrAndUserRedeemsItForA24HourGrant() throws Exception {
        String issued = mvc.perform(post("/api/v1/admin/access-qrs").header("Authorization", bearer(login()))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"note\":\"Khách đoàn A\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ISSUED"))
                .andExpect(jsonPath("$.packageCode").value("DEMO_24H"))
                .andExpect(jsonPath("$.durationMinutes").value(1440))
                .andExpect(jsonPath("$.activationUrl").value(startsWith("http://localhost:5174/activate?t=")))
                .andReturn().getResponse().getContentAsString();
        String qrToken = JsonPath.read(issued, "$.qrToken");

        String grant = mvc.perform(post("/api/v1/public/access/redeem").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrToken\":\"" + qrToken + "\",\"deviceId\":\"" + DEVICE_A + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.packageCode").value("DEMO_24H"))
                .andReturn().getResponse().getContentAsString();
        String grantToken = JsonPath.read(grant, "$.accessToken");

        mvc.perform(get("/api/v1/public/access/me").with(asVisitor(grantToken, DEVICE_A)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.packageCode").value("DEMO_24H"))
                .andExpect(jsonPath("$.remainingSeconds", allOf(greaterThan(86_000), lessThanOrEqualTo(86_400))));
        mvc.perform(get("/api/v1/public/pois").with(asVisitor(grantToken, DEVICE_A))).andExpect(status().isOk());

        // Only hashes are stored: neither token appears in the database.
        assertThat(jdbc.queryForObject("SELECT status FROM access_qr", String.class)).isEqualTo("REDEEMED");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM access_qr WHERE token_hash = ?", Integer.class, qrToken))
                .isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM access_grant WHERE token_hash = ? OR device_hash = ?",
                Integer.class, grantToken, DEVICE_A)).isZero();
    }

    @Test
    void qrCanBeRedeemedOnlyOnce() throws Exception {
        String qr = issueQr();
        redeem(qr, DEVICE_A);
        mvc.perform(post("/api/v1/public/access/redeem").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrToken\":\"" + qr + "\",\"deviceId\":\"" + DEVICE_B + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ACCESS_QR_ALREADY_USED"));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM access_grant", Integer.class)).isEqualTo(1);
    }

    @Test
    void concurrentRedeemsOfTheSameQrGrantAccessExactlyOnce() throws Exception {
        String qr = issueQr();
        int attempts = 8;
        ExecutorService pool = Executors.newFixedThreadPool(attempts);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<ErrorCode>> results = new ArrayList<>();
        try {
            for (int i = 0; i < attempts; i++) {
                String device = "concurrent-device-" + i + "-xxxxxxxx";
                results.add(pool.submit(() -> {
                    start.await();
                    try {
                        accessGrantService.redeem(new AccessDtos.RedeemRequest(qr, device));
                        return null; // success
                    } catch (ApiException e) {
                        return e.getCode();
                    }
                }));
            }
            start.countDown();
            int successes = 0;
            for (Future<ErrorCode> f : results) {
                ErrorCode code = f.get(30, TimeUnit.SECONDS);
                if (code == null) {
                    successes++;
                } else {
                    assertThat(code).isEqualTo(ErrorCode.ACCESS_QR_ALREADY_USED);
                }
            }
            assertThat(successes).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM access_grant", Integer.class)).isEqualTo(1);
    }

    @Test
    void grantOnlyWorksOnTheDeviceThatRedeemedIt() throws Exception {
        String grant = redeem(issueQr(), DEVICE_A);
        mvc.perform(get("/api/v1/public/pois").with(asVisitor(grant, DEVICE_B)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("ACCESS_REQUIRED"));
        mvc.perform(get("/api/v1/public/pois").header("Authorization", bearer(grant)))
                .andExpect(status().isUnauthorized()); // no device header at all
        mvc.perform(get("/api/v1/public/pois").with(asVisitor(grant, DEVICE_A))).andExpect(status().isOk());
    }

    @Test
    void expiredGrantIsRejected() throws Exception {
        String grant = redeem(issueQr(), DEVICE_A);
        jdbc.update("UPDATE access_grant SET expires_at = now() - interval '1 minute'");
        mvc.perform(get("/api/v1/public/access/me").with(asVisitor(grant, DEVICE_A)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownOrTamperedQrIsRejectedWithAGenericError() throws Exception {
        String qr = issueQr();
        mvc.perform(post("/api/v1/public/access/redeem").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrToken\":\"" + qr + "x\",\"deviceId\":\"" + DEVICE_A + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ACCESS_QR_INVALID"));
        mvc.perform(post("/api/v1/public/access/redeem").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrToken\":\"\",\"deviceId\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        // A failed attempt must not consume the real QR.
        assertThat(jdbc.queryForObject("SELECT status FROM access_qr", String.class)).isEqualTo("ISSUED");
    }

    @Test
    void revokedQrCannotBeRedeemedAndRevokingARedeemedQrEndsItsGrant() throws Exception {
        String admin = bearer(login());
        String unused = issueQr();
        long unusedId = jdbc.queryForObject("SELECT max(id) FROM access_qr", Long.class);
        mvc.perform(post("/api/v1/admin/access-qrs/" + unusedId + "/revoke").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVOKED"));
        mvc.perform(post("/api/v1/public/access/redeem").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrToken\":\"" + unused + "\",\"deviceId\":\"" + DEVICE_A + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ACCESS_QR_INVALID"));

        String grant = redeem(issueQr(), DEVICE_B);
        long usedId = jdbc.queryForObject("SELECT max(id) FROM access_qr", Long.class);
        mvc.perform(get("/api/v1/public/access/me").with(asVisitor(grant, DEVICE_B))).andExpect(status().isOk());
        mvc.perform(post("/api/v1/admin/access-qrs/" + usedId + "/revoke").header("Authorization", admin))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/public/access/me").with(asVisitor(grant, DEVICE_B)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void grantNeverGivesAdminOrAccountAccess() throws Exception {
        String grant = redeem(issueQr(), DEVICE_A);
        mvc.perform(get("/api/v1/admin/pois").with(asVisitor(grant, DEVICE_A))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/auth/me").with(asVisitor(grant, DEVICE_A))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/admin/access-qrs").with(asVisitor(grant, DEVICE_A))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminListsQrsNewestFirstAndFiltersByStatus() throws Exception {
        String admin = bearer(login());
        issueQr();
        redeem(issueQr(), DEVICE_A);
        mvc.perform(get("/api/v1/admin/access-qrs").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(2))
                .andExpect(jsonPath("$.items[0].status").value("REDEEMED"))
                .andExpect(jsonPath("$.items[0].qrToken").doesNotExist());
        mvc.perform(get("/api/v1/admin/access-qrs").param("status", "ISSUED").header("Authorization", admin))
                .andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(post("/api/v1/admin/access-qrs").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"packageCode\":\"NO_SUCH\"}"))
                .andExpect(status().isBadRequest());
    }
}
