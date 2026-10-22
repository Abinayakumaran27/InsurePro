package com.insurepro.audit.controller;

import com.insurepro.audit.dto.response.*;
import com.insurepro.audit.service.AuditLogService;
import org.springframework.http.HttpStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/audit-logs")
@Tag(name = "Audit Logs",
        description = "Immutable audit log search, retrieval and CSV export")
@PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE')")
@Slf4j
public class AuditController {

    private final AuditLogService auditService;

    public AuditController(AuditLogService auditService) {
        this.auditService = auditService;
    }

    // ── Search Audit Logs ────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Search audit logs",
            description = "Search immutable audit logs by user, action, " +
                    "resource, service or date range. Admin and Compliance only.",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> search(
            @Parameter(description = "Filter by user ID")
            @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter by action e.g. POLICY_CREATED, CLAIM_SUBMITTED")
            @RequestParam(required = false) String action,
            @Parameter(description = "Filter by resource e.g. policies, claims, payments") // ← added
            @RequestParam(required = false) String resource,                                // ← added
            @Parameter(description = "Filter by service name e.g. policy-service")
            @RequestParam(required = false) String serviceName,
            @Parameter(description = "From date-time (ISO format: 2026-05-01T00:00:00)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "To date-time (ISO format: 2026-05-31T23:59:59)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "50") int size,
            @Parameter(description = "Sort direction: asc or desc")
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by("timestamp").ascending()
                : Sort.by("timestamp").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(ApiResponse.ok(
                auditService.searchAuditLogs(
                        userId, action, resource, serviceName, from, to, pageable))); // ← resource added
    }

    // ── Get Audit Log by ID ──────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get audit log by ID",
            description = "Returns a specific audit log entry by ID.",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<AuditLogResponse>> get(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(auditService.getById(id)));
    }

    // ── Internal write endpoint (service-to-service, no JWT required) ────────

    @PostMapping("/internal")
    @PreAuthorize("permitAll()")
    @Operation(hidden = true)
    public ResponseEntity<AuditLogResponse> createInternal(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String username,
            @RequestParam String action,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String serviceName,
            @RequestParam(required = false) String details) {
        AuditLogResponse saved = auditService.createAuditLog(
                userId, username, action, resource, resourceId, serviceName, details);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ── Export Audit Logs as CSV ─────────────────────────────────────────────

    @GetMapping("/export")
    @Operation(summary = "Export audit logs as CSV",
            description = "Downloads audit logs as CSV file. " +
                    "Filter by user and date range.",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<byte[]> export(
            @Parameter(description = "Filter by user ID")
            @RequestParam(required = false) Long userId,
            @Parameter(description = "From date-time")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "To date-time")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        byte[] csv = auditService.exportCsv(userId, from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=audit-logs.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}