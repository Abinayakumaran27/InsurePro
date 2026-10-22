package com.insurepro.payment.dto.response;
import lombok.*;
import java.math.BigDecimal; import java.time.LocalDate; import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvoiceResponse {
    private Long invoiceId; private String invoiceNumber; private Long policyId; private Long customerId;
    private BigDecimal amount; private BigDecimal taxAmount; private BigDecimal totalAmount;
    private LocalDate dueDate; private String status; private LocalDate periodStart; private LocalDate periodEnd;
    private LocalDateTime createdAt;
}
