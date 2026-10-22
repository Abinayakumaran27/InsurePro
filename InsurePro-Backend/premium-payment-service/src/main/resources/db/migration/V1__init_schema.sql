USE insurepro_payment;
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id BIGINT AUTO_INCREMENT PRIMARY KEY, invoice_number VARCHAR(30) NOT NULL,
    policy_id BIGINT NOT NULL, customer_id BIGINT NOT NULL,
    amount DECIMAL(15,2) NOT NULL, tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    due_date DATE NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'ISSUED',
    period_start DATE, period_end DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), deleted BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE KEY uk_invoice_number (invoice_number),
    INDEX idx_invoice_policy (policy_id), INDEX idx_invoice_customer (customer_id),
    INDEX idx_invoice_status (status), INDEX idx_invoice_due_date (due_date)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY, invoice_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL, amount DECIMAL(15,2) NOT NULL,
    payment_date DATE, method VARCHAR(30) NOT NULL, transaction_id VARCHAR(200),
    gateway VARCHAR(50), gateway_reference VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
    INDEX idx_payment_customer (customer_id), INDEX idx_payment_status (status)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS refunds (
    refund_id BIGINT AUTO_INCREMENT PRIMARY KEY, payment_id BIGINT NOT NULL,
    amount DECIMAL(15,2) NOT NULL, reason TEXT, status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    initiated_by BIGINT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
) ENGINE=InnoDB;