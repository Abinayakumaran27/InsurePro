package com.insurepro.claims.dto.request;
import jakarta.validation.constraints.*;
import lombok.*; 
import java.math.BigDecimal;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor 
@Builder
public class SettlementRequest {
	@NotNull 
	@DecimalMin("0.00") 
	private BigDecimal amountApproved; 
	private BigDecimal deductibleAmount;
	@Size(max=1000) 
	private String remarks; }
