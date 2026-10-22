package com.insurepro.audit.service.impl;

import com.insurepro.audit.dto.response.AuditLogResponse;
import com.insurepro.audit.entity.AuditLog;
import com.insurepro.audit.exception.ResourceNotFoundException;
import com.insurepro.audit.repository.AuditLogRepository;
import com.insurepro.audit.service.AuditLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditRepo;

    public AuditLogServiceImpl(AuditLogRepository auditRepo) {
        this.auditRepo = auditRepo;
    }

    // ── Search ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> searchAuditLogs(
            Long userId, String action, String resource,      // ← resource added
            String serviceName, LocalDateTime from, LocalDateTime to,
            Pageable pageable) {

        // Single combined query — all filters applied together, all optional
        return auditRepo
                .findByFilters(userId, action, resource, serviceName, from, to, pageable)
                .map(this::toResponse);
    }

    // ── Get by ID ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AuditLogResponse getById(Long auditId) {
        return toResponse(
                auditRepo.findById(auditId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Audit log not found: " + auditId)));
    }

    // ── Export CSV ───────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public byte[] exportCsv(Long userId, LocalDateTime from, LocalDateTime to) {
        // resource/action/serviceName not exposed in export — pass null for each
        Page<AuditLogResponse> logs =
                searchAuditLogs(userId, null, null, null, from, to, Pageable.unpaged());

        StringBuilder sb = new StringBuilder(
                "auditId,userId,username,action,resource,resourceId,serviceName,timestamp\n");

        logs.forEach(l -> sb.append(String.format("%s,%s,%s,%s,%s,%s,%s,%s\n",
                l.getAuditId(), l.getUserId(),    l.getUsername(),
                l.getAction(),  l.getResource(),  l.getResourceId(),
                l.getServiceName(), l.getTimestamp())));

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ── Create ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuditLogResponse createAuditLog(
            Long userId, String username, String action,
            String resource, String resourceId,
            String serviceName, String details) {

        AuditLog log2 = AuditLog.builder()
                .userId(userId).username(username).action(action)
                .resource(resource).resourceId(resourceId)
                .serviceName(serviceName).details(details)
                .timestamp(LocalDateTime.now())         // ← removed redundant fully-qualified name
                .build();

        return toResponse(auditRepo.save(log2));
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

    private AuditLogResponse toResponse(AuditLog a) {
        return AuditLogResponse.builder()
                .auditId(a.getAuditId())
                .userId(a.getUserId())
                .username(a.getUsername())
                .action(a.getAction())
                .resource(a.getResource())
                .resourceId(a.getResourceId())
                .ipAddress(a.getIpAddress())
                .details(a.getDetails())
                .serviceName(a.getServiceName())
                .timestamp(a.getTimestamp())
                .build();
    }
}