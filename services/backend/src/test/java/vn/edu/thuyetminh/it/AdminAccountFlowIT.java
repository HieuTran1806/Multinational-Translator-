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

    private long createAccount(String superToken, String username, String role) throws Exception {
        String body = mvc.perform(post("/api/v1/admin/accounts").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"admin-pass-1\","
                                + "\"displayName\":\"New " + username + "\",\"role\":\"" + role + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    @Test
    void superAdminCreatesAdminWhoCanLoginButCannotManageAccounts() throws Exception {
        String superToken = superAdminToken("it_super_a");
        long id = createAccount(superToken, "it_admin_new", "ADMIN");

        mvc.perform(get("/api/v1/admin/accounts").header("Authorization", bearer(superToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(3))
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
    void sellerCannotReachAccountManagementAndSellerAccountsStayInUc09() throws Exception {
        String superToken = superAdminToken("it_super_b");
        String body = mvc.perform(post("/api/v1/admin/sellers").header("Authorization", bearer(login()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_seller_x\",\"password\":\"seller-pass-1\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long sellerId = ((Number) JsonPath.read(body, "$.id")).longValue();

        String sellerLogin = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_seller_x\",\"password\":\"seller-pass-1\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        mvc.perform(get("/api/v1/admin/accounts")
                        .header("Authorization", bearer(JsonPath.read(sellerLogin, "$.accessToken"))))
                .andExpect(status().isForbidden());

        // a Seller id is not a manageable admin account
        mvc.perform(put("/api/v1/admin/accounts/" + sellerId).header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}"))
                .andExpect(status().isNotFound());
        // and a Seller role cannot be created through UC10
        mvc.perform(post("/api/v1/admin/accounts").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_seller_y\",\"password\":\"seller-pass-1\",\"role\":\"SELLER\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void disabledAdminCannotLoginUntilReactivated() throws Exception {
        String superToken = superAdminToken("it_super_c");
        long id = createAccount(superToken, "it_admin_toggle", "ADMIN");

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
        long id = createAccount(superToken, "it_admin_pw", "ADMIN");

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
    void superAdminCannotDisableItselfOrChangeItsOwnRole() throws Exception {
        String superToken = superAdminToken("it_super_e");
        long selfId = accountId("it_super_e");

        mvc.perform(put("/api/v1/admin/accounts/" + selfId).header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/admin/accounts/" + selfId).header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());
        // the account is untouched
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_super_e\",\"password\":\"it-super-password-123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.account.role").value("SUPER_ADMIN"));
    }

    @Test
    void lastActiveSuperAdminCannotBeDisabledOrDemoted() throws Exception {
        String firstToken = superAdminToken("it_super_f1");
        long secondId = createAccount(firstToken, "it_super_f2", "SUPER_ADMIN");
        String secondToken = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"it_super_f2\",\"password\":\"admin-pass-1\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        // disable the first one so exactly one active Super Admin (it_super_f2) remains
        long firstId = accountId("it_super_f1");
        mvc.perform(put("/api/v1/admin/accounts/" + firstId)
                        .header("Authorization", bearer(JsonPath.read(secondToken, "$.accessToken")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}"))
                .andExpect(status().isOk());

        // the remaining active Super Admin cannot demote itself (self guard) …
        String token2 = JsonPath.read(secondToken, "$.accessToken");
        mvc.perform(put("/api/v1/admin/accounts/" + secondId).header("Authorization", bearer(token2))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());
        // … and nobody else can demote or disable it either, because it is the last active one
        String freshToken = superAdminToken("it_super_f3");
        mvc.perform(put("/api/v1/admin/accounts/" + secondId).header("Authorization", bearer(freshToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk()); // a third Super Admin now exists, so this is allowed
        assertThat(jdbc.queryForObject("select role from account where id = ?", String.class, secondId))
                .isEqualTo("ADMIN");
    }

    @Test
    void createValidatesInputAndRejectsDuplicates() throws Exception {
        String superToken = superAdminToken("it_super_g");
        createAccount(superToken, "it_admin_dup", "ADMIN");

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
        long id = createAccount(superToken, "it_admin_audit", "ADMIN");
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
