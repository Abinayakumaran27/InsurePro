package com.insurepro.document.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentResponse {
    private Long documentId; private String entityType; private Long entityId;
    private String documentType; private String fileName; private Long fileSize;
    private String mimeType; private String storagePath; private String checksum;
    private Long uploadedBy; private String accessLevel; private LocalDateTime createdAt;
    private String downloadUrl;
}
