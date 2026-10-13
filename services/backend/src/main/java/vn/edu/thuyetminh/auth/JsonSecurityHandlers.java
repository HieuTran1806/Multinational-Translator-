package vn.edu.thuyetminh.auth;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;

import vn.edu.thuyetminh.common.error.ErrorCode;

/** Writes the uniform error body for 401/403 raised inside the security filter chain. */
final class JsonSecurityHandlers {

    private JsonSecurityHandlers() {
    }

    static void write(HttpServletResponse response, ErrorCode code, String message, String path) throws IOException {
        response.setStatus(code.status().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        // Only fixed, server-controlled strings plus the escaped request path are written here.
        String body = "{\"code\":\"" + code.name() + "\",\"message\":\"" + escape(message)
                + "\",\"status\":" + code.status().value() + ",\"path\":\"" + escape(path)
                + "\",\"timestamp\":\"" + Instant.now() + "\"}";
        response.getWriter().write(body);
    }

    private static String escape(String s) {
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }
}
