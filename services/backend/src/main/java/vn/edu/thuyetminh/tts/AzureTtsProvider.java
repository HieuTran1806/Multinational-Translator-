package vn.edu.thuyetminh.tts;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Azure AI Speech text-to-speech via the REST API (no SDK dependency).
 * <p>Auth: subscription key ({@code APP_TTS_AZURE_KEY}) + region ({@code APP_TTS_AZURE_REGION}).
 * The key is sent only in the {@code Ocp-Apim-Subscription-Key} header and is never logged.
 * <p>Azure requires a voice name. The language's {@code default_tts_voice} is used when it is an Azure
 * neural voice (name ends with "Neural"); otherwise a built-in default for the language is chosen, so
 * the same {@code language} rows also work with the Google provider.
 * <p>A single attempt is bounded by {@code app.tts.request-timeout}; retries are handled by the job queue.
 */
public class AzureTtsProvider implements TtsProvider {

    private static final Logger log = LoggerFactory.getLogger(AzureTtsProvider.class);

    /** Default neural voice per locale (exact match first, then by primary language subtag). */
    static final Map<String, String> DEFAULT_VOICES = Map.ofEntries(
            Map.entry("vi-VN", "vi-VN-HoaiMyNeural"),
            Map.entry("en-US", "en-US-JennyNeural"),
            Map.entry("en-GB", "en-GB-SoniaNeural"),
            Map.entry("zh-CN", "zh-CN-XiaoxiaoNeural"),
            Map.entry("th-TH", "th-TH-PremwadeeNeural"),
            Map.entry("ja-JP", "ja-JP-NanamiNeural"),
            Map.entry("ko-KR", "ko-KR-SunHiNeural"),
            Map.entry("fr-FR", "fr-FR-DeniseNeural"));

    private static final Map<String, String> DEFAULT_BY_PRIMARY = Map.of(
            "vi", "vi-VN-HoaiMyNeural",
            "en", "en-US-JennyNeural",
            "zh", "zh-CN-XiaoxiaoNeural",
            "cmn", "zh-CN-XiaoxiaoNeural",
            "th", "th-TH-PremwadeeNeural",
            "ja", "ja-JP-NanamiNeural",
            "ko", "ko-KR-SunHiNeural",
            "fr", "fr-FR-DeniseNeural");

    /** HTTP seam (lets unit tests run without opening sockets). */
    interface Transport {
        Response send(HttpRequest request) throws IOException, InterruptedException;
    }

    record Response(int status, byte[] body) {
    }

    /** Default transport: one lazily created JDK HttpClient. */
    static final class JdkTransport implements Transport {
        private volatile HttpClient client;

        @Override
        public Response send(HttpRequest request) throws IOException, InterruptedException {
            HttpClient c = client;
            if (c == null) {
                synchronized (this) {
                    if (client == null) {
                        client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
                    }
                    c = client;
                }
            }
            HttpResponse<byte[]> r = c.send(request, HttpResponse.BodyHandlers.ofByteArray());
            return new Response(r.statusCode(), r.body());
        }
    }

    private final String key;
    private final URI endpoint;
    private final String outputFormat;
    private final Duration timeout;
    private final Transport http;

    public AzureTtsProvider(String key, String region, String endpoint, String outputFormat, Duration timeout) {
        this(key, resolveEndpoint(region, endpoint), outputFormat, timeout, new JdkTransport());
    }

    AzureTtsProvider(String key, URI endpoint, String outputFormat, Duration timeout, Transport http) {
        this.key = key == null ? "" : key.trim();
        this.endpoint = endpoint;
        this.outputFormat = outputFormat == null || outputFormat.isBlank()
                ? "audio-24khz-48kbitrate-mono-mp3" : outputFormat.trim();
        this.timeout = timeout;
        this.http = http;
        if (isConfigured()) {
            log.info("Azure TTS configured (endpoint host: {})", endpoint.getHost());
        } else {
            log.warn("Azure TTS selected but APP_TTS_AZURE_KEY / APP_TTS_AZURE_REGION are missing; "
                    + "TTS requests will return TTS_NOT_CONFIGURED");
        }
    }

    static URI resolveEndpoint(String region, String endpoint) {
        if (endpoint != null && !endpoint.isBlank()) {
            return URI.create(endpoint.trim());
        }
        if (region == null || region.isBlank()) {
            return null;
        }
        String r = region.trim().toLowerCase(Locale.ROOT);
        if (!r.matches("[a-z0-9]+")) {
            throw new IllegalStateException("APP_TTS_AZURE_REGION không hợp lệ (vd: southeastasia, eastus)");
        }
        return URI.create("https://" + r + ".tts.speech.microsoft.com/cognitiveservices/v1");
    }

    @Override
    public String name() {
        return "azure";
    }

    @Override
    public boolean isConfigured() {
        return !key.isEmpty() && endpoint != null;
    }

    @Override
    public TtsResult synthesize(TtsRequest req) throws TtsException {
        if (!isConfigured()) {
            throw new TtsException("TTS_NOT_CONFIGURED", "Azure TTS chưa được cấu hình", false);
        }
        String locale = normalizeLocale(req.languageCode());
        String voice = chooseVoice(locale, req.voiceName());
        if (voice == null) {
            throw new TtsException("AZURE_NO_VOICE",
                    "Chưa có giọng Azure mặc định cho ngôn ngữ " + locale
                            + "; hãy đặt default_tts_voice (tên giọng kết thúc bằng 'Neural')", false);
        }
        HttpRequest request = HttpRequest.newBuilder(endpoint)
                .timeout(timeout)
                .header("Ocp-Apim-Subscription-Key", key)
                .header("Content-Type", "application/ssml+xml; charset=utf-8")
                .header("X-Microsoft-OutputFormat", outputFormat)
                .header("User-Agent", "thuyetminh-backend")
                .POST(HttpRequest.BodyPublishers.ofString(ssml(locale, voice, req.text()), StandardCharsets.UTF_8))
                .build();
        Response resp;
        try {
            resp = http.send(request);
        } catch (HttpTimeoutException e) {
            throw new TtsException("TTS_TIMEOUT", "Azure TTS quá thời gian chờ", true);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TtsException("TTS_INTERRUPTED", "Tác vụ TTS bị gián đoạn", true);
        } catch (IOException e) {
            throw new TtsException("AZURE_NETWORK", "Không kết nối được Azure TTS", true, e);
        }
        int status = resp.status();
        if (status == 200) {
            byte[] audio = resp.body();
            if (audio == null || audio.length == 0) {
                throw new TtsException("TTS_EMPTY_AUDIO", "Azure TTS trả về audio rỗng", true);
            }
            return new TtsResult(audio, voice);
        }
        throw mapStatus(status);
    }

    static TtsException mapStatus(int status) {
        return switch (status) {
            case 400 -> new TtsException("AZURE_BAD_REQUEST", "Azure TTS từ chối yêu cầu (SSML/giọng không hợp lệ)",
                    false);
            case 401, 403 -> new TtsException("AZURE_UNAUTHORIZED",
                    "Azure TTS từ chối xác thực: kiểm tra APP_TTS_AZURE_KEY và APP_TTS_AZURE_REGION", false);
            case 404 -> new TtsException("AZURE_NOT_FOUND", "Sai endpoint/region Azure TTS", false);
            case 408, 429 -> new TtsException("AZURE_THROTTLED",
                    "Azure TTS đang giới hạn tần suất / hết hạn mức (HTTP " + status + ")", true);
            default -> status >= 500
                    ? new TtsException("AZURE_UNAVAILABLE", "Azure TTS lỗi máy chủ (HTTP " + status + ")", true)
                    : new TtsException("AZURE_HTTP_" + status, "Azure TTS lỗi HTTP " + status, false);
        };
    }

    /** Google uses "cmn-CN" for Mandarin; Azure uses "zh-CN". */
    static String normalizeLocale(String code) {
        if (code == null || code.isBlank()) {
            return "vi-VN";
        }
        String c = code.trim();
        if (c.equalsIgnoreCase("cmn-CN") || c.equalsIgnoreCase("zh")) {
            return "zh-CN";
        }
        return c;
    }

    static String chooseVoice(String locale, String configured) {
        if (configured != null && configured.trim().endsWith("Neural")) {
            return configured.trim();
        }
        String v = DEFAULT_VOICES.get(locale);
        if (v != null) {
            return v;
        }
        String primary = locale.split("-", 2)[0].toLowerCase(Locale.ROOT);
        return DEFAULT_BY_PRIMARY.get(primary);
    }

    static String ssml(String locale, String voice, String text) {
        return "<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xml:lang=\""
                + escapeXml(locale) + "\"><voice name=\"" + escapeXml(voice) + "\">" + escapeXml(text)
                + "</voice></speak>";
    }

    static String escapeXml(String s) {
        StringBuilder sb = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            switch (ch) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&apos;");
                default -> {
                    // Drop control chars that are illegal in XML 1.0 (keep tab/newline/CR).
                    if (ch >= 0x20 || ch == '\t' || ch == '\n' || ch == '\r') {
                        sb.append(ch);
                    }
                }
            }
        }
        return sb.toString();
    }
}
