package com.insurepro.claims.dto.request;
import jakarta.validation.constraints.*; 
import lombok.*;
import java.math.BigDecimal; 
import java.time.LocalDate;
@Getter 
@Setter 
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitClaimRequest {
    @NotNull
    @Positive
    private Long policyId;
    @NotNull
    @PastOrPresent
    private LocalDate incidentDate;
    @NotBlank 
    @Pattern(regexp="MEDICAL|ACCIDENT|THEFT|PROPERTY_DAMAGE|DEATH|TRAVEL")
    private String claimType;
    @NotBlank
    @Size(min=20, max=2000) 
    private String description;
    @NotNull
    @DecimalMin("100.00") 
    @Digits(integer=13, fraction=2)
    private BigDecimal amountRequested;
}
