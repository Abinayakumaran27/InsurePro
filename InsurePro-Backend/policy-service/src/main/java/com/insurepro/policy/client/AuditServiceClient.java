package com.insurepro.policy.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

/** Synchronous Feign client for writing compliance audit logs to audit-compliance-service. */
@FeignClient(name = "audit-compliance-service", fallback = AuditServiceClientFallback.class)
public interface AuditServiceClient {

    @PostMapping("/api/v1/audit-logs/internal")
    void writeAuditLog(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String username,
            @RequestParam String action,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String serviceName,
            @RequestParam(required = false) String details);
}
