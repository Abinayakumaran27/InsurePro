package com.insurepro.analytics.client;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.util.Collections;
@Slf4j @Component
public class ClaimsServiceClientFallback implements ClaimsServiceClient {
    @Override
    public ClaimsApiResponse getClaims(String status, int page, int size) {
        log.warn("Circuit breaker OPEN — claims-service unavailable, returning empty fallback");
        ClaimsPageData emptyPage = new ClaimsPageData(Collections.emptyList(), 0, 0, 0, size);
        return new ClaimsApiResponse(emptyPage, "fallback");
    }
}
