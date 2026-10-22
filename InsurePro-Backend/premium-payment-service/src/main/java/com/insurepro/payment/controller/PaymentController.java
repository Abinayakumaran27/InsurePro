package com.insurepro.payment.controller;

import com.insurepro.payment.dto.request.RecordPaymentRequest;
import com.insurepro.payment.dto.response.*;
import com.insurepro.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payment Management",
     description = "Payment processing, history and refund management")
@PreAuthorize("isAuthenticated()")
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // ── Record Payment ───────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Record payment",
               description = "Records a new payment against an invoice.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PaymentResponse>> record(
            @Valid @RequestBody RecordPaymentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        paymentService.recordPayment(req),
                        "Payment recorded successfully"));
    }

    // ── Get Payment by ID ────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID",
               description = "Returns payment details by ID.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PaymentResponse>> get(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(paymentService.getPaymentById(id)));
    }

    // ── Get Customer Payments ────────────────────────────────────────────────

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get payments by customer",
               description = "Returns all payments made by a specific customer.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> byCustomer(
            @PathVariable Long customerId,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction: asc or desc")
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.getCustomerPayments(customerId, pageable)));
    }

    // ── Refund Payment ───────────────────────────────────────────────────────

    @PostMapping("/{id}/refund")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE')")
    @Operation(summary = "Refund payment",
               description = "Processes a refund for a completed payment. " +
                             "Admin and Finance only.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PaymentResponse>> refund(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.refundPayment(id, userId),
                "Refund processed successfully"));
    }
}