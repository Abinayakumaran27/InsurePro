USE insurepro_customer;
CREATE TABLE IF NOT EXISTS customers (
    customer_id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT,
    full_name VARCHAR(150) NOT NULL, date_of_birth DATE NOT NULL,
    gender VARCHAR(10), national_id VARCHAR(50) NOT NULL, email VARCHAR(150) NOT NULL,
    phone VARCHAR(20), address JSON,
kyc_status ENUM('PENDING','IN_PROGRESS','VERIFIED','REJECTED','EXPIRED') NOT NULL DEFAULT 'PENDING',
    occupation VARCHAR(100), annual_income DECIMAL(15,2), risk_category VARCHAR(20) DEFAULT 'LOW',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), modified_by VARCHAR(100), deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE KEY uk_customer_national_id (national_id), UNIQUE KEY uk_customer_email (email),
    INDEX idx_customer_kyc (kyc_status)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS kyc_records (
    kyc_id BIGINT AUTO_INCREMENT PRIMARY KEY, customer_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL, document_number VARCHAR(100) NOT NULL,
    document_url VARCHAR(500), verification_provider VARCHAR(100), verification_ref VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', verified_at DATETIME, expires_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kyc_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    INDEX idx_kyc_customer (customer_id), INDEX idx_kyc_status (status)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS agent_customer_mappings (
    mapping_id BIGINT AUTO_INCREMENT PRIMARY KEY, agent_user_id BIGINT NOT NULL, customer_id BIGINT NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uk_acm (agent_user_id, customer_id),
    CONSTRAINT fk_acm_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
) ENGINE=InnoDB;