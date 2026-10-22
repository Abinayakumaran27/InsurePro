package com.insurepro.underwriting.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal; import java.time.LocalDateTime;
@Entity @Table(name="underwriting_requests") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UnderwritingRequest {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="request_id") private Long requestId;
    @Column(name="policy_id", nullable=false) private Long policyId;
    @Column(name="customer_id", nullable=false) private Long customerId;
    @Column(name="policy_type_id", nullable=false) private Long policyTypeId;
    @Column(name="risk_score", precision=5, scale=2) private BigDecimal riskScore;
    @Column(name="status", nullable=false, length=30) @Enumerated(EnumType.STRING) @Builder.Default private UWStatus status = UWStatus.PENDING;
    @Column(name="referred_to_user_id") private Long referredToUserId;
    @Column(name="decision_remarks", columnDefinition="TEXT") private String decisionRemarks;
    @Column(name="decided_at") private LocalDateTime decidedAt;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") private LocalDateTime updatedAt;
    @Column(name="deleted") @Builder.Default private boolean deleted = false;
    public enum UWStatus { PENDING, IN_REVIEW, AUTO_APPROVED, AUTO_DECLINED, REFERRED, APPROVED, DECLINED }
}
