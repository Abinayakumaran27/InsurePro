package com.insurepro.claims.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Slf4j
@Component
public class PolicyServiceClientFallback implements PolicyServiceClient {

    @Override
    public PolicyServiceClient.PolicyValidationDto validatePolicy(Long policyId) {
        log.warn("Policy service unavailable - fallback for policyId: {}", policyId);
        return new PolicyServiceClient.PolicyValidationDto(
                policyId,
                "UNKNOWN",
                false,
                "UNKNOWN",
                BigDecimal.ZERO,
                LocalDate.now(),
                LocalDate.now()
        );
    }
}