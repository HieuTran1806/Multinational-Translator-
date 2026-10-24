package vn.edu.thuyetminh.common.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * All application-specific settings, bound from the {@code app.*} namespace.
 * Secrets are supplied through environment variables; see {@code .env.example}.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @DefaultValue Cors cors,
        @DefaultValue Auth auth,
        @DefaultValue Bootstrap bootstrapAdmin,
        @DefaultValue Storage storage,
        @DefaultValue Upload upload,
        @DefaultValue Tts tts,
        @DefaultValue Access access) {

    public record Cors(@DefaultValue List<String> allowedOrigins) {
    }

    /** UC02 access QR: package used when none is given, and the User-app URL encoded into each QR. */
    public record Access(
            @DefaultValue("DEMO_24H") String defaultPackage,
            @DefaultValue("http://localhost:5174/activate") String activationUrl) {
    }

    public record Auth(@DefaultValue("8h") Duration sessionTtl) {
    }

    /** One-time creation of the first administrator. Disabled unless explicitly enabled. */
    public record Bootstrap(
            @DefaultValue("false") boolean enabled,
            @DefaultValue("") String username,
            @DefaultValue("") String password) {
    }

    public record Storage(@DefaultValue("./data/media") String localRoot) {
    }

    public record Upload(
            @DefaultValue("20971520") long maxAudioBytes,
            @DefaultValue("5242880") long maxImageBytes) {
    }

    public record Tts(
            /** none | google */
            @DefaultValue("none") String provider,
            @DefaultValue("4500") int maxInputBytes,
            @DefaultValue("30s") Duration requestTimeout,
            @DefaultValue("3") int maxAttempts,
            @DefaultValue("true") boolean workerEnabled,
            @DefaultValue("10m") Duration staleRunningAfter) {
    }
}
