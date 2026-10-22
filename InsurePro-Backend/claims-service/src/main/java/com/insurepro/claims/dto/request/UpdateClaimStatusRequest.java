package com.insurepro.claims.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateClaimStatusRequest {
	@NotBlank
	private String status;
	@Size(max = 1000)
	private String remarks;
	private BigDecimal approvedAmount;
	private BigDecimal deductibleAmount;
}
