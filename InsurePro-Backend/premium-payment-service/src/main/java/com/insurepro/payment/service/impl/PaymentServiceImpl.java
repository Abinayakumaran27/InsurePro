package com.insurepro.payment.service.impl;

import com.insurepro.payment.client.AuditServiceClient;
import com.insurepro.payment.client.DocumentServiceClient;
import com.insurepro.payment.dto.request.RecordPaymentRequest;
import com.insurepro.payment.dto.response.PaymentResponse;
import com.insurepro.payment.entity.Invoice;
import com.insurepro.payment.entity.Payment;
import com.insurepro.payment.event.EventPublisher;
import com.insurepro.payment.exception.*;
import com.insurepro.payment.repository.*;
import com.insurepro.payment.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;

@Service
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepo;
    private final InvoiceRepository invoiceRepo;
    private final EventPublisher eventPublisher;
    private final AuditServiceClient auditClient;
    private final DocumentServiceClient documentClient;

    public PaymentServiceImpl(PaymentRepository paymentRepo,
                               InvoiceRepository invoiceRepo,
                               EventPublisher eventPublisher,
                               AuditServiceClient auditClient,
                               DocumentServiceClient documentClient) {
        this.paymentRepo    = paymentRepo;
        this.invoiceRepo    = invoiceRepo;
        this.eventPublisher = eventPublisher;
        this.auditClient    = auditClient;
        this.documentClient = documentClient;
    }

    @Override
    @Transactional
    public PaymentResponse recordPayment(RecordPaymentRequest req) {
        Invoice inv = invoiceRepo
                .findByInvoiceIdAndDeletedFalse(req.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found: " + req.getInvoiceId()));

        if (inv.getStatus() == Invoice.InvoiceStatus.PAID)
            throw new BusinessRuleException(
                    "Invoice already paid: " + req.getInvoiceId());

        Payment p = Payment.builder()
                .invoiceId(req.getInvoiceId())
                .customerId(req.getCustomerId())
                .amount(req.getAmount())
                .method(req.getMethod())
                .transactionId(req.getTransactionId())
                .gateway(req.getGateway())
                .gatewayReference(req.getGatewayReference())
                .paymentDate(LocalDate.now())
                .status(Payment.PaymentStatus.SUCCESS)
                .build();

        p = paymentRepo.save(p);
        inv.setStatus(Invoice.InvoiceStatus.PAID);
        invoiceRepo.save(inv);

        // Auto-register payment receipt as a document (entity: POLICY)
        if (documentClient != null && inv.getPolicyId() != null) {
            try {
                String receipt = buildReceiptText(p, inv);
                documentClient.registerDocument(
                        DocumentServiceClient.RegisterDocumentRequest.builder()
                                .entityType("POLICY")
                                .entityId(inv.getPolicyId())
                                .documentType("PAYMENT_RECEIPT")
                                .fileName("receipt-" + p.getPaymentId() + "-" + inv.getInvoiceNumber() + ".txt")
                                .contentBase64(Base64.getEncoder().encodeToString(
                                        receipt.getBytes(StandardCharsets.UTF_8)))
                                .mimeType("text/plain")
                                .uploadedBy(req.getCustomerId())
                                .accessLevel("PUBLIC")
                                .build());
                log.info("Payment receipt registered as document for policyId={}", inv.getPolicyId());
            } catch (Exception e) {
                log.warn("Could not register receipt document for policyId={}: {}", inv.getPolicyId(), e.getMessage());
            }
        }

        // Synchronous compliance audit write — must persist before returning.
        try {
            auditClient.writeAuditLog(req.getCustomerId(), String.valueOf(req.getCustomerId()),
                    "PAYMENT_RECORDED", "payments",
                    String.valueOf(p.getPaymentId()), "premium-payment-service",
                    "Rs." + req.getAmount() + " via " + req.getMethod()
                    + " for invoiceId=" + req.getInvoiceId());
        } catch (Exception e) {
            log.error("Sync audit write failed for PAYMENT_RECORDED: {}", e.getMessage());
        }

        eventPublisher.publishAuditEvent(
                String.valueOf(req.getCustomerId()),
                "PAYMENT_RECORDED", "payments",
                String.valueOf(p.getPaymentId()),
                "Rs." + req.getAmount() + " via " + req.getMethod());

        eventPublisher.publishNotificationEvent(
                String.valueOf(req.getCustomerId()),
                "Payment of Rs." + req.getAmount()
                + " received. TxnID: " + req.getTransactionId(),
                "PAYMENT");

        log.info("Payment recorded: id={}, amount={}",
                p.getPaymentId(), req.getAmount());
        return toResponse(p);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        return toResponse(paymentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found: " + id)));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getCustomerPayments(Long customerId,
                                                      Pageable pageable) {
        return paymentRepo
                .findByCustomerIdAndDeletedFalse(customerId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(Long paymentId, Long actorId) {
        Payment p = paymentRepo.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found: " + paymentId));
        if (p.getStatus() == Payment.PaymentStatus.REFUNDED)
            throw new BusinessRuleException("Payment already refunded");

        p.setStatus(Payment.PaymentStatus.REFUNDED);
        paymentRepo.save(p);

        eventPublisher.publishNotificationEvent(
                String.valueOf(p.getCustomerId()),
                "Refund of Rs." + p.getAmount() + " processed.",
                "PAYMENT");

        log.info("Payment refunded: id={}", paymentId);
        return toResponse(p);
    }

    private String buildReceiptText(Payment p, Invoice inv) {
        java.math.BigDecimal total = inv.getAmount().add(inv.getTaxAmount());
        return "PAYMENT RECEIPT\n"
             + "===============\n"
             + "Receipt No    : REC-" + p.getPaymentId() + "\n"
             + "Invoice No    : " + inv.getInvoiceNumber() + "\n\n"
             + "Payment Date  : " + p.getPaymentDate() + "\n"
             + "Base Amount   : Rs. " + inv.getAmount() + "\n"
             + "Tax (18% GST) : Rs. " + inv.getTaxAmount() + "\n"
             + "Total Paid    : Rs. " + total + "\n\n"
             + "Payment Method: " + p.getMethod() + "\n"
             + "Transaction ID: " + (p.getTransactionId() != null ? p.getTransactionId() : "N/A") + "\n"
             + "Gateway Ref   : " + (p.getGatewayReference() != null ? p.getGatewayReference() : "N/A") + "\n\n"
             + "Policy ID     : " + inv.getPolicyId() + "\n"
             + "Period        : " + inv.getPeriodStart() + " to " + inv.getPeriodEnd() + "\n\n"
             + "Status        : PAID\n"
             + "Generated     : " + java.time.LocalDateTime.now() + "\n";
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .paymentId(p.getPaymentId())
                .invoiceId(p.getInvoiceId())
                .customerId(p.getCustomerId())
                .amount(p.getAmount())
                .paymentDate(p.getPaymentDate())
                .method(p.getMethod())
                .transactionId(p.getTransactionId())
                .gateway(p.getGateway())
                .status(p.getStatus().name())
                .createdAt(p.getCreatedAt())
                .build();
    }
}