package com.insurepro.analytics.dto.response;
import com.fasterxml.jackson.annotation.JsonInclude; import lombok.*;
import java.time.Instant;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success; private T data; private String message; private String timestamp;
    public static <T> ApiResponse<T> ok(T d, String m) { return ApiResponse.<T>builder().success(true).data(d).message(m).timestamp(Instant.now().toString()).build(); }
    public static <T> ApiResponse<T> ok(T d) { return ok(d, "Success"); }
}
