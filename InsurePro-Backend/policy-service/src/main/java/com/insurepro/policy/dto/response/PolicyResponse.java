package com.insurepro.policy.dto.response;
import lombok.*;
import java.math.BigDecimal; import java.time.LocalDate; import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PolicyResponse {
    private Long policyId; private String policyNumber; private Long customerId; private Long agentId;
    private Long policyTypeId; private String policyTypeName; private BigDecimal coverageAmount;
    private BigDecimal premiumAmount; private LocalDate startDate; private LocalDate endDate;
    private String status; private String nomineeName; private String nomineeRelation;
    private LocalDateTime createdAt; private LocalDateTime updatedAt;
}
