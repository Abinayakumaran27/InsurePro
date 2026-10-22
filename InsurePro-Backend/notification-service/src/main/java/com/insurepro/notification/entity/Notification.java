package com.insurepro.notification.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
@Entity @Table(name="notifications") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="notification_id") private Long notificationId;
    @Column(name="user_id", nullable=false) private Long userId;
    @Column(name="message", nullable=false, columnDefinition="TEXT") private String message;
    @Column(name="category", nullable=false, length=50) @Builder.Default private String category = "SYSTEM";
    @Column(name="channel", nullable=false, length=20) @Builder.Default private String channel = "IN_APP";
    @Column(name="status", nullable=false, length=30) @Enumerated(EnumType.STRING) @Builder.Default private NotificationStatus status = NotificationStatus.PENDING;
    @Column(name="read_at") private LocalDateTime readAt;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") private LocalDateTime updatedAt;
    @Column(name="deleted") @Builder.Default private boolean deleted = false;
    public enum NotificationStatus { PENDING, SENT, READ, FAILED }
}
