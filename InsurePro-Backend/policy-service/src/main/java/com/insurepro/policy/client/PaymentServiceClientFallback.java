package com.insurepro.policy.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class PaymentServiceClientFallback implements PaymentServiceClient {
    @Override
    public void generateInvoiceForPolicy(AutoInvoiceRequest req) {
        log.warn("PaymentServiceClient fallback: could not auto-generate invoice for policyId={}",
                req != null ? req.getPolicyId() : "?");
    }
}
