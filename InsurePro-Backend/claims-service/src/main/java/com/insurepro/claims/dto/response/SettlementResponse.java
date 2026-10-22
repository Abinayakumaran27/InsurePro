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
public class SettlementResponse {
	private Long settlementId;
	private Long claimId;
	private BigDecimal amountApproved;
	private BigDecimal deductibleApplied;
	private String approvedBy;
	private LocalDate settlementDate;
	
	private String remarks;
	private String status;
	private LocalDateTime createdAt;
}
