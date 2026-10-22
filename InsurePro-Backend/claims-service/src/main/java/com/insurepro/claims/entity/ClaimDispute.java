package com.insurepro.claims.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity 
@Table(name="claim_disputes")
@Getter
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class ClaimDispute {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="dispute_id")
    private Long disputeId;
    @Column(name="claim_id", nullable=false) 
    private Long claimId;
    @Column(name="raised_by_user_id", nullable=false) 
    private Long raisedByUserId;
    @Column(name="reason", columnDefinition="TEXT")
    private String reason;
    @Column(name="status", nullable=false, length=30) 
    @Enumerated(EnumType.STRING) 
    @Builder.Default
    private DisputeStatus status = DisputeStatus.OPEN;
    @Column(name="resolution_notes", columnDefinition="TEXT") 
    private String resolutionNotes;
    @Column(name="resolved_by")
    private Long resolvedBy;
    @Column(name="resolved_at")
    private LocalDateTime resolvedAt;
    @CreationTimestamp 
    @Column(name="created_at", updatable=false)
    private LocalDateTime createdAt;
    public enum DisputeStatus { OPEN, UNDER_REVIEW, RESOLVED, ESCALATED }
}