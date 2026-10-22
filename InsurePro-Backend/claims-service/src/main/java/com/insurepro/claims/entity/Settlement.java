package com.insurepro.claims.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal; import java.time.LocalDate; import java.time.LocalDateTime;
@Entity
@Table(name="settlements")
@Getter
@Setter 
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Settlement {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY) 
    @Column(name="settlement_id") 
    private Long settlementId;
    @Column(name="claim_id", nullable=false) 
    private Long claimId;
    @Column(name="amount_approved", nullable=false, precision=15, scale=2)
    private BigDecimal amountApproved;
    @Column(name="deductible_applied", precision=15, scale=2) 
    @Builder.Default
    private BigDecimal deductibleApplied = java.math.BigDecimal.ZERO;
    @Column(name="approved_by", length=150) 
    private String approvedBy;
    @Column(name="settlement_date") 
    private LocalDate settlementDate;
    @Column(name = "payment_mode", length = 20)
    private String paymentMode;
    @Column(name="remarks", columnDefinition="TEXT")
    private String remarks;
    @Column(name="status", nullable=false, length=20)
    @Enumerated(EnumType.STRING)
    @Builder.Default 
    private SettlementStatus status = SettlementStatus.PENDING;
    @CreationTimestamp @Column(name="created_at", updatable=false) 
    private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") 
    private LocalDateTime updatedAt;
 // Fixed — add SETTLED
    public enum SettlementStatus { PENDING, APPROVED, PROCESSING, PAID, FAILED, SETTLED }
}