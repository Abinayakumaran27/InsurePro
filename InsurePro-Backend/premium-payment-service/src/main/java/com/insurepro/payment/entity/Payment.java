package com.insurepro.payment.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal; import java.time.LocalDate; import java.time.LocalDateTime;
@Entity @Table(name="payments") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="payment_id") private Long paymentId;
    @Column(name="invoice_id", nullable=false) private Long invoiceId;
    @Column(name="customer_id", nullable=false) private Long customerId;
    @Column(name="amount", nullable=false, precision=15, scale=2) private BigDecimal amount;
    @Column(name="payment_date") private LocalDate paymentDate;
    @Column(name="method", nullable=false, length=30) private String method;
    @Column(name="transaction_id", length=200) private String transactionId;
    @Column(name="gateway", length=50) private String gateway;
    @Column(name="gateway_reference", length=200) private String gatewayReference;
    @Column(name="status", nullable=false, length=30) @Enumerated(EnumType.STRING) @Builder.Default private PaymentStatus status = PaymentStatus.INITIATED;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") private LocalDateTime updatedAt;
    @Column(name="deleted") @Builder.Default private boolean deleted = false;
    public enum PaymentStatus { INITIATED, PROCESSING, SUCCESS, FAILED, REFUNDED }
}
