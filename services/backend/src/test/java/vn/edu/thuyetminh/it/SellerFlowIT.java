package vn.edu.thuyetminh.it;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.jayway.jsonpath.JsonPath;

import vn.edu.thuyetminh.support.AbstractIntegrationTest;

/** UC09 (seller management) + UC15 (audit log visibility and recorded events). */
class SellerFlowIT extends AbstractIntegrationTest {

    private String createSeller(String username) throws Exception {
        String body = mvc.perform(post("/api/v1/admin/sellers").header("Authorization", bearer(login()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"seller-pass-1\","
                                + "\"displayName\":\"Seller " + username + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return String.valueOf(((Number) JsonPath.read(body, "$.id")).longValue());
    }

    private String superAdminToken() throws Exception {
        jdbc.update("INSERT INTO account (username, password_hash, display_name, role) VALUES (?, ?, ?, 'SUPER_ADMIN')",
                "it_super2", encoder.encode("it-super-password-123"), "IT Super");
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_super2\",\"password\":\"it-super-password-123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    @Test
    void adminCreatesUpdatesAndSoftDeletesSeller() throws Exception {
        String sellerId = createSeller("seller_a");
        // duplicate username rejected (E1)
        mvc.perform(post("/api/v1/admin/sellers").header("Authorization", bearer(login()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"seller_a\",\"password\":\"seller-pass-1\"}"))
                .andExpect(status().isConflict());
        // disable + rename
        mvc.perform(put("/api/v1/admin/sellers/" + sellerId).header("Authorization", bearer(login()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"Seller A2\",\"enabled\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
        // reset password
        mvc.perform(post("/api/v1/admin/sellers/" + sellerId + "/reset-password")
                        .header("Authorization", bearer(login())).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\":\"new-pass-22\"}"))
                .andExpect(status().isOk());
        // soft delete, then the seller can no longer log in (E2)
        mvc.perform(delete("/api/v1/admin/sellers/" + sellerId).header("Authorization", bearer(login())))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"seller_a\",\"password\":\"new-pass-22\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void sellerLoginWorksAndSellerCannotReachAdminApi() throws Exception {
        createSeller("seller_b");
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"seller_b\",\"password\":\"seller-pass-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.account.role").value("SELLER"))
                .andReturn().getResponse().getContentAsString();
        String sellerToken = JsonPath.read(body, "$.accessToken");
        mvc.perform(get("/api/v1/admin/sellers").header("Authorization", bearer(sellerToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdminCannotManageSellersButAloneReadsAudit() throws Exception {
        createSeller("seller_c");
        String superToken = superAdminToken();
        // UC09: Super Admin must not manage Sellers
        mvc.perform(get("/api/v1/admin/sellers").header("Authorization", bearer(superToken)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/sellers").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"seller_x\",\"password\":\"seller-pass-1\"}"))
                .andExpect(status().isForbidden());
        // UC15: Admin must not read the audit log; Super Admin sees the SELLER_CREATE event
        mvc.perform(get("/api/v1/admin/audit").header("Authorization", bearer(login())))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/audit").header("Authorization", bearer(superToken))
                        .param("action", "SELLER_CREATE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].result").value("SUCCESS"));
    }

    @Test
    void auditLogFiltersByResultAndResource() throws Exception {
        // a denied redeem attempt writes a DENIED audit row (UC15 mandatory events)
        mvc.perform(post("/api/v1/public/access/redeem").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrToken\":\"no-such-token\",\"deviceId\":\"it-device-0123456789abc\"}"))
                .andExpect(status().isBadRequest());
        String superToken = superAdminToken();
        mvc.perform(get("/api/v1/admin/audit").header("Authorization", bearer(superToken))
                        .param("result", "DENIED").param("resourceType", "ACCESS_QR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].action").value("QR_REDEEM"));
    }
}
