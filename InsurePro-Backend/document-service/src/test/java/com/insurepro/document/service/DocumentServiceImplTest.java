package com.insurepro.document.service;

import com.insurepro.document.dto.response.DocumentResponse;
import com.insurepro.document.entity.Document;
import com.insurepro.document.event.EventPublisher;
import com.insurepro.document.exception.BusinessRuleException;
import com.insurepro.document.exception.ResourceNotFoundException;
import com.insurepro.document.repository.DocumentRepository;
import com.insurepro.document.service.impl.DocumentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceImplTest {

    @Mock
    private DocumentRepository documentRepo;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private DocumentServiceImpl documentService;

    private Document sampleDocument;
    private Pageable pageable;
    private Path tempStoragePath;

    @BeforeEach
    void setUp() throws IOException {
        // Use a real temp directory so file I/O works in tests
        tempStoragePath = Files.createTempDirectory("insurepro-test-docs");
        ReflectionTestUtils.setField(documentService, "storagePath",
                tempStoragePath.toString());
        ReflectionTestUtils.setField(documentService, "maxFileSizeMb", 10L);

        sampleDocument = Document.builder()
                .documentId(1L)
                .entityType("CUSTOMER")
                .entityId(5L)
                .documentType("AADHAAR")
                .fileName("aadhaar.pdf")
                .fileSize(1024L)
                .mimeType("application/pdf")
                .storagePath(tempStoragePath.resolve("customer/5/aadhaar.pdf").toString())
                .checksumSha256("abc123")
                .uploadedBy(1L)
                .accessLevel("PRIVATE")
                .build();

        pageable = PageRequest.of(0, 10);
    }

    // ── uploadDocument ────────────────────────────────────────────────────────

    @Test
    void uploadDocument_validFile_savesAndReturnsResponse() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "aadhaar.pdf",
                "application/pdf", "PDF content".getBytes());

        when(documentRepo.save(any(Document.class))).thenReturn(sampleDocument);

        DocumentResponse result = documentService.uploadDocument(
                "CUSTOMER", 5L, "AADHAAR", file, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getDocumentId()).isEqualTo(1L);
        assertThat(result.getEntityType()).isEqualTo("CUSTOMER");
        assertThat(result.getDocumentType()).isEqualTo("AADHAAR");
        assertThat(result.getDownloadUrl()).contains("/api/v1/documents/1/download");
        verify(documentRepo).save(any(Document.class));
        verify(eventPublisher).publishAuditEvent(anyString(), eq("DOCUMENT_UPLOADED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void uploadDocument_emptyFile_throwsBusinessRuleException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> documentService.uploadDocument(
                "CUSTOMER", 5L, "AADHAAR", emptyFile, 1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("empty");
    }

    @Test
    void uploadDocument_nullFile_throwsBusinessRuleException() {
        assertThatThrownBy(() -> documentService.uploadDocument(
                "CUSTOMER", 5L, "AADHAAR", null, 1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("empty");
    }

    @Test
    void uploadDocument_fileTooLarge_throwsBusinessRuleException() {
        // 11 MB file exceeds 10 MB limit
        byte[] largeContent = new byte[11 * 1024 * 1024];
        MockMultipartFile largeFile = new MockMultipartFile(
                "file", "large.pdf", "application/pdf", largeContent);

        assertThatThrownBy(() -> documentService.uploadDocument(
                "CUSTOMER", 5L, "AADHAAR", largeFile, 1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("10MB");
    }

    // ── getDocumentById ───────────────────────────────────────────────────────

    @Test
    void getDocumentById_existingDocument_returnsResponse() {
        when(documentRepo.findByDocumentIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(sampleDocument));

        DocumentResponse result = documentService.getDocumentById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getDocumentId()).isEqualTo(1L);
        assertThat(result.getFileName()).isEqualTo("aadhaar.pdf");
    }

    @Test
    void getDocumentById_notFound_throwsResourceNotFoundException() {
        when(documentRepo.findByDocumentIdAndDeletedFalse(99L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> documentService.getDocumentById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── getDocumentsByEntity ──────────────────────────────────────────────────

    @Test
    void getDocumentsByEntity_returnsDocumentList() {
        when(documentRepo.findByEntityTypeAndEntityIdAndDeletedFalse("CUSTOMER", 5L))
                .thenReturn(List.of(sampleDocument));

        List<DocumentResponse> result = documentService
                .getDocumentsByEntity("CUSTOMER", 5L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEntityType()).isEqualTo("CUSTOMER");
        assertThat(result.get(0).getEntityId()).isEqualTo(5L);
    }

    @Test
    void getDocumentsByEntity_caseInsensitive_normalizesToUpperCase() {
        when(documentRepo.findByEntityTypeAndEntityIdAndDeletedFalse("CUSTOMER", 5L))
                .thenReturn(List.of(sampleDocument));

        List<DocumentResponse> result = documentService
                .getDocumentsByEntity("customer", 5L);  // lowercase input

        assertThat(result).hasSize(1);
        verify(documentRepo).findByEntityTypeAndEntityIdAndDeletedFalse("CUSTOMER", 5L);
    }

    @Test
    void getDocumentsByEntity_noDocuments_returnsEmptyList() {
        when(documentRepo.findByEntityTypeAndEntityIdAndDeletedFalse("POLICY", 99L))
                .thenReturn(List.of());

        List<DocumentResponse> result = documentService
                .getDocumentsByEntity("POLICY", 99L);

        assertThat(result).isEmpty();
    }

    // ── listDocuments ─────────────────────────────────────────────────────────

    @Test
    void listDocuments_returnsPagedResults() {
        Page<Document> page = new PageImpl<>(List.of(sampleDocument));
        when(documentRepo.findByEntityTypeAndEntityIdAndDeletedFalse(
                "CUSTOMER", 5L, pageable)).thenReturn(page);

        Page<DocumentResponse> result = documentService
                .listDocuments("CUSTOMER", 5L, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getDocumentId()).isEqualTo(1L);
    }

    // ── deleteDocument ────────────────────────────────────────────────────────

    @Test
    void deleteDocument_existingDocument_softDeletes() {
        when(documentRepo.findByDocumentIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(sampleDocument));

        documentService.deleteDocument(1L, 1L);

        verify(documentRepo).save(argThat(d -> d.isDeleted()));
        verify(eventPublisher).publishAuditEvent(anyString(), eq("DOCUMENT_DELETED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void deleteDocument_notFound_throwsResourceNotFoundException() {
        when(documentRepo.findByDocumentIdAndDeletedFalse(99L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> documentService.deleteDocument(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── registerDocument ──────────────────────────────────────────────────────

    @Test
    void registerDocument_validInput_savesAndReturnsResponse() {
        Document registeredDoc = Document.builder()
                .documentId(2L)
                .entityType("CLAIM")
                .entityId(3L)
                .documentType("INVOICE")
                .fileName("invoice.pdf")
                .fileSize(512L)
                .mimeType("application/pdf")
                .storagePath(tempStoragePath.resolve("claim/3/invoice.pdf").toString())
                .uploadedBy(1L)
                .accessLevel("PUBLIC")
                .build();

        when(documentRepo.save(any(Document.class))).thenReturn(registeredDoc);

        DocumentResponse result = documentService.registerDocument(
                "CLAIM", 3L, "INVOICE", "invoice.pdf",
                "PDF content".getBytes(), "application/pdf", 1L, "PUBLIC");

        assertThat(result).isNotNull();
        assertThat(result.getDocumentId()).isEqualTo(2L);
        assertThat(result.getEntityType()).isEqualTo("CLAIM");
        assertThat(result.getAccessLevel()).isEqualTo("PUBLIC");
        verify(documentRepo).save(any(Document.class));
        verify(eventPublisher).publishAuditEvent(anyString(), eq("DOCUMENT_REGISTERED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void registerDocument_nullAccessLevel_defaultsToPublic() {
        Document publicDoc = Document.builder()
                .documentId(3L)
                .entityType("CUSTOMER")
                .entityId(5L)
                .documentType("PAN")
                .fileName("pan.jpg")
                .fileSize(256L)
                .accessLevel("PUBLIC")
                .uploadedBy(1L)
                .build();
        when(documentRepo.save(any(Document.class))).thenReturn(publicDoc);

        DocumentResponse result = documentService.registerDocument(
                "CUSTOMER", 5L, "PAN", "pan.jpg",
                "image data".getBytes(), "image/jpeg", 1L, null);

        assertThat(result).isNotNull();
        verify(documentRepo).save(argThat(d ->
                "PUBLIC".equals(d.getAccessLevel())));
    }
}
