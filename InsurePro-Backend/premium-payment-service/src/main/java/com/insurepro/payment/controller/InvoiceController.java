package com.insurepro.payment.controller;

import com.insurepro.payment.dto.request.GenerateInvoiceRequest;
import com.insurepro.payment.dto.response.*;
import com.insurepro.payment.service.InvoiceService;
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
@RequestMapping("/api/v1/invoices")
@Tag(name = "Invoice Management",
     description = "Invoice generation, retrieval and payment tracking")
@PreAuthorize("isAuthenticated()")
@Slf4j
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    // ── Generate Invoice ─────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE')")
    @Operation(summary = "Generate invoice",
               description = "Generates a new invoice for a policy. Admin and Finance only.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<InvoiceResponse>> generate(
            @Valid @RequestBody GenerateInvoiceRequest req,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        invoiceService.generateInvoice(req, userId),
                        "Invoice generated successfully"));
    }

    @PostMapping("/internal/for-policy")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Auto-generate invoice for activated policy (internal)",
               description = "Called by policy-service when a policy is activated. Requires any authenticated role.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<InvoiceResponse>> generateForPolicy(
            @Valid @RequestBody GenerateInvoiceRequest req,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        invoiceService.generateInvoice(req, userId),
                        "Invoice auto-generated for activated policy"));
    }

    // ── Get Invoice by ID ────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get invoice by ID",
               description = "Returns invoice details by ID.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<InvoiceResponse>> get(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(invoiceService.getInvoiceById(id)));
    }

    // ── Get Customer Invoices ────────────────────────────────────────────────

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get invoices by customer",
               description = "Returns all invoices for a specific customer.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> byCustomer(
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
                invoiceService.getCustomerInvoices(customerId, pageable)));
    }

    // ── Get Policy Invoices ──────────────────────────────────────────────────

    @GetMapping("/policy/{policyId}")
    @Operation(summary = "Get invoices by policy",
               description = "Returns all invoices for a specific policy.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> byPolicy(
            @PathVariable Long policyId,
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
                invoiceService.getPolicyInvoices(policyId, pageable)));
    }
}