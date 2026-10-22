package com.insurepro.claims.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuditServiceClientFallback implements AuditServiceClient {

    @Override
    public void writeAuditLog(Long userId, String username, String action,
                               String resource, String resourceId,
                               String serviceName, String details) {
        log.error("AUDIT FALLBACK — failed to write synchronous audit log: " +
                  "action={} resource={}/{} userId={}", action, resource, resourceId, userId);
    }
}
