package com.insurepro.underwriting.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal; import java.time.LocalDateTime;
@Entity @Table(name="risk_rules") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RiskRule {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="rule_id") private Long ruleId;
    @Column(name="policy_type_id", nullable=false) private Long policyTypeId;
    @Column(name="rule_name", nullable=false, length=100) private String ruleName;
    @Column(name="condition_expression", nullable=false, columnDefinition="TEXT") private String conditionExpression;
    @Column(name="risk_weight", nullable=false, precision=5, scale=2) private BigDecimal riskWeight;
    @Column(name="action", nullable=false, length=20) private String action;
    @Column(name="priority", nullable=false) @Builder.Default private int priority = 1;
    @Column(name="active") @Builder.Default private boolean active = true;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
}
