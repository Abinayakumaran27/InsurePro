package com.insurepro.underwriting.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InitiateUnderwritingRequest {
    @NotNull @Positive private Long policyId;
    @NotNull @Positive private Long customerId;
    @NotNull @Positive private Long policyTypeId;
    @Min(18) @Max(100) private int customerAge;
    private boolean hasExistingClaims;
    private boolean smoker;
    private String healthConditions;
    private java.math.BigDecimal coverageAmount;
}
