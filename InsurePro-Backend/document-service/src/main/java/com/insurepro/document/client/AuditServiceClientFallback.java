package com.insurepro.document.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuditServiceClientFallback implements AuditServiceClient {

    @Override
    public void writeAuditLog(Long userId, String username, String action,
                               String resource, String resourceId,
                               String serviceName, String details) {
        log.error("AuditServiceClient fallback — audit log dropped: action={} resource={}/{} userId={}", action, resource, resourceId, userId);
    }
}
