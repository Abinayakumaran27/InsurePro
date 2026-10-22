package com.insurepro.document.controller;
import com.insurepro.document.dto.request.RegisterDocumentRequest;
import com.insurepro.document.dto.response.*;
import com.insurepro.document.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
@RestController @RequestMapping("/api/v1/documents")
@Tag(name="Document Management") @PreAuthorize("isAuthenticated()")
public class DocumentController {
    private final DocumentService documentService;
    public DocumentController(DocumentService documentService) { this.documentService = documentService; }
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary="Upload document", security=@SecurityRequirement(name="bearerAuth"))
    public ResponseEntity<ApiResponse<DocumentResponse>> upload(
            @RequestParam String entityType, @RequestParam Long entityId,
            @RequestParam String documentType, @RequestPart MultipartFile file,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
            documentService.uploadDocument(entityType, entityId, documentType, file, userId), "Document uploaded"));
    }
    
    @GetMapping("/{id}") @Operation(summary="Get document metadata", security=@SecurityRequirement(name="bearerAuth"))
    public ResponseEntity<ApiResponse<DocumentResponse>> get(@PathVariable Long id) { return ResponseEntity.ok(ApiResponse.ok(documentService.getDocumentById(id))); }
    
    @GetMapping("/{id}/download")
    @Operation(summary = "Download document",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        DocumentResponse meta = documentService.getDocumentById(id);
        byte[] content = documentService.downloadDocument(id);

        String contentType = (meta.getMimeType() != null)
                ? meta.getMimeType()
                : "application/octet-stream";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + meta.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(content.length)
                .body(content);
    }

    @GetMapping("/{id}/view")
    @Operation(summary = "View document inline",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<byte[]> view(@PathVariable Long id) {
        DocumentResponse meta = documentService.getDocumentById(id);
        byte[] content = documentService.downloadDocument(id);

        String contentType = (meta.getMimeType() != null)
                ? meta.getMimeType()
                : "application/octet-stream";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + meta.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(content.length)
                .body(content);
    }
    
    @GetMapping("/entity/{entityType}/{entityId}") @Operation(summary="List entity documents", security=@SecurityRequirement(name="bearerAuth"))
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> byEntity(@PathVariable String entityType, @PathVariable Long entityId) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.getDocumentsByEntity(entityType, entityId)));
    }
    
    @DeleteMapping("/{id}") @Operation(summary="Delete document (soft)", security=@SecurityRequirement(name="bearerAuth"))
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        documentService.deleteDocument(id, userId); return ResponseEntity.noContent().build();
    }

    @PostMapping("/internal/register")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Register a system-generated document (internal)",
               description = "Used by other services to register programmatically generated documents.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<DocumentResponse>> register(
            @Valid @RequestBody RegisterDocumentRequest req) {
        byte[] content = java.util.Base64.getDecoder().decode(req.getContentBase64());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                documentService.registerDocument(
                        req.getEntityType(), req.getEntityId(), req.getDocumentType(),
                        req.getFileName(), content, req.getMimeType(),
                        req.getUploadedBy(), req.getAccessLevel()),
                "Document registered"));
    }
}
