package com.insurepro.iam.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.Instant;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;
    private String timestamp;
    private String correlationId;
    private List<FieldError> fieldErrors;

    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder().success(true).data(data).message(message)
                .timestamp(Instant.now().toString()).build();
    }
    public static <T> ApiResponse<T> ok(T data) { return ok(data, "Success"); }

    public record FieldError(String field, String message) {}
}
