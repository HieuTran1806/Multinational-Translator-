package vn.edu.thuyetminh.common.error;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Uniform error body for every non-2xx response.
 *
 * <pre>{"code":"VALIDATION_FAILED","message":"...","status":400,"path":"/api/v1/...",
 *  "timestamp":"...","fieldErrors":[{"field":"name","message":"..."}]}</pre>
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
        String code,
        String message,
        int status,
        String path,
        Instant timestamp,
        List<FieldError> fieldErrors) {

    public record FieldError(String field, String message) {
    }

    public static ApiError of(ErrorCode code, String message, String path) {
        return new ApiError(code.name(), message, code.status().value(), path, Instant.now(), List.of());
    }
}
