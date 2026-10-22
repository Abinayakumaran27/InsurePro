package com.insurepro.claims.controller;

import com.insurepro.claims.dto.request.*;
import com.insurepro.claims.dto.response.*;
import com.insurepro.claims.service.ClaimService;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/claims")
@Tag(name = "Claims Management",
     description = "Claims submission, adjudication, settlement and dispute management")
@Slf4j
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    //  Submit Claim

    @PostMapping
    @PreAuthorize("hasAnyRole('POLICYHOLDER','AGENT','ADMIN')")
    @Operation(summary = "Submit claim",
               description = "Policyholder or agent submits a new insurance claim.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClaimResponse>> submit(
            @Valid @RequestBody SubmitClaimRequest req,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        claimService.submitClaim(req, userId),
                        "Claim submitted successfully"));
    }

    // Get Claim by ID

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get claim by ID",
               description = "Returns claim details. Policyholders can only view own claims.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClaimResponse>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        String role = SecurityContextHolder.getContext()
                .getAuthentication().getAuthorities()
                .iterator().next().getAuthority();
        return ResponseEntity.ok(
                ApiResponse.ok(claimService.getClaimById(id, userId, role)));
    }

    // List / Search Claims

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List or search claims",
               description = "Returns paginated claims. Filter by customerId, policyId, status or adjusterId. " +
                             "For POLICYHOLDER role, customerId is always overridden to the authenticated user's ID.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<ClaimResponse>>> search(
            @Parameter(description = "Filter by customer ID (ignored for policyholders — their own ID is always used)")
            @RequestParam(required = false) Long customerId,
            @Parameter(description = "Filter by policy ID")
            @RequestParam(required = false) Long policyId,
            @Parameter(description = "Filter by status: SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SETTLED")
            @RequestParam(required = false) String status,
            @Parameter(description = "Filter by adjuster ID")
            @RequestParam(required = false) Long adjusterId,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction: asc or desc")
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal Long userId) {

        // Policyholders may only see their own claims — override any supplied customerId.
        String role = SecurityContextHolder.getContext()
                .getAuthentication().getAuthorities()
                .iterator().next().getAuthority();
        Long effectiveCustomerId = "ROLE_POLICYHOLDER".equals(role) ? userId : customerId;

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(ApiResponse.ok(
                claimService.searchClaims(
                        effectiveCustomerId, policyId, status, adjusterId, pageable)));
    }

    //  Update Claim Status 

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADJUSTER','ADMIN')")
    @Operation(summary = "Update claim status",
               description = "Adjuster approves, rejects or updates claim status.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClaimResponse>> updateStatus(
            @PathVariable Long id,
            @Valid
            @RequestBody UpdateClaimStatusRequest req,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                claimService.updateStatus(id, req, userId),
                "Status updated successfully"));
    }

    // Assign Adjuster 

    @PatchMapping("/{id}/assign/{adjusterId}")
    @PreAuthorize("hasAnyRole('ADMIN','ADJUSTER')")
    @Operation(summary = "Assign adjuster to claim",
               description = "Assigns a claims adjuster to review the claim.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClaimResponse>> assign(
            @PathVariable Long id,
            @PathVariable Long adjusterId) {
        return ResponseEntity.ok(ApiResponse.ok(
                claimService.assignAdjuster(id, adjusterId),
                "Adjuster assigned successfully"));
    }

    // Add Note 

    @PostMapping("/{id}/notes")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add note to claim",
               description = "Add internal or external note to claim. " +
                             "Internal notes not visible to policyholders.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClaimNoteResponse>> addNote(
            @PathVariable Long id,
            @Valid @RequestBody AddNoteRequest req,
            @AuthenticationPrincipal Long userId) {
        String role = SecurityContextHolder.getContext()
                .getAuthentication().getAuthorities()
                .iterator().next().getAuthority();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        claimService.addNote(id, req, userId, role),
                        "Note added successfully"));
    }

    // Get Notes 

    @GetMapping("/{id}/notes")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get claim notes",
               description = "Returns claim notes. Policyholders only see external notes.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<ClaimNoteResponse>>> notes(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size) {
        String role = SecurityContextHolder.getContext()
                .getAuthentication().getAuthorities()
                .iterator().next().getAuthority();
        Pageable pageable = PageRequest.of(page, size,
                Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(
                claimService.getNotes(
                        id, !role.equals("ROLE_POLICYHOLDER"), pageable)));
    }

    //  Get Settlement

    @GetMapping("/{id}/settlement")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get claim settlement details",
               description = "Returns settlement information for an approved claim.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<SettlementResponse>> settlement(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(claimService.getSettlement(id)));
    }
    
    
    @PatchMapping("/{id}/settlement/settle")
    @PreAuthorize("hasAnyRole('ADMIN','ADJUSTER')")
    @Operation(summary = "Settle a claim",
               description = "Admin or Adjuster marks the settlement as SETTLED.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<SettlementResponse>> settle(
            @PathVariable Long id,
            @AuthenticationPrincipal Long actorId) {
        return ResponseEntity.ok(ApiResponse.ok(
                claimService.settlePayment(id, actorId),
                "Settlement completed successfully"));
    }
    

    // Raise Dispute

    @PostMapping("/{id}/dispute")
    @PreAuthorize("hasAnyRole('POLICYHOLDER','AGENT')")
    @Operation(summary = "Raise dispute on claim",
               description = "Policyholder raises dispute on rejected or partially approved claim.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClaimResponse>> dispute(
            @PathVariable Long id,
            @Parameter(description = "Reason for dispute")
            @RequestParam String reason,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                claimService.raiseDispute(id, reason, userId),
                "Dispute raised successfully"));
    }
}