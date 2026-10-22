package com.insurepro.policy.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate; import java.time.LocalDateTime;
@Entity @Table(name="policy_endorsements") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PolicyEndorsement {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="endorsement_id") private Long endorsementId;
    @Column(name="policy_id", nullable=false) private Long policyId;
    @Column(name="change_type", nullable=false, length=100) private String changeType;
    @Column(name="old_value", columnDefinition="JSON") private String oldValue;
    @Column(name="new_value", columnDefinition="JSON") private String newValue;
    @Column(name="reason", columnDefinition="TEXT") private String reason;
    @Column(name="approved_by") private Long approvedBy;
    @Column(name="effective_date", nullable=false) private LocalDate effectiveDate;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
}
