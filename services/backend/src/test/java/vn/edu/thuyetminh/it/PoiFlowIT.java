package vn.edu.thuyetminh.it;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import com.jayway.jsonpath.JsonPath;

import vn.edu.thuyetminh.support.AbstractIntegrationTest;
import vn.edu.thuyetminh.support.AudioFixtures;

class PoiFlowIT extends AbstractIntegrationTest {

    private String uploadAudio(String token, long poiId, String lang) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "narration-" + lang + ".wav", "audio/wav",
                AudioFixtures.wav(lang));
        String body = mvc.perform(multipart("/api/v1/admin/pois/" + poiId + "/translations/" + lang + "/audio")
                        .file(file).header("Authorization", bearer(token)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.format").value("wav"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.sha256");
    }

    @Test
    void draftPoiIsInvisibleToGuestsInListAndByDirectUrl() throws Exception {
        String token = login();
        long published = createPoiWithContent(token, "PUB-1", true);
        long draft = createPoiWithContent(token, "DRAFT-1", false);
        uploadAudio(token, draft, "vi");
        String draftAudioId = JsonPath.read(mvc.perform(get("/api/v1/admin/pois/" + draft)
                        .header("Authorization", bearer(token))).andReturn().getResponse().getContentAsString(),
                "$.translations[1].currentAudio.id").toString();

        mvc.perform(get("/api/v1/public/pois"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].id").value(published))
                .andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(get("/api/v1/public/pois/" + draft)).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mvc.perform(get("/api/v1/public/pois/" + draft + "/offline-manifest")).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/public/audio/" + draftAudioId)).andExpect(status().isNotFound());

        // unpublishing hides a previously public POI
        mvc.perform(post("/api/v1/admin/pois/" + published + "/unpublish").header("Authorization", bearer(token)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DRAFT"));
        mvc.perform(get("/api/v1/public/pois/" + published)).andExpect(status().isNotFound());
    }

    @Test
    void englishSelectionReturnsEnglishContentAndEnglishAudio() throws Exception {
        String token = login();
        long id = createPoiWithContent(token, "BEN-DUOC", true);
        String viSha = uploadAudio(token, id, "vi");
        String enSha = uploadAudio(token, id, "en");
        assertThat(viSha).isNotEqualTo(enSha);

        String body = mvc.perform(get("/api/v1/public/pois/" + id).param("lang", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.language").value("en"))
                .andExpect(jsonPath("$.fallback").value(false))
                .andExpect(jsonPath("$.name").value("English name"))
                .andExpect(jsonPath("$.narrationText").value("English narration"))
                .andExpect(jsonPath("$.audio.sha256").value(enSha))
                .andReturn().getResponse().getContentAsString();
        String url = JsonPath.read(body, "$.audio.url");
        assertThat(url).startsWith("/api/v1/public/audio/"); // relative, no host stored

        byte[] served = mvc.perform(get(url)).andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "audio/wav"))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(served).isEqualTo(AudioFixtures.wav("en"));

        mvc.perform(get("/api/v1/public/pois/" + id).param("lang", "vi"))
                .andExpect(jsonPath("$.language").value("vi"))
                .andExpect(jsonPath("$.audio.sha256").value(viSha));
    }

    @Test
    void updatingNarrationInvalidatesOldAudio() throws Exception {
        String token = login();
        long id = createPoiWithContent(token, "EDIT-1", true);
        uploadAudio(token, id, "en");
        String before = mvc.perform(get("/api/v1/public/pois/" + id).param("lang", "en"))
                .andReturn().getResponse().getContentAsString();
        String oldUrl = JsonPath.read(before, "$.audio.url");
        mvc.perform(get(oldUrl)).andExpect(status().isOk());

        // name/description-only change keeps the audio
        putTranslation(token, id, "en", "Renamed", "English narration");
        mvc.perform(get("/api/v1/public/pois/" + id).param("lang", "en"))
                .andExpect(jsonPath("$.audio.url").value(oldUrl));

        // narration change -> old audio no longer served anywhere
        putTranslation(token, id, "en", "Renamed", "A completely new English narration");
        mvc.perform(get("/api/v1/public/pois/" + id).param("lang", "en"))
                .andExpect(jsonPath("$.contentVersion").value(2))
                .andExpect(jsonPath("$.audio").value(nullValue()));
        mvc.perform(get(oldUrl)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/public/pois/" + id + "/offline-manifest"))
                .andExpect(jsonPath("$.translations[?(@.languageCode=='en')].audio").value(
                        org.hamcrest.Matchers.contains(nullValue())));
        Integer stale = jdbc.queryForObject("SELECT count(*) FROM audio_asset WHERE status = 'STALE'", Integer.class);
        assertThat(stale).isEqualTo(1);
    }

    @Test
    void offlineManifestListsAllLanguagesWithChecksums() throws Exception {
        String token = login();
        long id = createPoiWithContent(token, "OFF-1", true);
        String viSha = uploadAudio(token, id, "vi");
        String m1 = mvc.perform(get("/api/v1/public/pois/" + id + "/offline-manifest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.translations", hasSize(2)))
                .andExpect(jsonPath("$.translations[?(@.languageCode=='vi')].audio.sha256")
                        .value(org.hamcrest.Matchers.contains(viSha)))
                .andReturn().getResponse().getContentAsString();
        String v1 = JsonPath.read(m1, "$.manifestVersion");
        uploadAudio(token, id, "en");
        String v2 = JsonPath.read(mvc.perform(get("/api/v1/public/pois/" + id + "/offline-manifest"))
                .andReturn().getResponse().getContentAsString(), "$.manifestVersion");
        assertThat(v2).isNotEqualTo(v1);
    }

    @Test
    void validationAndUploadRules() throws Exception {
        String token = login();
        mvc.perform(post("/api/v1/admin/pois").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"bad code\",\"defaultName\":\"\",\"latitude\":95,\"longitude\":200}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors", hasSize(4)));

        long id = createPoiWithContent(token, "UP-1", false);
        MockMultipartFile fake = new MockMultipartFile("file", "x.mp3", "audio/mpeg",
                "<html>not audio</html>".getBytes());
        mvc.perform(multipart("/api/v1/admin/pois/" + id + "/translations/vi/audio").file(fake)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA"));

        mvc.perform(get("/api/v1/admin/pois/999999").header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/admin/pois").param("size", "1000").header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cannotPublishWithoutContentAndDuplicateCodeConflicts() throws Exception {
        String token = login();
        String created = mvc.perform(post("/api/v1/admin/pois").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"EMPTY-1\",\"defaultName\":\"x\",\"latitude\":1,\"longitude\":1}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(created, "$.id");
        mvc.perform(post("/api/v1/admin/pois/" + id + "/publish").header("Authorization", bearer(token)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PUBLISH_NOT_READY"));
        mvc.perform(post("/api/v1/admin/pois").header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"EMPTY-1\",\"defaultName\":\"y\",\"latitude\":1,\"longitude\":1}"))
                .andExpect(status().isConflict());
    }

    @Test
    void adminListIsPaginated() throws Exception {
        String token = login();
        for (int i = 0; i < 5; i++) {
            createPoiWithContent(token, "PAGE-" + i, i % 2 == 0);
        }
        mvc.perform(get("/api/v1/admin/pois").param("page", "1").param("size", "2")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.totalItems").value(5))
                .andExpect(jsonPath("$.totalPages").value(3));
        mvc.perform(get("/api/v1/admin/pois").param("status", "PUBLISHED").header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.totalItems").value(3));
    }
}
