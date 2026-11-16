package vn.edu.thuyetminh.tts;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpRequest;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Flow;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;

/** Azure provider with a fake transport (never calls the real Azure service, opens no sockets). */
class AzureTtsProviderTest {

    private static final URI ENDPOINT =
            URI.create("https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1");

    private final AtomicReference<HttpRequest> captured = new AtomicReference<>();

    private AzureTtsProvider provider(int status, byte[] response) {
        return new AzureTtsProvider("secret-key", ENDPOINT, null, Duration.ofSeconds(5), req -> {
            captured.set(req);
            return new AzureTtsProvider.Response(status, response);
        });
    }

    private static String bodyOf(HttpRequest req) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        CompletableFuture<Void> done = new CompletableFuture<>();
        req.bodyPublisher().orElseThrow().subscribe(new Flow.Subscriber<ByteBuffer>() {
            @Override
            public void onSubscribe(Flow.Subscription s) {
                s.request(Long.MAX_VALUE);
            }

            @Override
            public void onNext(ByteBuffer b) {
                byte[] bytes = new byte[b.remaining()];
                b.get(bytes);
                out.writeBytes(bytes);
            }

            @Override
            public void onError(Throwable t) {
                done.completeExceptionally(t);
            }

            @Override
            public void onComplete() {
                done.complete(null);
            }
        });
        done.get(5, TimeUnit.SECONDS);
        return out.toString(StandardCharsets.UTF_8);
    }

    @Test
    void synthesizesWithDefaultVoiceAndEscapedSsml() throws Exception {
        AzureTtsProvider p = provider(200, new byte[] {1, 2, 3});
        var result = p.synthesize(new TtsProvider.TtsRequest("Chùa <Một> Cột & \"tháp\"", "vi-VN", null));

        assertThat(result.audio()).containsExactly(1, 2, 3);
        assertThat(result.voiceUsed()).isEqualTo("vi-VN-HoaiMyNeural");
        HttpRequest req = captured.get();
        assertThat(req.uri()).isEqualTo(ENDPOINT);
        assertThat(req.method()).isEqualTo("POST");
        assertThat(req.headers().firstValue("Ocp-Apim-Subscription-Key")).contains("secret-key");
        assertThat(req.headers().firstValue("X-Microsoft-OutputFormat")).contains("audio-24khz-48kbitrate-mono-mp3");
        assertThat(bodyOf(req))
                .contains("xml:lang=\"vi-VN\"")
                .contains("<voice name=\"vi-VN-HoaiMyNeural\">")
                .contains("Chùa &lt;Một&gt; Cột &amp; &quot;tháp&quot;");
    }

    @Test
    void mandarinCodeIsNormalizedForAzure() throws Exception {
        AzureTtsProvider p = provider(200, new byte[] {9});
        var result = p.synthesize(new TtsProvider.TtsRequest("你好", "cmn-CN", null));
        assertThat(result.voiceUsed()).isEqualTo("zh-CN-XiaoxiaoNeural");
        assertThat(bodyOf(captured.get())).contains("xml:lang=\"zh-CN\"").contains("你好");
    }

    @Test
    void supportsAllFiveTargetLanguages() {
        assertThat(AzureTtsProvider.chooseVoice("vi-VN", null)).isEqualTo("vi-VN-HoaiMyNeural");
        assertThat(AzureTtsProvider.chooseVoice("en-US", null)).isEqualTo("en-US-JennyNeural");
        assertThat(AzureTtsProvider.chooseVoice("zh-CN", null)).isEqualTo("zh-CN-XiaoxiaoNeural");
        assertThat(AzureTtsProvider.chooseVoice("th-TH", null)).isEqualTo("th-TH-PremwadeeNeural");
        assertThat(AzureTtsProvider.chooseVoice("ja-JP", null)).isEqualTo("ja-JP-NanamiNeural");
    }

    @Test
    void usesConfiguredAzureVoiceButIgnoresGoogleVoiceNames() {
        assertThat(AzureTtsProvider.chooseVoice("vi-VN", "vi-VN-NamMinhNeural")).isEqualTo("vi-VN-NamMinhNeural");
        assertThat(AzureTtsProvider.chooseVoice("vi-VN", "vi-VN-Standard-A")).isEqualTo("vi-VN-HoaiMyNeural");
    }

    @Test
    void mapsHttpErrorsToRetryableOrPermanent() {
        AzureTtsProvider p = provider(401, new byte[0]);
        assertThatThrownBy(() -> p.synthesize(new TtsProvider.TtsRequest("x", "en-US", null)))
                .isInstanceOfSatisfying(TtsException.class, e -> {
                    assertThat(e.getCode()).isEqualTo("AZURE_UNAUTHORIZED");
                    assertThat(e.isRetryable()).isFalse();
                    assertThat(e.getMessage()).doesNotContain("secret-key");
                });
        assertThat(AzureTtsProvider.mapStatus(429).isRetryable()).isTrue();
        assertThat(AzureTtsProvider.mapStatus(503).isRetryable()).isTrue();
        assertThat(AzureTtsProvider.mapStatus(400).isRetryable()).isFalse();
    }

    @Test
    void emptyAudioIsRetryable() {
        AzureTtsProvider p = provider(200, new byte[0]);
        assertThatThrownBy(() -> p.synthesize(new TtsProvider.TtsRequest("x", "ja-JP", null)))
                .isInstanceOfSatisfying(TtsException.class, e -> assertThat(e.isRetryable()).isTrue());
    }

    @Test
    void notConfiguredWithoutKeyOrRegion() {
        assertThat(new AzureTtsProvider("", "southeastasia", "", null, Duration.ofSeconds(5)).isConfigured())
                .isFalse();
        assertThat(new AzureTtsProvider("k", "", "", null, Duration.ofSeconds(5)).isConfigured()).isFalse();
        assertThat(AzureTtsProvider.resolveEndpoint("SoutheastAsia", ""))
                .hasToString("https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1");
        assertThatThrownBy(() -> AzureTtsProvider.resolveEndpoint("evil.com/x", ""))
                .isInstanceOf(IllegalStateException.class);
    }
}
