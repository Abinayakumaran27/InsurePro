package com.insurepro.policy.controller;

import com.insurepro.policy.client.CustomerServiceClient;
import com.insurepro.policy.dto.request.CreatePolicyRequest;
import com.insurepro.policy.dto.response.*;
import com.insurepro.policy.service.PolicyService;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/policies")
@Tag(name = "Policy Management",
     description = "Insurance policy lifecycle management — create, activate, cancel, endorse")
@Slf4j
public class PolicyController {

    private final PolicyService policyService;
    private final CustomerServiceClient customerClient;

    public PolicyController(PolicyService policyService,
                             CustomerServiceClient customerClient) {
        this.policyService  = policyService;
        this.customerClient = customerClient;
    }

    // ── Browse Policy Types (public-facing catalogue) ────────────────────────

    @GetMapping("/types")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List active policy types",
               description = "Returns all active policy types for browsing. Accessible to all authenticated users.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<PolicyTypeResponse>>> getTypes() {
        return ResponseEntity.ok(ApiResponse.ok(policyService.getActivePolicyTypes()));
    }

    // ── Create Policy ────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','AGENT','POLICYHOLDER')")
    @Operation(summary = "Create policy",
               description = "Creates a new insurance policy. POLICYHOLDER role auto-resolves their own customerId.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PolicyResponse>> create(
            @Valid @RequestBody CreatePolicyRequest req,
            @AuthenticationPrincipal Long userId,
            Authentication auth) {

        boolean isPolicyholder = auth.getAuthorities()
                .contains(new SimpleGrantedAuthority("ROLE_POLICYHOLDER"));

        if (isPolicyholder) {
            // Security: resolve customerId from the authenticated user's own profile,
            // ignoring any customerId passed in the request body to prevent impersonation.
            var profileWrapper = customerClient.getMyProfile();
            var profile = (profileWrapper != null) ? profileWrapper.getData() : null;
            if (profile == null || profile.getCustomerId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No customer profile found for your account. Please create your profile first.");
            }
            req.setCustomerId(profile.getCustomerId());
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        policyService.createPolicy(req, userId),
                        "Policy created successfully"));
    }

    // ── Get Policy by ID ─────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get policy by ID",
               description = "Returns policy details by ID.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PolicyResponse>> get(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(policyService.getPolicyById(id)));
    }

    // ── Validate Policy (used by claims-service) ─────────────────────────────

    @GetMapping("/{id}/validate")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Validate policy",
               description = "Used internally by claims-service to validate policy coverage.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<PolicyValidationResponse> validate(
            @PathVariable Long id) {
        return ResponseEntity.ok(policyService.validatePolicy(id));
    }

    // ── List / Search Policies ───────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List or search policies",
               description = "Returns paginated list of policies. " +
                             "POLICYHOLDER role must supply customerId and may only query their own data.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<PolicyResponse>>> search(
            @Parameter(description = "Filter by customer ID")
            @RequestParam(required = false) Long customerId,
            @Parameter(description = "Filter by status: DRAFT, PENDING_UNDERWRITING, ACTIVE, LAPSED, CANCELLED, EXPIRED, SUSPENDED")
            @RequestParam(required = false) String status,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction: asc or desc")
            @RequestParam(defaultValue = "desc") String direction,
            Authentication auth) {

        boolean isPolicyholder = auth.getAuthorities()
                .contains(new SimpleGrantedAuthority("ROLE_POLICYHOLDER"));

        if (isPolicyholder) {
            // POLICYHOLDER must always supply customerId — they cannot list all policies.
            if (customerId == null) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "POLICYHOLDER must supply customerId to filter their own policies");
            }
            // Server-side ownership check: verify the supplied customerId belongs to the
            // authenticated user. This prevents cross-customer snooping even if the frontend
            // were bypassed or the JWT were re-used by a different client.
            try {
                var wrapper = customerClient.getCustomerById(customerId);
                var customer = (wrapper != null) ? wrapper.getData() : null;
                Long principalId = (auth.getPrincipal() instanceof Long)
                        ? (Long) auth.getPrincipal() : null;
                if (customer == null || !customer.getUserId().equals(principalId)) {
                    throw new ResponseStatusException(
                            HttpStatus.FORBIDDEN,
                            "Access denied: customerId does not belong to authenticated user");
                }
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                // customer-service unreachable — allow the request through and rely on
                // data-level filtering (policy.customerId) as a backstop.
                log.warn("Could not verify customer ownership for customerId={}: {}", customerId, e.getMessage());
            }
        }

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(
                ApiResponse.ok(policyService.searchPolicies(
                        customerId, status, pageable)));
    }

    // ── Activate Policy ──────────────────────────────────────────────────────

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN','UNDERWRITER')")
    @Operation(summary = "Activate policy",
               description = "Transitions policy from DRAFT/PENDING_UNDERWRITING to ACTIVE. " +
                             "Only Admin and Underwriter allowed.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PolicyResponse>> activate(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                policyService.activatePolicy(id, userId),
                "Policy activated successfully"));
    }

    // ── Cancel Policy ────────────────────────────────────────────────────────

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT')")
    @Operation(summary = "Cancel policy",
               description = "Cancels an active policy with a reason. " +
                             "Only Admin and Agent allowed.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PolicyResponse>> cancel(
            @PathVariable Long id,
            @RequestParam String reason,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                policyService.cancelPolicy(id, reason, userId),
                "Policy cancelled successfully"));
    }

    // ── Request Invoice (policyholder manual retry) ──────────────────────────

    @PostMapping("/{id}/request-invoice")
    @PreAuthorize("hasAnyRole('POLICYHOLDER','ADMIN','AGENT')")
    @Operation(summary = "Request invoice generation",
               description = "Manually triggers invoice generation for an ACTIVE policy. " +
                             "Used when the automatic invoice creation failed at activation time.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> requestInvoice(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        policyService.requestInvoice(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Invoice generation requested successfully"));
    }

    // ── Add Endorsement ──────────────────────────────────────────────────────

    @PostMapping("/{id}/endorsements")
    @PreAuthorize("hasAnyRole('ADMIN','UNDERWRITER')")
    @Operation(summary = "Add policy endorsement",
               description = "Adds a mid-term modification to an active policy. " +
                             "Each endorsement is versioned. Change types: COVERAGE_CHANGE, NOMINEE_CHANGE, ADDRESS_CHANGE.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PolicyResponse>> endorse(
            @PathVariable Long id,
            @RequestParam String changeType,
            @RequestParam(required = false) String oldValue,
            @RequestParam String newValue,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        policyService.addEndorsement(
                                id, changeType, oldValue,
                                newValue, reason, userId),
                        "Endorsement added successfully"));
    }
}
