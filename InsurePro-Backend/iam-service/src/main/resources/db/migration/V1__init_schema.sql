-- ============================================================
-- InsurePro IAM Service - Schema V1
-- ============================================================
USE insurepro_iam;

CREATE TABLE IF NOT EXISTS roles (
    role_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL,
    description VARCHAR(255),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    user_id              BIGINT       AUTO_INCREMENT PRIMARY KEY,
    username             VARCHAR(50)  NOT NULL,
    email                VARCHAR(150) NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    full_name            VARCHAR(150) NOT NULL,
    phone                VARCHAR(20),
    status ENUM('ACTIVE','INACTIVE','LOCKED','PENDING_VERIFICATION') 
    NOT NULL DEFAULT 'ACTIVE',mfa_enabled          BOOLEAN      NOT NULL DEFAULT FALSE,
    mfa_secret           VARCHAR(255),
    failed_login_count   INT          NOT NULL DEFAULT 0,
    locked_until         DATETIME,
    last_login_at        DATETIME,
    password_changed_at  DATETIME,
    password_reset_token VARCHAR(255),
    reset_token_expiry   DATETIME,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by           VARCHAR(100),
    modified_by          VARCHAR(100),
    deleted              BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE KEY uk_users_email    (email),
    UNIQUE KEY uk_users_username (username),
    INDEX idx_users_status  (status),
    INDEX idx_users_deleted (deleted)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id   BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expiry_date DATETIME    NOT NULL,
    revoked    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rt_user_id (user_id),
    INDEX idx_rt_revoked (revoked),
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_history (
    history_id    BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    changed_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ph_user_id (user_id),
    CONSTRAINT fk_ph_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS login_attempts (
    attempt_id     BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT,
    email          VARCHAR(150),
    ip_address     VARCHAR(45)  NOT NULL,
    user_agent     VARCHAR(500),
    success        BOOLEAN      NOT NULL DEFAULT FALSE,
    failure_reason VARCHAR(100),
    attempted_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_la_user_id     (user_id),
    INDEX idx_la_email       (email),
    INDEX idx_la_attempted_at (attempted_at)
) ENGINE=InnoDB;

-- ── Seed Data ─────────────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
    ('ROLE_ADMIN',              'System Administrator'),
    ('ROLE_POLICYHOLDER',       'Insurance policyholder'),
    ('ROLE_AGENT',              'Insurance agent or broker'),
    ('ROLE_ADJUSTER',           'Claims adjuster'),
    ('ROLE_UNDERWRITER',        'Underwriting specialist'),
    ('ROLE_COMPLIANCE_OFFICER', 'Compliance and audit officer'),
    ('ROLE_FINANCE',            'Finance team member');

-- Default admin is created at application startup by SuperAdminInitializer
