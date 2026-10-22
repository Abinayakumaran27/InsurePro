package com.insurepro.document.event;

import com.insurepro.document.client.AuditServiceClient;
import com.insurepro.document.client.NotificationServiceClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EventPublisher {

    @Autowired(required = false)
    private NotificationServiceClient notifClient;

    @Autowired(required = false)
    private AuditServiceClient auditClient;

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
        try {
            if (auditClient != null) {
                auditClient.writeAuditLog(parseLong(userId), userId, action, resource, resourceId, "document-service", details);
            }
        } catch (Exception e) {
            log.warn("publishAuditEvent failed userId={} action={}: {}", userId, action, e.getMessage());
        }
    }

    private Long parseLong(String s) {
        try { return s != null ? Long.parseLong(s) : null; } catch (NumberFormatException e) { return null; }
    }
}
