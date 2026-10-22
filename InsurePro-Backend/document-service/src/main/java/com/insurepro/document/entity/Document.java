package com.insurepro.document.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity @Table(name="documents") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="document_id") private Long documentId;
    @Column(name="entity_type", nullable=false, length=30) private String entityType;
    @Column(name="entity_id", nullable=false) private Long entityId;
    @Column(name="document_type", nullable=false, length=50) private String documentType;
    @Column(name="file_name", nullable=false, length=255) private String fileName;
    @Column(name="file_size") private Long fileSize;
    @Column(name="mime_type", length=100) private String mimeType;
    @Column(name="storage_path", nullable=false, length=500) private String storagePath;
    @Column(name="checksum_sha256", length=64) private String checksumSha256;
    @Column(name="uploaded_by", nullable=false) private Long uploadedBy;
    @Column(name="access_level", nullable=false, length=20) @Builder.Default private String accessLevel = "INTERNAL";
    @Column(name="retention_until") private LocalDateTime retentionUntil;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
    @Column(name="deleted") @Builder.Default private boolean deleted = false;
}
