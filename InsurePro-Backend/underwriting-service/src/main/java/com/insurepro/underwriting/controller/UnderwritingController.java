package com.insurepro.underwriting.controller;

import com.insurepro.underwriting.dto.request.InitiateUnderwritingRequest;
import com.insurepro.underwriting.dto.response.*;
import com.insurepro.underwriting.service.UnderwritingService;
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
@RequestMapping("/api/v1/underwriting")
@Tag(name = "Underwriting",
     description = "Risk assessment, underwriting decisions and policy approval workflows")
@PreAuthorize("hasAnyRole('ADMIN','UNDERWRITER','AGENT','POLICYHOLDER')")
@Slf4j
public class UnderwritingController {

    private final UnderwritingService uwService;

    public UnderwritingController(UnderwritingService uwService) {
        this.uwService = uwService;
    }

    // ── Initiate Underwriting ────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Initiate underwriting",
               description = "Initiates underwriting risk assessment for a policy. " +
                             "Admin and Underwriter only.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UnderwritingResponse>> initiate(
            @Valid @RequestBody InitiateUnderwritingRequest req,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        uwService.initiateUnderwriting(req, userId),
                        "Underwriting initiated successfully"));
    }

    // ── Get by Policy ID ─────────────────────────────────────────────────────

    @GetMapping("/policy/{policyId}")
    @Operation(summary = "Get underwriting by policy ID",
               description = "Returns underwriting details for a specific policy.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UnderwritingResponse>> byPolicy(
            @PathVariable Long policyId) {
        return ResponseEntity.ok(
                ApiResponse.ok(uwService.getByPolicyId(policyId)));
    }

    // ── Get by ID ────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get underwriting by ID",
               description = "Returns underwriting request details by ID.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UnderwritingResponse>> get(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.ok(uwService.getById(id)));
    }

    // ── List by Status ───────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List underwriting requests",
               description = "Returns paginated list of underwriting requests. " +
                             "Filter by status.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<UnderwritingResponse>>> list(
            @Parameter(description = "Filter by status: PENDING, AUTO_APPROVED, " +
                                     "REFERRED, APPROVED, DECLINED")
            @RequestParam(required = false) String status,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort direction: asc or desc")
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by("createdAt").ascending()
                : Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(ApiResponse.ok(
                uwService.listByStatus(status, pageable)));
    }

    // ── Make Decision ────────────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN','UNDERWRITER')")  
    @PostMapping("/{id}/decision")
    @Operation(summary = "Make underwriting decision",
               description = "Underwriter approves or declines a referred policy. " +
                             "Valid decisions: APPROVED, DECLINED.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UnderwritingResponse>> decide(
            @PathVariable Long id,
            @Parameter(description = "Decision: APPROVED or DECLINED")
            @RequestParam String decision,
            @Parameter(description = "Remarks explaining the decision")
            @RequestParam(required = false) String remarks,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                uwService.makeDecision(id, decision, remarks, userId),
                "Decision recorded successfully"));
    }
}