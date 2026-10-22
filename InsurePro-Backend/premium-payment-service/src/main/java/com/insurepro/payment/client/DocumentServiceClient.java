package com.insurepro.payment.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "document-service", fallback = DocumentServiceClientFallback.class)
public interface DocumentServiceClient {

    @PostMapping("/api/v1/documents/internal/register")
    void registerDocument(@RequestBody RegisterDocumentRequest req);

    @Getter @Setter @JsonIgnoreProperties(ignoreUnknown = true)
    class RegisterDocumentRequest {
        private String entityType;
        private Long entityId;
        private String documentType;
        private String fileName;
        private String contentBase64;
        private String mimeType;
        private Long uploadedBy;
        private String accessLevel;

        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private final RegisterDocumentRequest r = new RegisterDocumentRequest();
            public Builder entityType(String v)    { r.entityType = v;    return this; }
            public Builder entityId(Long v)        { r.entityId = v;      return this; }
            public Builder documentType(String v)  { r.documentType = v;  return this; }
            public Builder fileName(String v)      { r.fileName = v;      return this; }
            public Builder contentBase64(String v) { r.contentBase64 = v; return this; }
            public Builder mimeType(String v)      { r.mimeType = v;      return this; }
            public Builder uploadedBy(Long v)      { r.uploadedBy = v;    return this; }
            public Builder accessLevel(String v)   { r.accessLevel = v;   return this; }
            public RegisterDocumentRequest build() { return r; }
        }
    }
}
