package com.insurepro.claims.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity
@Table(name="claim_notes")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor
@Builder
public class ClaimNote {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="note_id") 
    private Long noteId;
    @Column(name="claim_id", nullable=false)
    private Long claimId;
    @Column(name="author_user_id", nullable=false)
    private Long authorUserId;
    @Column(name="note_text", nullable=false, columnDefinition="TEXT") 
    private String noteText;
    @Column(name="is_internal", nullable=false)
    @Builder.Default 
    private boolean internal = false;
    @CreationTimestamp @Column(name="created_at", updatable=false) 
    private LocalDateTime createdAt;
}
