USE insurepro_audit;
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT,
    username VARCHAR(150), action VARCHAR(100) NOT NULL,
    resource VARCHAR(100), resource_id VARCHAR(100),
    ip_address VARCHAR(45), details TEXT, service_name VARCHAR(50),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id), INDEX idx_audit_action (action),
    INDEX idx_audit_timestamp (timestamp), INDEX idx_audit_service (service_name)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS compliance_reports (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY, report_number VARCHAR(30) NOT NULL,
    report_type VARCHAR(50) NOT NULL, scope JSON, metrics JSON,
    generated_by BIGINT, generated_at DATETIME,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_report_number (report_number)
) ENGINE=InnoDB;