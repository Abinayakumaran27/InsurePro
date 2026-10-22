package com.insurepro.payment.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal; import java.time.LocalDate; import java.time.LocalDateTime;
@Entity @Table(name="invoices") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invoice {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="invoice_id") private Long invoiceId;
    @Column(name="invoice_number", nullable=false, unique=true, length=30) private String invoiceNumber;
    @Column(name="policy_id", nullable=false) private Long policyId;
    @Column(name="customer_id", nullable=false) private Long customerId;
    @Column(name="amount", nullable=false, precision=15, scale=2) private BigDecimal amount;
    @Column(name="tax_amount", nullable=false, precision=15, scale=2) @Builder.Default private BigDecimal taxAmount = BigDecimal.ZERO;
    @Column(name="due_date", nullable=false) private LocalDate dueDate;
    @Column(name="status", nullable=false, length=30) @Enumerated(EnumType.STRING) @Builder.Default private InvoiceStatus status = InvoiceStatus.ISSUED;
    @Column(name="period_start") private LocalDate periodStart;
    @Column(name="period_end") private LocalDate periodEnd;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") private LocalDateTime updatedAt;
    @Column(name="created_by") private String createdBy;
    @Column(name="deleted") @Builder.Default private boolean deleted = false;
    public enum InvoiceStatus { ISSUED, PENDING, PAID, OVERDUE, CANCELLED }
}
