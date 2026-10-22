package com.insurepro.customer.controller;

import com.insurepro.customer.dto.request.*;
import com.insurepro.customer.dto.response.*;
import com.insurepro.customer.service.CustomerService;
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
@RequestMapping("/api/v1/customers")
@Tag(name = "Customer Management",
     description = "Customer registration, profile management and KYC operations")
@Slf4j
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // ── Create Customer (Agent or Admin) ─────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','AGENT')")
    @Operation(summary = "Create customer profile (Agent/Admin only)",
               description = "Creates a verified customer profile. " +
                             "Only ADMIN and AGENT may create profiles for others. " +
                             "Policyholders must use POST /customers/my-profile instead.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CustomerResponse>> create(
            @Valid @RequestBody CreateCustomerRequest req,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        customerService.createCustomer(req, userId),
                        "Customer created successfully"));
    }

    // ── Create Own Profile (Policyholder self-service) ───────────────────────

    @PostMapping("/my-profile")
    @PreAuthorize("hasRole('POLICYHOLDER')")
    @Operation(summary = "Create my own customer profile",
               description = "Policyholder creates their own customer profile " +
                             "after IAM registration. KYC status starts as PENDING " +
                             "and must be verified by an Agent before policies can be issued.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CustomerResponse>> createMyProfile(
            @Valid @RequestBody CreateCustomerRequest req,
            @AuthenticationPrincipal Long userId) {
        log.info("Policyholder userId={} creating own profile", userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        customerService.createSelfProfile(req, userId),
                        "Your profile has been created. KYC verification is pending — " +
                        "an agent will verify your documents before policies can be issued."));
    }

    // ── Get Customer by ID ───────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get customer by ID",
               description = "Returns customer profile by ID.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CustomerResponse>> get(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(customerService.getCustomerById(id)));
    }

    // ── Get My Profile (Policyholder) ────────────────────────────────────────

    @GetMapping("/my-profile")
    @PreAuthorize("hasRole('POLICYHOLDER')")
    @Operation(summary = "Get my own customer profile",
               description = "Policyholder views their own profile.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CustomerResponse>> getMyProfile(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                customerService.getCustomerByUserId(userId)));
    }

    // ── List / Search Customers ──────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','AGENT','UNDERWRITER','ADJUSTER')")
    @Operation(summary = "List or search customers",
               description = "Returns paginated list of customers. " +
                             "Use 'search' param to filter by name, email or phone.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<CustomerResponse>>> list(
            @Parameter(description = "Search by name, email or phone")
            @RequestParam(required = false) String search,
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

        Page<CustomerResponse> result =
                (search != null && !search.isBlank())
                ? customerService.searchCustomers(search, pageable)
                : customerService.listCustomers(pageable);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Update Customer ──────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT')")
    @Operation(summary = "Update customer",
               description = "Updates customer profile details. Admin and Agent only.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CustomerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerRequest req,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                customerService.updateCustomer(id, req, userId),
                "Customer updated successfully"));
    }

    // ── Update My Profile (Policyholder self-service) ────────────────────────

    @PutMapping("/my-profile")
    @PreAuthorize("hasRole('POLICYHOLDER')")
    @Operation(summary = "Update my own profile",
               description = "Policyholder updates their own profile details.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CustomerResponse>> updateMyProfile(
            @Valid @RequestBody UpdateCustomerRequest req,
            @AuthenticationPrincipal Long userId) {
        CustomerResponse customer =
                customerService.getCustomerByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok(
                customerService.updateCustomer(
                        customer.getCustomerId(), req, userId),
                "Profile updated successfully"));
    }

    // ── Patch My Profile (Policyholder self-service, alias for PUT) ──────────

    @PatchMapping("/my-profile")
    @PreAuthorize("hasRole('POLICYHOLDER')")
    @Operation(summary = "Update my own profile (PATCH)",
               description = "Policyholder updates their own profile details via PATCH.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CustomerResponse>> patchMyProfile(
            @Valid @RequestBody UpdateCustomerRequest req,
            @AuthenticationPrincipal Long userId) {
        CustomerResponse customer =
                customerService.getCustomerByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok(
                customerService.updateCustomer(
                        customer.getCustomerId(), req, userId),
                "Profile updated successfully"));
    }

    // ── Delete Customer ──────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate customer",
               description = "Soft deletes a customer. Admin only.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        customerService.deleteCustomer(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ── Update KYC Status ────────────────────────────────────────────────────

    @PatchMapping("/{id}/kyc-status")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT','COMPLIANCE')")
    @Operation(summary = "Update KYC status",
               description = "Updates customer KYC verification status. " +
                             "Valid values: PENDING, IN_PROGRESS, VERIFIED, " +
                             "REJECTED, EXPIRED",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CustomerResponse>> updateKyc(
            @PathVariable Long id,
            @Parameter(description = "KYC status: PENDING, IN_PROGRESS, VERIFIED, REJECTED, EXPIRED")
            @RequestParam String status,
            @Parameter(description = "Required when status is REJECTED")
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                customerService.updateKycStatus(id, status, reason, userId),
                "KYC status updated successfully"));
    }
}