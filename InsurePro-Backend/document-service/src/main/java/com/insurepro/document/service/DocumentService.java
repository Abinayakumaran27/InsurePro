package com.insurepro.document.service;
import com.insurepro.document.dto.response.DocumentResponse;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
public interface DocumentService {
    DocumentResponse uploadDocument(String entityType, Long entityId, String documentType, MultipartFile file, Long uploadedBy);
    DocumentResponse getDocumentById(Long documentId);
    List<DocumentResponse> getDocumentsByEntity(String entityType, Long entityId);
    Page<DocumentResponse> listDocuments(String entityType, Long entityId, Pageable pageable);
    void deleteDocument(Long documentId, Long actorId);
    byte[] downloadDocument(Long documentId);
    DocumentResponse registerDocument(String entityType, Long entityId,
            String documentType, String fileName, byte[] content,
            String mimeType, Long uploadedBy, String accessLevel);
}
