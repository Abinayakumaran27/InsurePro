package com.insurepro.payment.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal; import java.time.LocalDate;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GenerateInvoiceRequest {
    @NotNull @Positive private Long policyId;
    @NotNull @Positive private Long customerId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotNull @FutureOrPresent private LocalDate dueDate;
    private LocalDate periodStart; private LocalDate periodEnd;
    @DecimalMin("0") private BigDecimal taxAmount;
}
