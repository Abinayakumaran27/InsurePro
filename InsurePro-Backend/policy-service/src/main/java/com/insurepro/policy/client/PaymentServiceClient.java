package com.insurepro.policy.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.math.BigDecimal;
import java.time.LocalDate;

@FeignClient(name = "premium-payment-service",
             url  = "${services.payment.url:}",
             fallback = PaymentServiceClientFallback.class)
public interface PaymentServiceClient {

    @PostMapping("/api/v1/invoices/internal/for-policy")
    void generateInvoiceForPolicy(@RequestBody AutoInvoiceRequest req);

    @Getter @Setter @JsonIgnoreProperties(ignoreUnknown = true)
    class AutoInvoiceRequest {
        private Long policyId;
        private Long customerId;
        private BigDecimal amount;
        private BigDecimal taxAmount;
        private LocalDate dueDate;
        private LocalDate periodStart;
        private LocalDate periodEnd;

        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private final AutoInvoiceRequest r = new AutoInvoiceRequest();
            public Builder policyId(Long v)      { r.policyId = v;     return this; }
            public Builder customerId(Long v)    { r.customerId = v;   return this; }
            public Builder amount(BigDecimal v)  { r.amount = v;       return this; }
            public Builder taxAmount(BigDecimal v){ r.taxAmount = v;   return this; }
            public Builder dueDate(LocalDate v)  { r.dueDate = v;      return this; }
            public Builder periodStart(LocalDate v){ r.periodStart = v; return this; }
            public Builder periodEnd(LocalDate v){ r.periodEnd = v;    return this; }
            public AutoInvoiceRequest build() { return r; }
        }
    }
}
