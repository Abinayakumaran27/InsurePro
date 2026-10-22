package com.insurepro.claims.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.*;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.math.BigDecimal;
import java.time.LocalDate;

@FeignClient(name = "policy-service", fallback = PolicyServiceClientFallback.class)
public interface PolicyServiceClient {
	@CircuitBreaker(name = "policy-service")
	@Retry(name = "policy-service")
	@GetMapping("/api/v1/policies/{policyId}/validate")
	PolicyValidationDto validatePolicy(@PathVariable Long policyId);

	@Getter
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	class PolicyValidationDto {
		private Long policyId;
		private String policyNumber;
		private boolean active;
		private String policyType;
		private BigDecimal coverageAmount;
		private LocalDate startDate;
		private LocalDate endDate;
	}
}
