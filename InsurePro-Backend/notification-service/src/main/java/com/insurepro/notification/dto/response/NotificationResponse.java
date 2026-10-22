package com.insurepro.notification.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationResponse {
    private Long notificationId; private Long userId; private String message;
    private String category; private String channel; private String status;
    private LocalDateTime readAt; private LocalDateTime createdAt;
}
