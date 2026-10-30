package vn.edu.thuyetminh.it;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.jayway.jsonpath.JsonPath;

import vn.edu.thuyetminh.support.AbstractIntegrationTest;

/**
 * UC10 — Super Admin manages Admin/Super Admin accounts: authorization boundary, create/update/reset,
 * self-operation guards, "last active Super Admin" guard (E2) and audit trail.
 */
class AdminAccountFlowIT extends AbstractIntegrationTest {

    /** Inserts a Super Admin directly (there is no public endpoint that can create the first one). */
    private String superAdminToken(String username) throws Exception {
        jdbc.update("INSERT INTO account (username, password_hash, display_name, role) VALUES (?, ?, ?, 'SUPER_ADMIN')",
                username, encoder.encode("it-super-password-123"), "IT " + username);
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"it-super-password-123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    private long accountId(String username) {
        return jdbc.queryForObject("select id from account where username = ?", Long.class, username);
    }

    private long createAccount(String superToken, String username) throws Exception {
        String body = mvc.perform(post("/api/v1/admin/accounts").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"admin-pass-1\",\"displayName\":\"New " + username + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    @Test
    void superAdminCreatesAdminWhoCanLoginButCannotManageAccounts() throws Exception {
        String superToken = superAdminToken("it_super_a");
        long id = createAccount(superToken, "it_admin_new");

        mvc.perform(get("/api/v1/admin/accounts").header("Authorization", bearer(superToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(2))
                .andExpect(jsonPath("$.items[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$.items[1].passwordHash").doesNotExist());

        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_admin_new\",\"password\":\"admin-pass-1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.account.role").value("ADMIN"))
                .andReturn().getResponse().getContentAsString();
        String adminToken = JsonPath.read(body, "$.accessToken");

        // UC10 is Super-Admin-only: the freshly created Admin gets 403 on every UC10 endpoint
        mvc.perform(get("/api/v1/admin/accounts").header("Authorization", bearer(adminToken)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/accounts").header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"nope\",\"password\":\"admin-pass-1\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/admin/accounts/" + id).header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/accounts/" + id + "/reset-password")
                        .header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\":\"another-pass-1\"}"))
                .andExpect(status().isForbidden());
        // anonymous is rejected too
        mvc.perform(get("/api/v1/admin/accounts")).andExpect(status().isUnauthorized());
    }

    @Test
    void removedSellerEndpointsHaveNoBusinessAccess() throws Exception {
        String superToken = superAdminToken("it_super_b");
        mvc.perform(get("/api/v1/seller/reports/summary").header("Authorization", bearer(superToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/sellers").header("Authorization", bearer(login())))
                .andExpect(status().isNotFound());
    }

    @Test
    void disabledAdminCannotLoginUntilReactivated() throws Exception {
        String superToken = superAdminToken("it_super_c");
        long id = createAccount(superToken, "it_admin_toggle");

        mvc.perform(put("/api/v1/admin/accounts/" + id).header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"Renamed Admin\",\"enabled\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Renamed Admin"))
                .andExpect(jsonPath("$.enabled").value(false));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_admin_toggle\",\"password\":\"admin-pass-1\"}"))
                .andExpect(status().isUnauthorized());

        mvc.perform(put("/api/v1/admin/accounts/" + id).header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_admin_toggle\",\"password\":\"admin-pass-1\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void resetPasswordInvalidatesTheOldPassword() throws Exception {
        String superToken = superAdminToken("it_super_d");
        long id = createAccount(superToken, "it_admin_pw");

        mvc.perform(post("/api/v1/admin/accounts/" + id + "/reset-password")
                        .header("Authorization", bearer(superToken)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\":\"rotated-pass-1\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_admin_pw\",\"password\":\"admin-pass-1\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_admin_pw\",\"password\":\"rotated-pass-1\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void superAdminAccountsAreOutsideTheAdminManagementScope() throws Exception {
        String superToken = superAdminToken("it_super_e");
        long superId = accountId("it_super_e");
        mvc.perform(get("/api/v1/admin/pois").header("Authorization", bearer(superToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/access-qrs").header("Authorization", bearer(superToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/accounts").header("Authorization", bearer(superToken)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(put("/api/v1/admin/accounts/" + superId).header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"displayName\":\"not allowed\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/admin/accounts/" + superId + "/reset-password")
                        .header("Authorization", bearer(superToken)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\":\"secret-new-123\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/admin/accounts/" + superId)
                        .header("Authorization", bearer(superToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createRequestCannotCreateASuperAdmin() throws Exception {
        String superToken = superAdminToken("it_super_f1");
        String body = mvc.perform(post("/api/v1/admin/accounts").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_not_super\",\"password\":\"admin-pass-1\",\"role\":\"SUPER_ADMIN\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        assertThat(JsonPath.read(body, "$.role").toString()).isEqualTo("ADMIN");
    }

    @Test
    void createValidatesInputAndRejectsDuplicates() throws Exception {
        String superToken = superAdminToken("it_super_g");
        createAccount(superToken, "it_admin_dup");

        mvc.perform(post("/api/v1/admin/accounts").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_admin_dup\",\"password\":\"admin-pass-1\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/admin/accounts").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ab\",\"password\":\"admin-pass-1\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/admin/accounts").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"bad name\",\"password\":\"admin-pass-1\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/admin/accounts").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_admin_short\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/v1/admin/accounts/999999").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void uc10WritesAuditEventsVisibleToSuperAdmin() throws Exception {
        String superToken = superAdminToken("it_super_h");
        long id = createAccount(superToken, "it_admin_audit");
        mvc.perform(put("/api/v1/admin/accounts/" + id).header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/admin/accounts/" + id + "/reset-password")
                        .header("Authorization", bearer(superToken)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\":\"rotated-pass-1\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/admin/audit").header("Authorization", bearer(superToken))
                        .param("action", "ADMIN_CREATE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].result").value("SUCCESS"));
        mvc.perform(get("/api/v1/admin/audit").header("Authorization", bearer(superToken))
                        .param("action", "ADMIN_UPDATE").param("resourceId", String.valueOf(id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(get("/api/v1/admin/audit").header("Authorization", bearer(superToken))
                        .param("action", "ADMIN_RESET_PASSWORD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1));
        // no credential material is ever written to the audit log
        String metadata = jdbc.queryForObject(
                "select coalesce(string_agg(coalesce(detail, ''), ' '), '') from audit_log where action like 'ADMIN_%'",
                String.class);
        assertThat(metadata).doesNotContain("rotated-pass-1").doesNotContain("admin-pass-1").doesNotContain("$2a$");
    }
}
