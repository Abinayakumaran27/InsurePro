package com.insurepro.payment.service;

import com.insurepro.payment.dto.request.GenerateInvoiceRequest;
import com.insurepro.payment.dto.response.InvoiceResponse;
import com.insurepro.payment.entity.Invoice;
import com.insurepro.payment.event.EventPublisher;
import com.insurepro.payment.exception.ResourceNotFoundException;
import com.insurepro.payment.repository.InvoiceRepository;
import com.insurepro.payment.service.impl.InvoiceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceImplTest {

    @Mock InvoiceRepository invoiceRepo;
    @Mock EventPublisher eventPublisher;

    @InjectMocks InvoiceServiceImpl service;

    private GenerateInvoiceRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new GenerateInvoiceRequest();
        validRequest.setPolicyId(1L);
        validRequest.setCustomerId(10L);
        validRequest.setAmount(new BigDecimal("10000"));
        validRequest.setDueDate(LocalDate.now().plusDays(30));
        validRequest.setPeriodStart(LocalDate.now());
        validRequest.setPeriodEnd(LocalDate.now().plusMonths(1));
    }

    @Test
    void generateInvoice_calculatesDefaultTax() {
        Invoice saved = Invoice.builder()
                .invoiceId(1L)
                .invoiceNumber("INV-202501-000001")
                .policyId(1L)
                .customerId(10L)
                .amount(new BigDecimal("10000"))
                .taxAmount(new BigDecimal("1800.00"))
                .dueDate(validRequest.getDueDate())
                .status(Invoice.InvoiceStatus.PENDING)
                .periodStart(validRequest.getPeriodStart())
                .periodEnd(validRequest.getPeriodEnd())
                .createdAt(LocalDateTime.now())
                .build();
        when(invoiceRepo.save(any())).thenReturn(saved);

        InvoiceResponse result = service.generateInvoice(validRequest, 99L);

        assertThat(result).isNotNull();
        assertThat(result.getTaxAmount()).isEqualByComparingTo(new BigDecimal("1800.00"));
        assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("11800.00"));
        verify(invoiceRepo).save(any());
        verify(eventPublisher).publishNotificationEvent(any(), any(), any());
    }

    @Test
    void generateInvoice_usesTaxAmountWhenProvided() {
        validRequest.setTaxAmount(new BigDecimal("500"));
        Invoice saved = Invoice.builder()
                .invoiceId(2L)
                .invoiceNumber("INV-202501-000002")
                .policyId(1L)
                .customerId(10L)
                .amount(new BigDecimal("10000"))
                .taxAmount(new BigDecimal("500"))
                .dueDate(validRequest.getDueDate())
                .status(Invoice.InvoiceStatus.PENDING)
                .periodStart(validRequest.getPeriodStart())
                .periodEnd(validRequest.getPeriodEnd())
                .createdAt(LocalDateTime.now())
                .build();
        when(invoiceRepo.save(any())).thenReturn(saved);

        InvoiceResponse result = service.generateInvoice(validRequest, 99L);

        assertThat(result.getTaxAmount()).isEqualByComparingTo(new BigDecimal("500"));
    }

    @Test
    void getInvoiceById_throwsWhenNotFound() {
        when(invoiceRepo.findByInvoiceIdAndDeletedFalse(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getInvoiceById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Invoice not found");
    }
}
