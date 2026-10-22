package com.insurepro.audit.service;

import com.insurepro.audit.dto.response.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AuditLogService {

    Page<AuditLogResponse> searchAuditLogs(
            Long userId, String action, String resource,   // ← resource added here
            String serviceName, LocalDateTime from, LocalDateTime to,
            Pageable pageable);

    AuditLogResponse getById(Long auditId);

    byte[] exportCsv(Long userId, LocalDateTime from, LocalDateTime to);

    AuditLogResponse createAuditLog(Long userId, String username, String action,
                                    String resource, String resourceId,
                                    String serviceName, String details);
}