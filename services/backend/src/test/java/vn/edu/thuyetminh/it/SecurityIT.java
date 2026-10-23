package vn.edu.thuyetminh.it;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.jayway.jsonpath.JsonPath;

import vn.edu.thuyetminh.support.AbstractIntegrationTest;

class SecurityIT extends AbstractIntegrationTest {

    @Test
    void guestCannotCallAdminApi() throws Exception {
        mvc.perform(get("/api/v1/admin/pois"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        mvc.perform(post("/api/v1/admin/pois").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"X1\",\"defaultName\":\"x\",\"latitude\":1,\"longitude\":1}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/admin/pois/1/translations/vi").contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/pois").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void superAdminCannotManagePoiContent() throws Exception {
        String superUser = "it_super";
        String superPass = "it-super-password-123";
        jdbc.update("INSERT INTO account (username, password_hash, display_name, role) VALUES (?, ?, ?, 'SUPER_ADMIN')",
                superUser, encoder.encode(superPass), "IT Super Admin");

        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + superUser + "\",\"password\":\"" + superPass + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String superToken = JsonPath.read(body, "$.accessToken");

        // The account itself works; only POI/content management is off limits (UC07 actor = ADMIN, UC10 = Super Admin).
        mvc.perform(get("/api/v1/auth/me").header("Authorization", bearer(superToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("SUPER_ADMIN"));
        mvc.perform(get("/api/v1/admin/pois").header("Authorization", bearer(superToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mvc.perform(post("/api/v1/admin/pois").header("Authorization", bearer(superToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"SUPER1\",\"defaultName\":\"x\",\"latitude\":1,\"longitude\":1}"))
                .andExpect(status().isForbidden());

        // An ADMIN token still works.
        mvc.perform(get("/api/v1/admin/pois").header("Authorization", bearer(login())))
                .andExpect(status().isOk());
    }

    @Test
    void wrongPasswordIsRejectedWithUniformError() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + ADMIN_USER + "\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void loginValidationReturnsFieldErrors() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void loginMeLogoutRevokesToken() throws Exception {
        String token = login();
        mvc.perform(get("/api/v1/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(ADMIN_USER))
                .andExpect(jsonPath("$.role").value("ADMIN"));
        mvc.perform(post("/api/v1/auth/logout").header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/pois").header("Authorization", bearer(token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void expiredSessionIsRejected() throws Exception {
        String token = login();
        jdbc.update("UPDATE auth_session SET expires_at = now() - interval '1 minute'");
        mvc.perform(get("/api/v1/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void passwordIsStoredAsBcryptHash() {
        String hash = jdbc.queryForObject("SELECT password_hash FROM account WHERE username = ?", String.class,
                ADMIN_USER);
        org.assertj.core.api.Assertions.assertThat(hash).startsWith("$2").doesNotContain(ADMIN_PASS);
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
