package com.insurepro.analytics.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDate; import java.time.LocalDateTime;
@Entity @Table(name="kpi_reports") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KPIReport {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="report_id") private Long reportId;
    @Column(name="kpi_name", nullable=false, length=100) private String kpiName;
    @Column(name="report_type", length=50) private String reportType;
    @Column(name="scope", columnDefinition="JSON") private String scope;
    @Column(name="period_start") private LocalDate periodStart;
    @Column(name="period_end") private LocalDate periodEnd;
    @Column(name="metrics", columnDefinition="JSON") private String metrics;
    @Column(name="generated_by") private Long generatedBy;
    @Column(name="generated_at") private LocalDateTime generatedAt;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
}
