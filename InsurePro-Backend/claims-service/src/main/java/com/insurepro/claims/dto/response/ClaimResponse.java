package com.insurepro.claims.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimResponse {
	private Long claimId;
	private String claimNumber;
	private Long policyId;
	private Long customerId;
	private LocalDate claimDate;
	private LocalDate incidentDate;
	private String claimType;
	private String description;
	private BigDecimal amountRequested;
	private String status;
	private Long assignedAdjusterId;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
