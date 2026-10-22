package com.insurepro.underwriting.dto.response;
import lombok.*;
import java.math.BigDecimal; import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UnderwritingResponse {
    private Long requestId; private Long policyId; private Long customerId;
    private BigDecimal riskScore; private String status;
    private String decisionRemarks; private Long referredToUserId;
    private LocalDateTime decidedAt; private LocalDateTime createdAt;
}
