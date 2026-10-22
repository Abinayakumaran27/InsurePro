package com.insurepro.policy.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal; import java.time.LocalDateTime;
@Entity @Table(name="policy_types") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PolicyType {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="type_id") private Long typeId;
    @Column(name="name", nullable=false, unique=true, length=50) private String name;
    @Column(name="description", columnDefinition="TEXT") private String description;
    @Column(name="base_premium", nullable=false, precision=15, scale=2) private BigDecimal basePremium;
    @Column(name="coverage_limits", columnDefinition="JSON") private String coverageLimits;
    @Column(name="underwriting_required") @Builder.Default private boolean underwritingRequired = false;
    @Column(name="active") @Builder.Default private boolean active = true;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
}
