package com.insurepro.analytics.service;

import com.insurepro.analytics.client.ClaimsServiceClient;
import com.insurepro.analytics.dto.response.KpiResponse;
import com.insurepro.analytics.dto.response.ReportResponse;
import com.insurepro.analytics.entity.KPIReport;
import com.insurepro.analytics.repository.KPIReportRepository;
import com.insurepro.analytics.service.impl.AnalyticsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplTest {

    @Mock
    private KPIReportRepository kpiRepo;

    @Mock
    private ClaimsServiceClient claimsClient;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    private KPIReport sampleReport;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        sampleReport = KPIReport.builder()
                .reportId(1L)
                .kpiName("TOTAL_CLAIMS")
                .scope("{\"scope\":\"ALL\"}")
                .periodStart(LocalDate.now().withDayOfMonth(1))
                .periodEnd(LocalDate.now())
                .metrics("{\"totalClaims\":5}")
                .generatedBy(1L)
                .generatedAt(LocalDateTime.now())
                .build();

        pageable = PageRequest.of(0, 10);
    }

    // ── generateReport ────────────────────────────────────────────────────────

    @Test
    void generateReport_validInput_savesAndReturnsResponse() {
        when(claimsClient.getClaims(any(), anyInt(), anyInt()))
                .thenThrow(new RuntimeException("Claims service unavailable")); // safe fallback
        when(kpiRepo.save(any(KPIReport.class))).thenReturn(sampleReport);

        ReportResponse result = analyticsService.generateReport(
                "TOTAL_CLAIMS", "MONTHLY", "ALL", 1L);

        assertThat(result).isNotNull();
        assertThat(result.getReportId()).isEqualTo(1L);
        assertThat(result.getKpiName()).isEqualTo("TOTAL_CLAIMS");
        assertThat(result.getGeneratedBy()).isEqualTo(1L);
        verify(kpiRepo).save(any(KPIReport.class));
    }

    @Test
    void generateReport_withScope_includesScopeInReport() {
        KPIReport scopedReport = KPIReport.builder()
                .reportId(2L)
                .kpiName("APPROVED_CLAIMS")
                .scope("{\"scope\":\"REGION_SOUTH\"}")
                .periodStart(LocalDate.now().withDayOfMonth(1))
                .periodEnd(LocalDate.now())
                .metrics("{\"approvedClaims\":3}")
                .generatedBy(1L)
                .generatedAt(LocalDateTime.now())
                .build();

        when(claimsClient.getClaims(any(), anyInt(), anyInt()))
                .thenThrow(new RuntimeException("Claims service unavailable"));
        when(kpiRepo.save(any(KPIReport.class))).thenReturn(scopedReport);

        ReportResponse result = analyticsService.generateReport(
                "APPROVED_CLAIMS", "WEEKLY", "REGION_SOUTH", 1L);

        assertThat(result).isNotNull();
        assertThat(result.getScope()).contains("REGION_SOUTH");
    }

    @Test
    void generateReport_nullScope_defaultsToAll() {
        when(claimsClient.getClaims(any(), anyInt(), anyInt()))
                .thenThrow(new RuntimeException("Claims unavailable"));
        when(kpiRepo.save(any(KPIReport.class))).thenReturn(sampleReport);

        ReportResponse result = analyticsService.generateReport(
                "TOTAL_CLAIMS", "MONTHLY", null, 1L);

        assertThat(result).isNotNull();
        verify(kpiRepo).save(argThat(r ->
                r.getScope() != null && r.getScope().contains("ALL")));
    }

    // ── listReports ───────────────────────────────────────────────────────────

    @Test
    void listReports_withKpiName_filtersResults() {
        Page<KPIReport> page = new PageImpl<>(List.of(sampleReport));
        when(kpiRepo.findByKpiName("TOTAL_CLAIMS", pageable)).thenReturn(page);

        Page<ReportResponse> result = analyticsService
                .listReports("TOTAL_CLAIMS", pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getKpiName()).isEqualTo("TOTAL_CLAIMS");
        verify(kpiRepo).findByKpiName("TOTAL_CLAIMS", pageable);
    }

    @Test
    void listReports_nullReportType_returnsAll() {
        Page<KPIReport> page = new PageImpl<>(List.of(sampleReport));
        when(kpiRepo.findAll(pageable)).thenReturn(page);

        Page<ReportResponse> result = analyticsService
                .listReports(null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(kpiRepo).findAll(pageable);
    }

    @Test
    void listReports_emptyKpiName_returnsAll() {
        Page<KPIReport> page = new PageImpl<>(List.of(sampleReport));
        when(kpiRepo.findAll(pageable)).thenReturn(page);

        Page<ReportResponse> result = analyticsService
                .listReports("  ", pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(kpiRepo).findAll(pageable);
    }

    // ── getKpis ───────────────────────────────────────────────────────────────

    @Test
    void getKpis_claimsServiceUnavailable_returnsZeroCounts() {
        when(claimsClient.getClaims(any(), anyInt(), anyInt()))
                .thenThrow(new RuntimeException("Service down"));

        List<KpiResponse> kpis = analyticsService.getKpis();

        assertThat(kpis).hasSize(3);
        assertThat(kpis.get(0).getKpiName()).isEqualTo("TOTAL_CLAIMS");
        assertThat(kpis.get(0).getValue()).isEqualTo("0");
        assertThat(kpis.get(1).getKpiName()).isEqualTo("APPROVED_CLAIMS");
        assertThat(kpis.get(2).getKpiName()).isEqualTo("SETTLED_CLAIMS");
    }

    @Test
    void getKpis_returnsThreeKpiEntries() {
        when(claimsClient.getClaims(any(), anyInt(), anyInt()))
                .thenThrow(new RuntimeException("Claims unavailable"));

        List<KpiResponse> kpis = analyticsService.getKpis();

        assertThat(kpis).isNotNull().hasSize(3);
        assertThat(kpis).extracting(KpiResponse::getUnit)
                .containsOnly("count");
        assertThat(kpis).extracting(KpiResponse::getCalculatedAt)
                .doesNotContainNull();
    }
}
