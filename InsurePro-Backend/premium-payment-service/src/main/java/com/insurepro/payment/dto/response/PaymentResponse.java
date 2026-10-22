package com.insurepro.payment.dto.response;
import lombok.*;
import java.math.BigDecimal; import java.time.LocalDate; import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentResponse {
    private Long paymentId; private Long invoiceId; private Long customerId;
    private BigDecimal amount; private LocalDate paymentDate; private String method;
    private String transactionId; private String gateway; private String status;
    private LocalDateTime createdAt;
}
