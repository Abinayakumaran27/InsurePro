package com.insurepro.policy.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to create a new insurance policy")
public class CreatePolicyRequest {

    @NotNull
    @Positive
    @Schema(description = "Customer ID", example = "1")
    private Long customerId;

    @NotNull
    @Positive
    @Schema(description = "Policy Type ID", example = "1")
    private Long policyTypeId;

    @NotNull
    @DecimalMin("10000.00")
    @Schema(description = "Coverage amount minimum 10000", example = "500000.00")
    private BigDecimal coverageAmount;

    @NotNull
    @Schema(description = "Policy start date", example = "2026-05-02")
    private LocalDate startDate;

    @NotNull
    @Schema(description = "Policy end date - must be after start date", example = "2027-05-02")
    private LocalDate endDate;

    @Size(max = 150)
    @Schema(description = "Nominee full name", example = "Jane Doe")
    private String nomineeName;

    @Size(max = 50)
    @Schema(description = "Nominee relation to policyholder", example = "SPOUSE")
    private String nomineeRelation;

    @Schema(description = "Agent ID (auto-set from JWT token)")
    private Long agentId;
}