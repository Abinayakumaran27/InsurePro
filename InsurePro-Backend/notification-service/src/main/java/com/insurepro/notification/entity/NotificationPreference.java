package com.insurepro.notification.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
@Entity @Table(name="notification_preferences") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationPreference {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="pref_id") private Long prefId;
    @Column(name="user_id", nullable=false, unique=true) private Long userId;
    @Column(name="email_enabled") @Builder.Default private boolean emailEnabled = true;
    @Column(name="sms_enabled") @Builder.Default private boolean smsEnabled = false;
    @Column(name="in_app_enabled") @Builder.Default private boolean inAppEnabled = true;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") private LocalDateTime updatedAt;
}
