package com.insurepro.analytics.client;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.*;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

/**
 * Feign client for claims-service.
 *
 * The claims-service wraps every response in ApiResponse<T>:
 *   { "data": { "content": [...], "totalElements": N, ... }, "message": "OK" }
 *
 * We model this explicitly so Feign can deserialize it correctly instead of
 * trying to map the wrapper object directly into a Spring Page (which yielded 0s).
 */
@FeignClient(name="claims-service", fallback=ClaimsServiceClientFallback.class)
public interface ClaimsServiceClient {

    @CircuitBreaker(name = "claims-service")
    @Retry(name = "claims-service")
    @GetMapping("/api/v1/claims")
    ClaimsApiResponse getClaims(@RequestParam(required=false) String status,
                                @RequestParam int page,
                                @RequestParam int size);

    // ── DTOs ─────────────────────────────────────────────────────────────────

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    class ClaimSummaryDto {
        private Long claimId;
        private String status;
        private BigDecimal amountRequested;
        private String claimType;
    }

    /** Models the inner Page returned by claims-service. */
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    class ClaimsPageData {
        private List<ClaimSummaryDto> content;
        private long totalElements;
        private int totalPages;
        private int number;
        private int size;

        public List<ClaimSummaryDto> safeContent() {
            return content != null ? content : Collections.emptyList();
        }
    }

    /** Models the ApiResponse<Page<ClaimResponse>> envelope. */
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    class ClaimsApiResponse {
        private ClaimsPageData data;
        private String message;
    }
}
