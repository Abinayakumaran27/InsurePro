USE insurepro_analytics;
CREATE TABLE IF NOT EXISTS kpi_reports (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY, kpi_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50), scope JSON, period_start DATE, period_end DATE, metrics JSON,
    generated_by BIGINT, generated_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_kpi_name (kpi_name), INDEX idx_kpi_period (period_start)
) ENGINE=InnoDB;