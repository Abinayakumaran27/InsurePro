package com.insurepro.iam.event;

import com.insurepro.iam.client.NotificationServiceClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EventPublisher {

    @Autowired(required = false)
    private NotificationServiceClient notifClient;

    public void publishNotificationEvent(String userId, String message, String category) {
        try {
            Long uid = parseLong(userId);
            if (uid != null && notifClient != null) {
                notifClient.createNotification(uid, message, category);
            }
        } catch (Exception e) {
            log.warn("publishNotificationEvent failed userId={}: {}", userId, e.getMessage());
        }
    }

    public void publishAuditEvent(String userId, String action, String resource,
                                   String resourceId, String details) {
        // iam-service writes audit logs directly via AuditServiceClient in AuthServiceImpl
        log.debug("AUDIT event - userId={} action={} resource={}/{}", userId, action, resource, resourceId);
    }

    private Long parseLong(String s) {
        try { return s != null ? Long.parseLong(s) : null; } catch (NumberFormatException e) { return null; }
    }
}
