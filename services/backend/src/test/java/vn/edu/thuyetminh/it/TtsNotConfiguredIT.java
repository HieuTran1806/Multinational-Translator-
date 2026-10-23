package vn.edu.thuyetminh.it;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import vn.edu.thuyetminh.support.AbstractIntegrationTest;
import vn.edu.thuyetminh.support.AudioFixtures;

/** Without Google credentials (provider "none") the app runs and the upload/playback demo flow works. */
class TtsNotConfiguredIT extends AbstractIntegrationTest {

    @Test
    void ttsReportsNotConfiguredButUploadFlowWorks() throws Exception {
        String token = login();
        RequestPostProcessor visitor = visitor();
        mvc.perform(get("/api/v1/admin/tts/status").header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.configured").value(false));

        long id = createPoiWithContent(token, "NO-GCP", true);
        mvc.perform(post("/api/v1/admin/pois/" + id + "/translations/vi/tts").header("Authorization", bearer(token)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("TTS_NOT_CONFIGURED"));

        mvc.perform(multipart("/api/v1/admin/pois/" + id + "/translations/vi/audio")
                        .file(new MockMultipartFile("file", "vi.wav", "audio/wav", AudioFixtures.wav("vi")))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/public/pois/" + id).with(visitor).param("lang", "vi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.audio.source").value("UPLOAD"));
    }
}
