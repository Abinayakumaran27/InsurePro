package com.insurepro.audit.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="audit_logs") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="audit_id") private Long auditId;
    @Column(name="user_id") private Long userId;
    @Column(name="username", length=150) private String username;
    @Column(name="action", nullable=false, length=100) private String action;
    @Column(name="resource", length=100) private String resource;
    @Column(name="resource_id", length=100) private String resourceId;
    @Column(name="ip_address", length=45) private String ipAddress;
    @Column(name="details", columnDefinition="TEXT") private String details;
    @Column(name="service_name", length=50) private String serviceName;
    @Column(name="timestamp", nullable=false) private LocalDateTime timestamp;
    @PrePersist protected void onCreate() { if (timestamp == null) timestamp = LocalDateTime.now(); }
}
