package com.insurepro.analytics.controller;

import com.insurepro.analytics.dto.response.*;
import com.insurepro.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics & Reports",
     description = "KPI dashboards, report generation and business analytics")
@PreAuthorize("hasAnyRole('ADMIN','COMPLIANCE','FINANCE')")
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    // ── Get KPI Dashboard ────────────────────────────────────────────────────

    @GetMapping("/kpis")
    @Operation(summary = "Get KPI dashboard",
               description = "Returns all KPI metrics for the analytics dashboard.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<KpiResponse>>> kpis() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getKpis()));
    }

    // ── List Reports ─────────────────────────────────────────────────────────

    @GetMapping("/reports")
    @Operation(summary = "List reports",
               description = "Returns paginated list of generated reports. " +
                             "Filter by report type.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<ReportResponse>>> reports(
            @Parameter(description = "Filter by report type: MONTHLY, QUARTERLY, ANNUAL")
            @RequestParam(required = false) String reportType,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort direction: asc or desc")
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by("generatedAt").ascending()
                : Sort.by("generatedAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(ApiResponse.ok(
                analyticsService.listReports(reportType, pageable)));
    }

    // ── Generate Report ──────────────────────────────────────────────────────

    @PostMapping("/reports")
    @Operation(summary = "Generate report",
               description = "Generates a new KPI report. " +
                             "Available KPI names: TOTAL_CLAIMS, APPROVED_CLAIMS, " +
                             "SETTLED_CLAIMS, PREMIUM_COLLECTION, CLAIM_RATIO.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ReportResponse>> generate(
            @Parameter(description = "KPI name: TOTAL_CLAIMS, APPROVED_CLAIMS, " +
                                     "SETTLED_CLAIMS, PREMIUM_COLLECTION, CLAIM_RATIO")
            @RequestParam String kpiName,
            @Parameter(description = "Report type: MONTHLY, QUARTERLY, ANNUAL")
            @RequestParam(defaultValue = "MONTHLY") String reportType,
            @Parameter(description = "Report scope e.g. ALL, HEALTH, LIFE")
            @RequestParam(required = false) String scope,
            @AuthenticationPrincipal Long userId) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        analyticsService.generateReport(
                                kpiName, reportType, scope, userId),
                        "Report generated successfully"));
    }
}