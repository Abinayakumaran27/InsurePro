package com.insurepro.iam.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_attempts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attempt_id") private Long attemptId;
    @Column(name = "user_id") private Long userId;
    @Column(name = "email", length = 150) private String email;
    @Column(name = "ip_address", nullable = false, length = 45) private String ipAddress;
    @Column(name = "user_agent", length = 500) private String userAgent;
    @Column(name = "success", nullable = false) private boolean success;
    @Column(name = "failure_reason", length = 100) private String failureReason;
    @Column(name = "attempted_at", nullable = false) private LocalDateTime attemptedAt;

    @PrePersist protected void onCreate() { if (attemptedAt == null) attemptedAt = LocalDateTime.now(); }
}
