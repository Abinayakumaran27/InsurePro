USE insurepro_policy;
CREATE TABLE IF NOT EXISTS policy_types (
    type_id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL,
    description TEXT, base_premium DECIMAL(15,2) NOT NULL,
    coverage_limits JSON, underwriting_required BOOLEAN NOT NULL DEFAULT FALSE, active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_policy_type_name (name)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS policies (
    policy_id BIGINT AUTO_INCREMENT PRIMARY KEY, policy_number VARCHAR(30) NOT NULL,
    customer_id BIGINT NOT NULL, agent_id BIGINT, policy_type_id BIGINT NOT NULL,
    coverage_amount DECIMAL(15,2) NOT NULL, premium_amount DECIMAL(15,2) NOT NULL,
    start_date DATE NOT NULL, end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', terms_and_conditions TEXT,
    nominee_name VARCHAR(150), nominee_relation VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), modified_by VARCHAR(100), deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE KEY uk_policy_number (policy_number),
    INDEX idx_policy_customer (customer_id), INDEX idx_policy_status (status), INDEX idx_policy_end_date (end_date),
    CONSTRAINT fk_policy_type FOREIGN KEY (policy_type_id) REFERENCES policy_types(type_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS policy_endorsements (
    endorsement_id BIGINT AUTO_INCREMENT PRIMARY KEY, policy_id BIGINT NOT NULL,
    change_type VARCHAR(100) NOT NULL, old_value JSON, new_value JSON, reason TEXT,
    approved_by BIGINT, effective_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_endorsement_policy FOREIGN KEY (policy_id) REFERENCES policies(policy_id)
) ENGINE=InnoDB;
INSERT IGNORE INTO policy_types (name, description, base_premium, underwriting_required) VALUES
    ('LIFE','Life insurance',5000.00,TRUE),('HEALTH','Health insurance',3000.00,FALSE),
    ('MOTOR','Motor insurance',2000.00,FALSE),('PROPERTY','Property insurance',4000.00,TRUE),
    ('TRAVEL','Travel insurance',500.00,FALSE),('LIABILITY','Liability insurance',6000.00,TRUE);