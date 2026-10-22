package com.insurepro.payment.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class DocumentServiceClientFallback implements DocumentServiceClient {
    @Override
    public void registerDocument(RegisterDocumentRequest req) {
        log.warn("DocumentServiceClient fallback: could not register document (entity={}/{})",
                req != null ? req.getEntityType() : "?",
                req != null ? req.getEntityId() : "?");
    }
}
