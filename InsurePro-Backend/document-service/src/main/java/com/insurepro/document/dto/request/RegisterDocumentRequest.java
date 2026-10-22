package com.insurepro.document.dto.request;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegisterDocumentRequest {
    private String entityType;
    private Long entityId;
    private String documentType;
    private String fileName;
    private String contentBase64; // Base64-encoded file content
    private String mimeType;
    private Long uploadedBy;
    private String accessLevel;  // PUBLIC, INTERNAL, RESTRICTED
}
