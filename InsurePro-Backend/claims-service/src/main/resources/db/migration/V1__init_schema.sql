USE insurepro_claims;
CREATE TABLE IF NOT EXISTS claims (
    claim_id BIGINT AUTO_INCREMENT PRIMARY KEY, claim_number VARCHAR(30) NOT NULL,
    policy_id BIGINT NOT NULL, customer_id BIGINT NOT NULL,
    claim_date DATE NOT NULL, incident_date DATE NOT NULL,
    claim_type VARCHAR(50) NOT NULL, description TEXT,
    amount_requested DECIMAL(15,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    assigned_adjuster_id BIGINT, document_path VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), modified_by VARCHAR(100), deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE KEY uk_claim_number (claim_number),
    INDEX idx_claims_customer (customer_id), INDEX idx_claims_policy (policy_id),
    INDEX idx_claims_status (status), INDEX idx_claims_adjuster (assigned_adjuster_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS settlements (
    settlement_id BIGINT AUTO_INCREMENT PRIMARY KEY, claim_id BIGINT NOT NULL,
    amount_approved DECIMAL(15,2) NOT NULL, deductible_applied DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    approved_by VARCHAR(150), settlement_date DATE, remarks TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_settlement_claim FOREIGN KEY (claim_id) REFERENCES claims(claim_id),
    INDEX idx_settlement_claim (claim_id), INDEX idx_settlement_status (status)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS claim_notes (
    note_id BIGINT AUTO_INCREMENT PRIMARY KEY, claim_id BIGINT NOT NULL,
    author_user_id BIGINT NOT NULL, note_text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_note_claim FOREIGN KEY (claim_id) REFERENCES claims(claim_id),
    INDEX idx_note_claim (claim_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS claim_disputes (
    dispute_id BIGINT AUTO_INCREMENT PRIMARY KEY, claim_id BIGINT NOT NULL,
    raised_by_user_id BIGINT NOT NULL, reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT, resolved_by BIGINT, resolved_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispute_claim FOREIGN KEY (claim_id) REFERENCES claims(claim_id),
    INDEX idx_dispute_claim (claim_id), INDEX idx_dispute_status (status)
) ENGINE=InnoDB;