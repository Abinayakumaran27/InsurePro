package com.insurepro.analytics.service;
import com.insurepro.analytics.dto.response.KpiResponse; import com.insurepro.analytics.dto.response.ReportResponse;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import java.util.List;
public interface AnalyticsService {
    List<KpiResponse> getKpis();
    Page<ReportResponse> listReports(String reportType, Pageable pageable);
    ReportResponse generateReport(String kpiName, String reportType, String scope, Long generatedBy);
}
