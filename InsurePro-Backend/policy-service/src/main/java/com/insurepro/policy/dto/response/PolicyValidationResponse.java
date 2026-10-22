package com.insurepro.policy.dto.response;
import lombok.*;
import java.math.BigDecimal; import java.time.LocalDate;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PolicyValidationResponse {
    private Long policyId; private String policyNumber; private boolean active;
    private String policyType; private BigDecimal coverageAmount;
    private LocalDate startDate; private LocalDate endDate;
}
