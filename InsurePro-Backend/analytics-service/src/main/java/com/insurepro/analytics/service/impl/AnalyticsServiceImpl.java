package com.insurepro.analytics.service.impl;

import com.insurepro.analytics.client.AuditServiceClient;
import com.insurepro.analytics.client.ClaimsServiceClient;
import com.insurepro.analytics.client.ClaimsServiceClient.ClaimsPageData;
import com.insurepro.analytics.dto.response.KpiResponse;
import com.insurepro.analytics.dto.response.ReportResponse;
import com.insurepro.analytics.entity.KPIReport;
import com.insurepro.analytics.repository.KPIReportRepository;
import com.insurepro.analytics.service.AnalyticsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final KPIReportRepository kpiRepo;
    private final ClaimsServiceClient claimsClient;
    private final AuditServiceClient auditClient;

    public AnalyticsServiceImpl(KPIReportRepository kpiRepo,
                                 ClaimsServiceClient claimsClient,
                                 Optional<AuditServiceClient> auditClient) {
        this.kpiRepo      = kpiRepo;
        this.claimsClient = claimsClient;
        this.auditClient  = auditClient.orElse(null);
    }

    // ── Get KPIs ─────────────────────────────────────────────────────────────

    @Override
    public List<KpiResponse> getKpis() {
        long[] counts = fetchClaimsCounts();
        long totalClaims    = counts[0];
        long approvedClaims = counts[1];
        long settledClaims  = counts[2];
        long rejectedClaims = counts[3];
        long pendingClaims  = counts[4];

        double approvalRate = totalClaims > 0
                ? (double) approvedClaims / totalClaims * 100 : 0.0;
        double settlementRate = totalClaims > 0
                ? (double) settledClaims / totalClaims * 100 : 0.0;

        LocalDateTime now = LocalDateTime.now();

        return List.of(
                KpiResponse.builder()
                        .kpiName("TOTAL_CLAIMS")
                        .value(String.valueOf(totalClaims))
                        .unit("count").trend("stable")
                        .calculatedAt(now).build(),
                KpiResponse.builder()
                        .kpiName("APPROVED_CLAIMS")
                        .value(String.valueOf(approvedClaims))
                        .unit("count").trend("up")
                        .calculatedAt(now).build(),
                KpiResponse.builder()
                        .kpiName("SETTLED_CLAIMS")
                        .value(String.valueOf(settledClaims))
                        .unit("count").trend("stable")
                        .calculatedAt(now).build(),
                KpiResponse.builder()
                        .kpiName("REJECTED_CLAIMS")
                        .value(String.valueOf(rejectedClaims))
                        .unit("count").trend("stable")
                        .calculatedAt(now).build(),
                KpiResponse.builder()
                        .kpiName("PENDING_CLAIMS")
                        .value(String.valueOf(pendingClaims))
                        .unit("count").trend("stable")
                        .calculatedAt(now).build(),
                KpiResponse.builder()
                        .kpiName("APPROVAL_RATE")
                        .value(String.format("%.1f", approvalRate))
                        .unit("%").trend(approvalRate >= 70 ? "up" : "down")
                        .calculatedAt(now).build(),
                KpiResponse.builder()
                        .kpiName("SETTLEMENT_RATE")
                        .value(String.format("%.1f", settlementRate))
                        .unit("%").trend(settlementRate >= 50 ? "up" : "down")
                        .calculatedAt(now).build()
        );
    }

    // ── Generate Report ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public ReportResponse generateReport(String kpiName,
                                          String reportType,
                                          String scope,
                                          Long generatedBy) {
        log.info("Generating report: kpiName={}, type={}, scope={}",
                kpiName, reportType, scope);

        // Build metrics JSON
        String metrics = buildMetrics(kpiName);

        // Build scope JSON
        String scopeJson = scope != null
                ? "{\"scope\":\"" + scope + "\"}"
                : "{\"scope\":\"ALL\"}";

        KPIReport report = KPIReport.builder()
                .kpiName(kpiName)
                .scope(scopeJson)
                .periodStart(LocalDate.now().withDayOfMonth(1))
                .periodEnd(LocalDate.now())
                .metrics(metrics)
                .generatedBy(generatedBy)
                .generatedAt(LocalDateTime.now())
                .build();

        report = kpiRepo.save(report);

        log.info("Report generated: id={}", report.getReportId());

        try {
            if (auditClient != null) {
                auditClient.writeAuditLog(
                        generatedBy, null, "GENERATE_REPORT",
                        "KPIReport", String.valueOf(report.getReportId()),
                        "analytics-service",
                        "kpiName=" + kpiName + " reportType=" + reportType);
            }
        } catch (Exception e) {
            log.warn("Audit log failed for report {}: {}", report.getReportId(), e.getMessage());
        }

        return toResponse(report);
    }

    // ── List Reports ─────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<ReportResponse> listReports(String reportType,
                                             Pageable pageable) {
        if (reportType != null && !reportType.isBlank()) {
            return kpiRepo.findByKpiName(reportType, pageable)
                    .map(this::toResponse);
        }
        return kpiRepo.findAll(pageable).map(this::toResponse);
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    /** Returns [totalClaims, approvedClaims, settledClaims, rejectedClaims, pendingClaims]. */
    private long[] fetchClaimsCounts() {
        try {
            var response  = claimsClient.getClaims(null, 0, 1000);
            ClaimsPageData page = (response != null) ? response.getData() : null;
            if (page == null) return new long[]{0, 0, 0, 0, 0};

            long total    = page.getTotalElements();
            var  content  = page.safeContent();
            long approved = content.stream().filter(c -> "APPROVED".equals(c.getStatus())).count();
            long settled  = content.stream().filter(c -> "SETTLED".equals(c.getStatus())).count();
            long rejected = content.stream().filter(c -> "REJECTED".equals(c.getStatus())).count();
            long pending  = content.stream()
                    .filter(c -> "SUBMITTED".equals(c.getStatus())
                              || "UNDER_REVIEW".equals(c.getStatus())
                              || "PENDING_DOCS".equals(c.getStatus()))
                    .count();
            return new long[]{total, approved, settled, rejected, pending};
        } catch (Exception e) {
            log.warn("Could not fetch claims from claims-service: {}", e.getMessage());
            return new long[]{0, 0, 0, 0, 0};
        }
    }

    private String buildMetrics(String kpiName) {
        long[] counts       = fetchClaimsCounts();
        long totalClaims    = counts[0];
        long approvedClaims = counts[1];
        long settledClaims  = counts[2];
        long rejectedClaims = counts[3];
        long pendingClaims  = counts[4];

        return switch (kpiName) {
            case "TOTAL_CLAIMS" ->
                    "{\"totalClaims\":" + totalClaims
                    + ",\"approved\":" + approvedClaims
                    + ",\"settled\":" + settledClaims
                    + ",\"rejected\":" + rejectedClaims
                    + ",\"pending\":" + pendingClaims + "}";
            case "APPROVED_CLAIMS" -> {
                double rate = totalClaims > 0
                        ? (double) approvedClaims / totalClaims * 100 : 0.0;
                yield "{\"approvedClaims\":" + approvedClaims
                      + ",\"totalClaims\":" + totalClaims
                      + ",\"approvalRate\":\"" + String.format("%.1f", rate) + "%\"}";
            }
            case "SETTLED_CLAIMS" -> {
                double rate = totalClaims > 0
                        ? (double) settledClaims / totalClaims * 100 : 0.0;
                yield "{\"settledClaims\":" + settledClaims
                      + ",\"totalClaims\":" + totalClaims
                      + ",\"settlementRate\":\"" + String.format("%.1f", rate) + "%\"}";
            }
            case "CLAIM_RATIO" -> {
                double approvalRatio = totalClaims > 0
                        ? (double) approvedClaims / totalClaims * 100 : 0.0;
                double settlementRatio = totalClaims > 0
                        ? (double) settledClaims / totalClaims * 100 : 0.0;
                yield "{\"claimRatio\":" + String.format("%.2f", approvalRatio)
                        + ",\"settlementRatio\":" + String.format("%.2f", settlementRatio)
                        + ",\"unit\":\"percentage\"}";
            }
            case "PREMIUM_COLLECTION" ->
                    "{\"premiumCollection\":0,\"currency\":\"INR\","
                    + "\"note\":\"Premium payment integration pending\"}";
            default ->
                    "{\"kpiName\":\"" + kpiName + "\","
                    + "\"totalClaims\":" + totalClaims + "}";
        };
    }

    private ReportResponse toResponse(KPIReport r) {
        return ReportResponse.builder()
                .reportId(r.getReportId())
                .kpiName(r.getKpiName())
                .scope(r.getScope())
                .periodStart(r.getPeriodStart())
                .periodEnd(r.getPeriodEnd())
                .metrics(r.getMetrics())
                .generatedBy(r.getGeneratedBy())
                .generatedAt(r.getGeneratedAt())
                .build();
    }
}