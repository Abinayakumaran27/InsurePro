package com.insurepro.payment.service;
import com.insurepro.payment.dto.request.GenerateInvoiceRequest;
import com.insurepro.payment.dto.response.InvoiceResponse;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
public interface InvoiceService {
    InvoiceResponse generateInvoice(GenerateInvoiceRequest req, Long actorId);
    InvoiceResponse getInvoiceById(Long invoiceId);
    Page<InvoiceResponse> getCustomerInvoices(Long customerId, Pageable pageable);
    Page<InvoiceResponse> getPolicyInvoices(Long policyId, Pageable pageable);
}
