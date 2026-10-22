USE insurepro_document;
CREATE TABLE IF NOT EXISTS documents (
    document_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(30) NOT NULL, entity_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL, file_name VARCHAR(255) NOT NULL,
    file_size BIGINT, mime_type VARCHAR(100), storage_path VARCHAR(500) NOT NULL,
    checksum_sha256 VARCHAR(64), uploaded_by BIGINT NOT NULL,
    access_level VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',
    retention_until DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    INDEX idx_doc_entity (entity_type, entity_id), INDEX idx_doc_type (document_type)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS document_versions (
    version_id BIGINT AUTO_INCREMENT PRIMARY KEY, document_id BIGINT NOT NULL,
    version_number INT NOT NULL DEFAULT 1, storage_path VARCHAR(500) NOT NULL,
    change_note TEXT, created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dv_doc FOREIGN KEY (document_id) REFERENCES documents(document_id)
) ENGINE=InnoDB;