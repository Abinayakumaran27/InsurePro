package com.insurepro.analytics.repository;
import com.insurepro.analytics.entity.KPIReport;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface KPIReportRepository extends JpaRepository<KPIReport, Long> {
    Page<KPIReport> findByReportType(String reportType, Pageable pageable);
    Page<KPIReport> findByKpiName(String kpiName, Pageable pageable);
}
