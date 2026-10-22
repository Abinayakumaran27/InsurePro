package com.insurepro.document.service.impl;
import com.insurepro.document.dto.response.DocumentResponse;
import com.insurepro.document.entity.Document;
import com.insurepro.document.event.EventPublisher;
import com.insurepro.document.exception.*;
import com.insurepro.document.repository.DocumentRepository;
import com.insurepro.document.service.DocumentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException; import java.nio.file.*; import java.security.MessageDigest;
import java.util.*;
@Service @Slf4j
public class DocumentServiceImpl implements DocumentService {
    private final DocumentRepository documentRepo;
    private final EventPublisher eventPublisher;
    @Value("${app.document.storage-path:/tmp/insurepro-docs}") private String storagePath;
    @Value("${app.document.max-file-size-mb:10}") private long maxFileSizeMb;
    public DocumentServiceImpl(DocumentRepository documentRepo, EventPublisher eventPublisher) {
        this.documentRepo = documentRepo; this.eventPublisher = eventPublisher;
    }
    @Override @Transactional
    public DocumentResponse uploadDocument(String entityType, Long entityId, String documentType, MultipartFile file, Long uploadedBy) {
        if (file == null || file.isEmpty()) throw new BusinessRuleException("File is empty");
        if (file.getSize() > maxFileSizeMb * 1024 * 1024) throw new BusinessRuleException("File exceeds " + maxFileSizeMb + "MB limit");
        try {
            String ext = getExtension(Objects.requireNonNull(file.getOriginalFilename()));
            String storedName = UUID.randomUUID() + ext;
            Path dirPath = Paths.get(storagePath, entityType.toLowerCase(), String.valueOf(entityId));
            Files.createDirectories(dirPath);
            Path dest = dirPath.resolve(storedName);
            Files.write(dest, file.getBytes());
            String checksum = sha256(file.getBytes());
            Document doc = Document.builder().entityType(entityType.toUpperCase()).entityId(entityId)
                .documentType(documentType.toUpperCase()).fileName(file.getOriginalFilename())
                .fileSize(file.getSize()).mimeType(file.getContentType())
                .storagePath(dest.toString()).checksumSha256(checksum).uploadedBy(uploadedBy).build();
            doc = documentRepo.save(doc);
            eventPublisher.publishAuditEvent(String.valueOf(uploadedBy), "DOCUMENT_UPLOADED", "documents", String.valueOf(doc.getDocumentId()), entityType + "/" + entityId + "/" + documentType);
            // Notify the uploader that their document was saved successfully
            eventPublisher.publishNotificationEvent(String.valueOf(uploadedBy),
                    "📎 Document '" + file.getOriginalFilename() + "' (" + documentType + ") has been uploaded successfully "
                    + "for " + entityType + " #" + entityId + ".",
                    "DOCUMENTS");
            log.info("Document uploaded: id={}, entity={}/{}", doc.getDocumentId(), entityType, entityId);
            return toResponse(doc);
        } catch (IOException e) { throw new RuntimeException("Failed to store document: " + e.getMessage(), e); }
    }
    @Override @Transactional(readOnly=true)
    public DocumentResponse getDocumentById(Long id) {
        return toResponse(documentRepo.findByDocumentIdAndDeletedFalse(id).orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id)));
    }
    @Override @Transactional(readOnly=true)
    public List<DocumentResponse> getDocumentsByEntity(String entityType, Long entityId) {
        return documentRepo.findByEntityTypeAndEntityIdAndDeletedFalse(entityType.toUpperCase(), entityId).stream().map(this::toResponse).toList();
    }
    @Override @Transactional(readOnly=true)
    public Page<DocumentResponse> listDocuments(String entityType, Long entityId, Pageable pageable) {
        return documentRepo.findByEntityTypeAndEntityIdAndDeletedFalse(entityType.toUpperCase(), entityId, pageable).map(this::toResponse);
    }
    @Override @Transactional
    public void deleteDocument(Long id, Long actorId) {
        Document doc = documentRepo.findByDocumentIdAndDeletedFalse(id).orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        doc.setDeleted(true); documentRepo.save(doc);
        eventPublisher.publishAuditEvent(String.valueOf(actorId), "DOCUMENT_DELETED", "documents", String.valueOf(id), "Soft deleted");
    }
    @Override @Transactional
    public DocumentResponse registerDocument(String entityType, Long entityId,
            String documentType, String fileName, byte[] content,
            String mimeType, Long uploadedBy, String accessLevel) {
        try {
            String ext = getExtension(fileName != null ? fileName : "document.txt");
            String storedName = UUID.randomUUID() + ext;
            Path dirPath = Paths.get(storagePath, entityType.toLowerCase(), String.valueOf(entityId));
            Files.createDirectories(dirPath);
            Path dest = dirPath.resolve(storedName);
            Files.write(dest, content);
            String checksum = sha256(content);
            String resolvedAccessLevel = (accessLevel != null) ? accessLevel : "PUBLIC";
            Document doc = Document.builder()
                .entityType(entityType.toUpperCase()).entityId(entityId)
                .documentType(documentType.toUpperCase()).fileName(fileName)
                .fileSize((long) content.length).mimeType(mimeType)
                .storagePath(dest.toString()).checksumSha256(checksum)
                .uploadedBy(uploadedBy).accessLevel(resolvedAccessLevel).build();
            doc = documentRepo.save(doc);
            eventPublisher.publishAuditEvent(String.valueOf(uploadedBy), "DOCUMENT_REGISTERED", "documents", String.valueOf(doc.getDocumentId()), entityType + "/" + entityId + "/" + documentType);
            log.info("Document registered: id={}, entity={}/{}", doc.getDocumentId(), entityType, entityId);
            return toResponse(doc);
        } catch (IOException e) { throw new RuntimeException("Failed to store document: " + e.getMessage(), e); }
    }
    @Override @Transactional(readOnly=true)
    public byte[] downloadDocument(Long id) {
        Document doc = documentRepo.findByDocumentIdAndDeletedFalse(id).orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        try { return Files.readAllBytes(Paths.get(doc.getStoragePath())); }
        catch (IOException e) { throw new RuntimeException("Failed to read document: " + e.getMessage(), e); }
    }
    private String getExtension(String filename) {
        int idx = filename.lastIndexOf('.'); return (idx >= 0) ? filename.substring(idx) : "";
    }
    private String sha256(byte[] data) {
        try { return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(data)); }
        catch (Exception e) { return "checksum-unavailable"; }
    }
    private DocumentResponse toResponse(Document d) {
        return DocumentResponse.builder().documentId(d.getDocumentId()).entityType(d.getEntityType())
            .entityId(d.getEntityId()).documentType(d.getDocumentType()).fileName(d.getFileName())
            .fileSize(d.getFileSize()).mimeType(d.getMimeType()).storagePath(d.getStoragePath())
            .checksum(d.getChecksumSha256()).uploadedBy(d.getUploadedBy()).accessLevel(d.getAccessLevel())
            .createdAt(d.getCreatedAt()).downloadUrl("/api/v1/documents/" + d.getDocumentId() + "/download").build();
    }
}
