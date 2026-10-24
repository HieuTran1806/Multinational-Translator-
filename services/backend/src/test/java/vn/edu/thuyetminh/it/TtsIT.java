package vn.edu.thuyetminh.it;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.jayway.jsonpath.JsonPath;

import vn.edu.thuyetminh.support.AbstractIntegrationTest;
import vn.edu.thuyetminh.support.AudioFixtures;
import vn.edu.thuyetminh.tts.TtsException;
import vn.edu.thuyetminh.tts.TtsJobService;
import vn.edu.thuyetminh.tts.TtsProvider;

/** TTS flow with a FAKE provider (test double). Production code never fabricates audio. */
@Import(TtsIT.FakeTtsConfig.class)
class TtsIT extends AbstractIntegrationTest {

    enum Mode { SUCCESS, FAIL_PERMANENT, FAIL_RETRYABLE }

    static class FakeTts implements TtsProvider {
        volatile Mode mode = Mode.SUCCESS;
        final AtomicInteger calls = new AtomicInteger();
        volatile Runnable duringCall = () -> { };

        @Override
        public String name() {
            return "fake";
        }

        @Override
        public boolean isConfigured() {
            return true;
        }

        @Override
        public TtsResult synthesize(TtsRequest request) throws TtsException {
            calls.incrementAndGet();
            duringCall.run();
            return switch (mode) {
                case SUCCESS -> new TtsResult(AudioFixtures.wav(request.languageCode().startsWith("vi") ? "vi" : "en"),
                        null);
                case FAIL_PERMANENT -> throw new TtsException("GOOGLE_INVALID_ARGUMENT", "bad request", false);
                case FAIL_RETRYABLE -> throw new TtsException("GOOGLE_UNAVAILABLE", "unavailable", true);
            };
        }
    }

    @TestConfiguration
    static class FakeTtsConfig {
        @Bean
        @Primary
        FakeTts fakeTts() {
            return new FakeTts();
        }
    }

    @Autowired
    FakeTts fake;

    @Autowired
    TtsJobService jobs;

    @BeforeEach
    void reset() {
        fake.mode = Mode.SUCCESS;
        fake.calls.set(0);
        fake.duringCall = () -> { };
    }

    private String requestTts(String token, long poiId, String lang, int expectedStatus) throws Exception {
        return mvc.perform(post("/api/v1/admin/pois/" + poiId + "/translations/" + lang + "/tts")
                        .header("Authorization", bearer(token)))
                .andExpect(status().is(expectedStatus))
                .andReturn().getResponse().getContentAsString();
    }

    @Test
    void successfulJobAttachesAudioAndIdenticalRequestIsDeduplicated() throws Exception {
        String token = login();
        RequestPostProcessor visitor = visitor();
        long id = createPoiWithContent(token, "TTS-1", true);
        String job = requestTts(token, id, "en", 202);
        assertThat((String) JsonPath.read(job, "$.status")).isEqualTo("QUEUED");
        int jobId = JsonPath.read(job, "$.id");

        // a second request while queued returns the same job
        assertThat((Integer) JsonPath.read(requestTts(token, id, "en", 202), "$.id")).isEqualTo(jobId);

        assertThat(jobs.processNextDueJob()).isTrue();
        mvc.perform(get("/api/v1/admin/tts/jobs/" + jobId).header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.status").value("SUCCEEDED"))
                .andExpect(jsonPath("$.audio.source").value("TTS"));
        mvc.perform(get("/api/v1/public/pois/" + id).with(visitor).param("lang", "en"))
                .andExpect(jsonPath("$.audio.source").value("TTS"));

        // same text + language + voice -> no new provider call
        String again = requestTts(token, id, "en", 200);
        assertThat((Boolean) JsonPath.read(again, "$.reusedExisting")).isTrue();
        assertThat(fake.calls.get()).isEqualTo(1);
    }

    @Test
    void failedTtsKeepsPoiAndReportsFailure() throws Exception {
        String token = login();
        RequestPostProcessor visitor = visitor();
        long id = createPoiWithContent(token, "TTS-FAIL", true);
        fake.mode = Mode.FAIL_PERMANENT;
        int jobId = JsonPath.read(requestTts(token, id, "vi", 202), "$.id");
        jobs.processNextDueJob();

        mvc.perform(get("/api/v1/admin/tts/jobs/" + jobId).header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.errorCode").value("GOOGLE_INVALID_ARGUMENT"));
        mvc.perform(get("/api/v1/public/pois/" + id).with(visitor).param("lang", "vi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tên tiếng Việt"));
        mvc.perform(get("/api/v1/admin/pois").header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.items[0].languages[?(@.languageCode=='vi')].audio")
                        .value(org.hamcrest.Matchers.contains("FAILED")));
    }

    @Test
    void retryableErrorsAreRetriedThenFail() throws Exception {
        String token = login();
        long id = createPoiWithContent(token, "TTS-RETRY", true);
        fake.mode = Mode.FAIL_RETRYABLE;
        int jobId = JsonPath.read(requestTts(token, id, "vi", 202), "$.id");
        for (int attempt = 1; attempt <= 3; attempt++) {
            jdbc.update("UPDATE audio_generation_job SET next_attempt_at = now() WHERE id = ?", jobId);
            assertThat(jobs.processNextDueJob()).isTrue();
        }
        assertThat(jobs.processNextDueJob()).isFalse();
        assertThat(fake.calls.get()).isEqualTo(3);
        String st = jdbc.queryForObject("SELECT status FROM audio_generation_job WHERE id = ?", String.class, jobId);
        assertThat(st).isEqualTo("FAILED");
    }

    @Test
    void contentChangedDuringGenerationDiscardsResult() throws Exception {
        String token = login();
        long id = createPoiWithContent(token, "TTS-RACE", true);
        int jobId = JsonPath.read(requestTts(token, id, "en", 202), "$.id");
        fake.duringCall = () -> jdbc.update(
                "UPDATE poi_translation SET narration_text = 'changed', content_version = content_version + 1 "
                        + "WHERE poi_id = ? AND language_code = 'en'", id);
        jobs.processNextDueJob();
        mvc.perform(get("/api/v1/admin/tts/jobs/" + jobId).header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.errorCode").value("CONTENT_CHANGED"));
        // no audio may be attached to the new content version (the fixture's EN upload is on version 1)
        Integer attachedToCurrentVersion = jdbc.queryForObject(
                "SELECT count(*) FROM audio_asset a JOIN poi_translation t ON t.id = a.translation_id "
                        + "WHERE t.poi_id = ? AND t.language_code = 'en' AND a.content_version = t.content_version",
                Integer.class, id);
        assertThat(attachedToCurrentVersion).isZero();
    }

    @Test
    void interruptedRunningJobIsRequeuedOnRestart() throws Exception {
        String token = login();
        long id = createPoiWithContent(token, "TTS-CRASH", true);
        int jobId = JsonPath.read(requestTts(token, id, "vi", 202), "$.id");
        jdbc.update("UPDATE audio_generation_job SET status = 'RUNNING', attempts = 1, started_at = now() "
                + "WHERE id = ?", jobId);
        jobs.recoverOnStartup();
        String st = jdbc.queryForObject("SELECT status FROM audio_generation_job WHERE id = ?", String.class, jobId);
        assertThat(st).isEqualTo("QUEUED");
        assertThat(jobs.processNextDueJob()).isTrue();
    }

    @Test
    void textLongerThanLimitIsRejected() throws Exception {
        String token = login();
        long id = createPoiWithContent(token, "TTS-LONG", true);
        putTranslation(token, id, "vi", "Tên", "Đ".repeat(150)); // 300 bytes > test limit 200
        mvc.perform(post("/api/v1/admin/pois/" + id + "/translations/vi/tts").header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("TTS_TEXT_TOO_LONG"));
    }

    @Test
    void guestCannotRequestTts() throws Exception {
        mvc.perform(post("/api/v1/admin/pois/1/translations/vi/tts")).andExpect(status().isUnauthorized());
    }
}
