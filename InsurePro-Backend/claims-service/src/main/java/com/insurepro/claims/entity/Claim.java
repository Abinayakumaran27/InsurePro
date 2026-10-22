package com.insurepro.claims.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal; import java.time.LocalDate; import java.time.LocalDateTime;
@Entity
@Table(name="claims")
@Getter 
@Setter 
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Claim {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="claim_id") 
    private Long claimId;
    @Column(name="claim_number", nullable=false, unique=true, length=30)
    private String claimNumber;
    @Column(name="policy_id", nullable=false)
    private Long policyId;
    @Column(name="customer_id", nullable=false)
    private Long customerId;
    @Column(name="claim_date", nullable=false) 
    private LocalDate claimDate;
    @Column(name="incident_date", nullable=false) 
    private LocalDate incidentDate;
    @Column(name="claim_type", nullable=false, length=50) 
    @Enumerated(EnumType.STRING)
    private ClaimType claimType;
    @Column(name="description", columnDefinition="TEXT")
    private String description;
    @Column(name="amount_requested", nullable=false, precision=15, scale=2)
    private BigDecimal amountRequested;
    @Column(name="status", nullable=false, length=30)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ClaimStatus status = ClaimStatus.SUBMITTED;
    @Column(name="assigned_adjuster_id")
    private Long assignedAdjusterId;
    @Column(name="document_path", length=500) 
    private String documentPath;
    @CreationTimestamp @Column(name="created_at", updatable=false) 
    private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") 
    private LocalDateTime updatedAt;
    @Column(name="created_by", length=100)
    private String createdBy;
    @Column(name="modified_by", length=100) 
    private String modifiedBy;
    @Column(name="deleted")
    @Builder.Default 
    private boolean deleted = false;
    public enum ClaimType { MEDICAL, ACCIDENT, THEFT, PROPERTY_DAMAGE, DEATH, TRAVEL }
    public enum ClaimStatus { SUBMITTED, UNDER_REVIEW, PENDING_DOCS, APPROVED, PARTIALLY_APPROVED, REJECTED, SETTLED, DISPUTED, CLOSED }
}