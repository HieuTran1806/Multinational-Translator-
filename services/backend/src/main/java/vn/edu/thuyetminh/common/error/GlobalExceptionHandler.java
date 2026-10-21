package vn.edu.thuyetminh.common.error;

import java.time.Instant;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Maps every exception to the uniform {@link ApiError} body. Never leaks stack traces or secrets. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApi(ApiException ex, HttpServletRequest req) {
        return build(ex.getCode(), ex.getMessage(), req, List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleInvalid(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<ApiError.FieldError> fields = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiError.FieldError(fe.getField(), fe.getDefaultMessage()))
                .toList();
        return build(ErrorCode.VALIDATION_FAILED, "Dữ liệu không hợp lệ", req, fields);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraint(ConstraintViolationException ex, HttpServletRequest req) {
        List<ApiError.FieldError> fields = ex.getConstraintViolations().stream()
                .map(v -> new ApiError.FieldError(lastNode(v.getPropertyPath().toString()), v.getMessage()))
                .toList();
        return build(ErrorCode.VALIDATION_FAILED, "Dữ liệu không hợp lệ", req, fields);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class, MissingServletRequestPartException.class})
    public ResponseEntity<ApiError> handleBadRequest(Exception ex, HttpServletRequest req) {
        return build(ErrorCode.BAD_REQUEST, "Yêu cầu không hợp lệ", req, List.of());
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiError> handleMediaType(HttpMediaTypeNotSupportedException ex, HttpServletRequest req) {
        return build(ErrorCode.UNSUPPORTED_MEDIA, "Content-Type không được hỗ trợ", req, List.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleMethod(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
        return ResponseEntity.status(405).body(new ApiError("METHOD_NOT_ALLOWED", "Phương thức không được hỗ trợ",
                405, req.getRequestURI(), Instant.now(), List.of()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleTooLarge(MaxUploadSizeExceededException ex, HttpServletRequest req) {
        return build(ErrorCode.PAYLOAD_TOO_LARGE, "File vượt quá dung lượng cho phép", req, List.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResource(NoResourceFoundException ex, HttpServletRequest req) {
        return build(ErrorCode.NOT_FOUND, "Không tìm thấy", req, List.of());
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiError> handleOptimistic(ObjectOptimisticLockingFailureException ex, HttpServletRequest req) {
        return build(ErrorCode.CONFLICT, "Dữ liệu đã bị thay đổi bởi người khác, vui lòng tải lại", req, List.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleIntegrity(DataIntegrityViolationException ex, HttpServletRequest req) {
        log.warn("Data integrity violation on {}: {}", req.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return build(ErrorCode.CONFLICT, "Dữ liệu xung đột với ràng buộc (ví dụ: mã đã tồn tại)", req, List.of());
    }

    // Let Spring Security's entry point / access-denied handler produce 401/403
    @ExceptionHandler({AccessDeniedException.class, AuthenticationException.class})
    public void rethrowSecurity(RuntimeException ex) {
        throw ex;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest req) {
        log.error("Unhandled error on {} {}", req.getMethod(), req.getRequestURI(), ex);
        return build(ErrorCode.INTERNAL_ERROR, "Lỗi hệ thống, vui lòng thử lại sau", req, List.of());
    }

    private static ResponseEntity<ApiError> build(ErrorCode code, String message, HttpServletRequest req,
                                                  List<ApiError.FieldError> fields) {
        ApiError body = new ApiError(code.name(), message, code.status().value(), req.getRequestURI(),
                Instant.now(), fields);
        return ResponseEntity.status(code.status()).body(body);
    }

    private static String lastNode(String path) {
        int i = path.lastIndexOf('.');
        return i >= 0 ? path.substring(i + 1) : path;
    }
}
