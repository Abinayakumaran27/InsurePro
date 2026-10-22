USE insurepro_underwriting;
CREATE TABLE IF NOT EXISTS risk_rules (
    rule_id BIGINT AUTO_INCREMENT PRIMARY KEY, policy_type_id BIGINT NOT NULL,
    rule_name VARCHAR(100) NOT NULL, condition_expression TEXT NOT NULL,
    risk_weight DECIMAL(5,2) NOT NULL, action VARCHAR(20) NOT NULL,
    priority INT NOT NULL DEFAULT 1, active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_risk_rule_type (policy_type_id), INDEX idx_risk_rule_active (active)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS underwriting_requests (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY, policy_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL, policy_type_id BIGINT NOT NULL,
    risk_score DECIMAL(5,2), status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    referred_to_user_id BIGINT, decision_remarks TEXT, decided_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    INDEX idx_uw_policy (policy_id), INDEX idx_uw_status (status)
) ENGINE=InnoDB;
INSERT IGNORE INTO risk_rules (policy_type_id, rule_name, condition_expression, risk_weight, action, priority) VALUES
    (1,'Age > 60','customer.age > 60',30.00,'REFER',1),
    (1,'High Coverage','coverage > 5000000',25.00,'REFER',2),
    (2,'Pre-existing Condition','health_declared = true',20.00,'REFER',1);