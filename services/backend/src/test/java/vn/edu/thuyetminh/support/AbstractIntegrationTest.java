package vn.edu.thuyetminh.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.jayway.jsonpath.JsonPath;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

/**
 * Base class for integration tests: real Spring context + real PostgreSQL (Flyway-migrated).
 * Database: TEST_DB_URL (default jdbc:postgresql://localhost:5432/thuyetminh_test).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    protected static final String ADMIN_USER = "it_admin";
    protected static final String ADMIN_PASS = "it-password-123";

    @Autowired
    protected WebApplicationContext context;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected PasswordEncoder encoder;

    protected MockMvc mvc;

    @BeforeEach
    void setUpBase() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        jdbc.execute("TRUNCATE audio_generation_job, audio_asset, poi_translation, poi, auth_session, account "
                + "RESTART IDENTITY CASCADE");
        jdbc.update("INSERT INTO account (username, password_hash, display_name, role) VALUES (?, ?, ?, 'ADMIN')",
                ADMIN_USER, encoder.encode(ADMIN_PASS), "IT Admin");
    }

    protected String login() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + ADMIN_USER + "\",\"password\":\"" + ADMIN_PASS + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    protected static String bearer(String token) {
        return "Bearer " + token;
    }

    /** Creates a POI with vi + en content and returns its id. */
    protected long createPoiWithContent(String token, String code, boolean publish) throws Exception {
        String created = mvc.perform(post("/api/v1/admin/pois").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + code + "\",\"defaultName\":\"Điểm " + code
                                + "\",\"latitude\":11.14,\"longitude\":106.46}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(created, "$.id")).longValue();
        putTranslation(token, id, "vi", "Tên tiếng Việt", "Thuyết minh tiếng Việt");
        putTranslation(token, id, "en", "English name", "English narration");
        if (publish) {
            publishWithEnglishAudio(token, id);
        }
        return id;
    }

    /**
     * Publishing requires ready English audio for the current content version, so this uploads a valid
     * English file before calling /publish. The production readiness rule is never bypassed or mocked.
     */
    protected void publishWithEnglishAudio(String token, long poiId) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "narration-en.wav", "audio/wav",
                AudioFixtures.wav("en"));
        mvc.perform(multipart("/api/v1/admin/pois/" + poiId + "/translations/en/audio")
                        .file(file).header("Authorization", bearer(token)))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/admin/pois/" + poiId + "/publish").header("Authorization", bearer(token)))
                .andExpect(status().isOk());
    }

    protected void putTranslation(String token, long poiId, String lang, String name, String narration)
            throws Exception {
        mvc.perform(put("/api/v1/admin/pois/" + poiId + "/translations/" + lang)
                        .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"description\":\"d\",\"narrationText\":\""
                                + narration + "\"}"))
                .andExpect(status().isOk());
    }
}
