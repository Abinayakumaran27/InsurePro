package com.insurepro.payment.service.impl;
import com.insurepro.payment.dto.request.GenerateInvoiceRequest;
import com.insurepro.payment.dto.response.InvoiceResponse;
import com.insurepro.payment.entity.Invoice;
import com.insurepro.payment.event.EventPublisher;
import com.insurepro.payment.exception.ResourceNotFoundException;
import com.insurepro.payment.repository.InvoiceRepository;
import com.insurepro.payment.service.InvoiceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal; import java.time.LocalDateTime; import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicLong;
@Service @Slf4j
public class InvoiceServiceImpl implements InvoiceService {
    private final InvoiceRepository invoiceRepo;
    private final EventPublisher eventPublisher;
    private static final AtomicLong COUNTER = new AtomicLong(-1);
    public InvoiceServiceImpl(InvoiceRepository invoiceRepo, EventPublisher eventPublisher) {
        this.invoiceRepo = invoiceRepo; this.eventPublisher = eventPublisher;
    }
    @Override @Transactional
    public InvoiceResponse generateInvoice(GenerateInvoiceRequest req, Long actorId) {
        // Idempotency: if a non-cancelled invoice already exists for this policy+period, return it.
        if (req.getPolicyId() != null && req.getPeriodStart() != null && req.getPeriodEnd() != null) {
            java.util.Optional<Invoice> existing = invoiceRepo.findByPolicyIdAndPeriodStartAndPeriodEndAndDeletedFalse(
                    req.getPolicyId(), req.getPeriodStart(), req.getPeriodEnd());
            if (existing.isPresent() && existing.get().getStatus() != Invoice.InvoiceStatus.CANCELLED) {
                log.info("Returning existing invoice {} for policy {} period {}-{}",
                        existing.get().getInvoiceNumber(), req.getPolicyId(), req.getPeriodStart(), req.getPeriodEnd());
                return toResponse(existing.get());
            }
        }
        BigDecimal tax = req.getTaxAmount() != null ? req.getTaxAmount() : req.getAmount().multiply(new BigDecimal("0.18")).setScale(2, java.math.RoundingMode.HALF_UP);
        Invoice inv = Invoice.builder().invoiceNumber(generateNumber())
            .policyId(req.getPolicyId()).customerId(req.getCustomerId())
            .amount(req.getAmount()).taxAmount(tax).dueDate(req.getDueDate())
            .periodStart(req.getPeriodStart()).periodEnd(req.getPeriodEnd())
            .createdBy(String.valueOf(actorId)).build();
        inv = invoiceRepo.save(inv);
        BigDecimal total = req.getAmount().add(tax);
        eventPublisher.publishNotificationEvent(String.valueOf(req.getCustomerId()), "Invoice " + inv.getInvoiceNumber() + " generated. Amount: ₹" + total + ". Due: " + req.getDueDate(), "PAYMENT");
        log.info("Invoice generated: {}", inv.getInvoiceNumber());
        return toResponse(inv);
    }
    @Override @Transactional(readOnly=true)
    public InvoiceResponse getInvoiceById(Long id) {
        return toResponse(invoiceRepo.findByInvoiceIdAndDeletedFalse(id)
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id)));
    }
    @Override @Transactional(readOnly=true)
    public Page<InvoiceResponse> getCustomerInvoices(Long customerId, Pageable pageable) {
        return invoiceRepo.findByCustomerIdAndDeletedFalse(customerId, pageable).map(this::toResponse);
    }
    @Override @Transactional(readOnly=true)
    public Page<InvoiceResponse> getPolicyInvoices(Long policyId, Pageable pageable) {
        return invoiceRepo.findByPolicyIdAndDeletedFalse(policyId, pageable).map(this::toResponse);
    }
    private String generateNumber() {
        String ym = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        // initialize counter from DB on first call to survive restarts
        if (COUNTER.get() == -1) {
            String prefix = "INV-" + ym + "-";
            invoiceRepo.findTopByInvoiceNumberStartingWithOrderByInvoiceNumberDesc(prefix)
                .ifPresentOrElse(
                    last -> {
                        try {
                            long seq = Long.parseLong(last.getInvoiceNumber().substring(prefix.length()));
                            COUNTER.set(seq);
                        } catch (NumberFormatException e) {
                            COUNTER.set(0);
                        }
                    },
                    () -> COUNTER.set(0)
                );
        }
        return String.format("INV-%s-%06d", ym, COUNTER.incrementAndGet());
    }
    private InvoiceResponse toResponse(Invoice i) {
        BigDecimal total = i.getAmount().add(i.getTaxAmount());
        return InvoiceResponse.builder().invoiceId(i.getInvoiceId()).invoiceNumber(i.getInvoiceNumber())
            .policyId(i.getPolicyId()).customerId(i.getCustomerId()).amount(i.getAmount())
            .taxAmount(i.getTaxAmount()).totalAmount(total).dueDate(i.getDueDate()).status(i.getStatus().name())
            .periodStart(i.getPeriodStart()).periodEnd(i.getPeriodEnd()).createdAt(i.getCreatedAt()).build();
    }
}
