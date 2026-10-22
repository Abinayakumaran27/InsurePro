package com.insurepro.notification.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EventPublisher {

    public void publishNotificationEvent(String userId, String message, String category) {
        log.info("NOTIFICATION event - userId={}, category={}, message={}",
                userId, category, message);
    }

    public void publishAuditEvent(String userId, String action, String resource,
                                   String resourceId, String details) {
        log.info("AUDIT event - userId={}, action={}, resource={}, details={}",
                userId, action, resource, details);
    }
}