package com.insurepro.policy.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal; import java.time.LocalDate; import java.time.LocalDateTime;
@Entity @Table(name="policies") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Policy {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="policy_id") private Long policyId;
    @Column(name="policy_number", nullable=false, unique=true, length=30) private String policyNumber;
    @Column(name="customer_id", nullable=false) private Long customerId;
    @Column(name="agent_id") private Long agentId;
    @Column(name="policy_type_id", nullable=false) private Long policyTypeId;
    @Column(name="coverage_amount", nullable=false, precision=15, scale=2) private BigDecimal coverageAmount;
    @Column(name="premium_amount", nullable=false, precision=15, scale=2) private BigDecimal premiumAmount;
    @Column(name="start_date", nullable=false) private LocalDate startDate;
    @Column(name="end_date", nullable=false) private LocalDate endDate;
    @Column(name="status", nullable=false, length=30) @Enumerated(EnumType.STRING) @Builder.Default private PolicyStatus status = PolicyStatus.DRAFT;
    @Column(name="terms_and_conditions", columnDefinition="TEXT") private String termsAndConditions;
    @Column(name="nominee_name", length=150) private String nomineeName;
    @Column(name="nominee_relation", length=50) private String nomineeRelation;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") private LocalDateTime updatedAt;
    @Column(name="created_by", length=100) private String createdBy;
    @Column(name="modified_by", length=100) private String modifiedBy;
    @Column(name="deleted") @Builder.Default private boolean deleted = false;
    public enum PolicyStatus { DRAFT, PENDING_UNDERWRITING, ACTIVE, EXPIRED, CANCELLED, LAPSED, SUSPENDED }
    public boolean isActive() { return status == PolicyStatus.ACTIVE && LocalDate.now().isBefore(endDate.plusDays(1)); }
}
