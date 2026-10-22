package com.insurepro.audit.exception;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.servlet.http.HttpServletRequest; import lombok.*;
import lombok.extern.slf4j.Slf4j; import org.slf4j.MDC;
import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler; import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.Instant; import java.util.List; import java.util.stream.Collectors;
@RestControllerAdvice @Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", ex.getMessage(), req, null);
    }
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessRuleException ex, HttpServletRequest req) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, "BUSINESS_RULE_VIOLATION", ex.getMessage(), req, null);
    }
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccess(AccessDeniedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Insufficient permissions", req, null);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<FieldErr> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> new FieldErr(fe.getField(), fe.getDefaultMessage())).collect(Collectors.toList());
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Request validation failed", req, errors);
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest req) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Unexpected error occurred", req, null);
    }
    private ResponseEntity<ErrorResponse> build(HttpStatus s, String err, String msg, HttpServletRequest req, List<FieldErr> fe) {
        return ResponseEntity.status(s).body(ErrorResponse.builder().success(false).timestamp(Instant.now().toString())
            .status(s.value()).error(err).message(msg).path(req.getRequestURI())
            .correlationId(MDC.get("correlationId")).fieldErrors(fe).build());
    }
    public record FieldErr(String field, String message) {}
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorResponse {
        private boolean success; private String timestamp; private int status;
        private String error; private String message; private String path;
        private String correlationId; private List<FieldErr> fieldErrors;
    }
}
