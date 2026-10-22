package com.insurepro.payment.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecordPaymentRequest {
    @NotNull @Positive private Long invoiceId;
    @NotNull @Positive private Long customerId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotBlank @Pattern(regexp="CARD|UPI|NETBANKING|CASH|CHEQUE|NEFT|RTGS") private String method;
    @Size(max=200) private String transactionId;
    @Size(max=50) private String gateway;
    @Size(max=200) private String gatewayReference;
}
