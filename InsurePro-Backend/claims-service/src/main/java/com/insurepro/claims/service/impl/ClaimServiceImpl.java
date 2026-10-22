package com.insurepro.claims.service.impl;

import com.insurepro.claims.client.AuditServiceClient;
import com.insurepro.claims.client.PolicyServiceClient;
import com.insurepro.claims.dto.request.*;
import com.insurepro.claims.dto.response.*;
import com.insurepro.claims.entity.*;
import com.insurepro.claims.event.EventPublisher;
import com.insurepro.claims.exception.*;
import com.insurepro.claims.repository.*;
import com.insurepro.claims.service.ClaimService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@Slf4j
public class ClaimServiceImpl implements ClaimService {

    private final ClaimRepository claimRepo;
    private final SettlementRepository settlementRepo;
    private final ClaimNoteRepository noteRepo;
    private final ClaimDisputeRepository disputeRepo;
    private final PolicyServiceClient policyClient;
    private final EventPublisher eventPublisher;
    private final AuditServiceClient auditClient;

    public ClaimServiceImpl(
            ClaimRepository claimRepo,
            SettlementRepository settlementRepo,
            ClaimNoteRepository noteRepo,
            ClaimDisputeRepository disputeRepo,
            PolicyServiceClient policyClient,
            EventPublisher eventPublisher,
            AuditServiceClient auditClient) {
        this.claimRepo      = claimRepo;
        this.settlementRepo = settlementRepo;
        this.noteRepo       = noteRepo;
        this.disputeRepo    = disputeRepo;
        this.policyClient   = policyClient;
        this.eventPublisher = eventPublisher;
        this.auditClient    = auditClient;
    }

    //  Submit Claim 

    @Override
    @Transactional
    public ClaimResponse submitClaim(SubmitClaimRequest req,
                                      Long submittedBy) {
        // Validate policy
        var policy = policyClient.validatePolicy(req.getPolicyId());
        if (!policy.isActive())
            throw new BusinessRuleException(
                    "Policy is not active: " + req.getPolicyId());

        if (req.getIncidentDate().isBefore(policy.getStartDate())
                || req.getIncidentDate().isAfter(policy.getEndDate()))
            throw new BusinessRuleException(
                    "Incident date outside policy coverage period");

        if (policy.getCoverageAmount() != null
                && req.getAmountRequested()
                        .compareTo(policy.getCoverageAmount()) > 0)
            throw new BusinessRuleException(
                    "Claim amount Rs." + req.getAmountRequested()
                    + " exceeds policy coverage limit Rs."
                    + policy.getCoverageAmount());

        String claimNumber = generateClaimNumber();

        Claim claim = Claim.builder()
                .claimNumber(claimNumber)
                .policyId(req.getPolicyId())
                .customerId(submittedBy)
                .claimDate(LocalDate.now())
                .incidentDate(req.getIncidentDate())
                .claimType(Claim.ClaimType.valueOf(
                        req.getClaimType().toUpperCase()))
                .description(req.getDescription())
                .amountRequested(req.getAmountRequested())
                .status(Claim.ClaimStatus.SUBMITTED)
                .build();

        claim = claimRepo.save(claim);

        // Synchronous compliance audit write — must persist before returning.
        try {
            auditClient.writeAuditLog(submittedBy, String.valueOf(submittedBy),
                    "CLAIM_SUBMITTED", "claims",
                    String.valueOf(claim.getClaimId()), "claims-service",
                    "Claim " + claimNumber + " submitted for policyId=" + req.getPolicyId());
        } catch (Exception e) {
            log.error("Sync audit write failed for CLAIM_SUBMITTED: {}", e.getMessage());
        }

        eventPublisher.publishAuditEvent(
                String.valueOf(submittedBy),
                "CLAIM_SUBMITTED", "claims",
                String.valueOf(claim.getClaimId()),
                "Claim: " + claimNumber);

        // Notify the policyholder that their claim was received
        eventPublisher.publishNotificationEvent(
                String.valueOf(submittedBy),
                "✅ Your claim " + claimNumber + " has been submitted successfully. "
                + "Amount requested: ₹" + req.getAmountRequested() + ". "
                + "An adjuster will be assigned and you will be notified of any updates.",
                "CLAIMS");

        log.info("Claim submitted: {}", claimNumber);
        return toResponse(claim);
    }

    // Get Claim by ID 

    @Override
    @Transactional(readOnly = true)
    public ClaimResponse getClaimById(Long claimId, Long userId,
                                       String role) {
        Claim claim = claimRepo
                .findByClaimIdAndDeletedFalse(claimId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Claim not found: " + claimId));

        if (role.equals("ROLE_POLICYHOLDER")
                && !claim.getCustomerId().equals(userId))
            throw new BusinessRuleException(
                    "Access denied to this claim");

        return toResponse(claim);
    }

    // Get Claim by Number

    @Override
    @Transactional(readOnly = true)
    public ClaimResponse getClaimByNumber(String claimNumber) {
        Claim claim = claimRepo
                .findByClaimNumberAndDeletedFalse(claimNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Claim not found: " + claimNumber));
        return toResponse(claim);
    }

    //  Search Claims

    @Override
    @Transactional(readOnly = true)
    public Page<ClaimResponse> searchClaims(Long customerId,
                                             Long policyId,
                                             String status,
                                             Long adjusterId,
                                             Pageable pageable) {
        Claim.ClaimStatus cs = null;
        if (status != null && !status.isBlank()) {
            try {
                cs = Claim.ClaimStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessRuleException(
                        "Invalid status: " + status);
            }
        }
        return claimRepo.search(customerId, policyId, cs,
                adjusterId, pageable).map(this::toResponse);
    }

    // Update Status

    @Override
    @Transactional
    public ClaimResponse updateStatus(Long claimId,
                                       UpdateClaimStatusRequest req,
                                       Long actorId) {
        Claim claim = claimRepo
                .findByClaimIdAndDeletedFalse(claimId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Claim not found: " + claimId));

        Claim.ClaimStatus newStatus = Claim.ClaimStatus.valueOf(
                req.getStatus().toUpperCase());
        claim.setStatus(newStatus);
        claimRepo.save(claim);

        // Create settlement on approval
        if (newStatus == Claim.ClaimStatus.APPROVED
                || newStatus == Claim.ClaimStatus.PARTIALLY_APPROVED) {

            // Use approvedAmount field from request
            BigDecimal approved = req.getApprovedAmount() != null
                    ? req.getApprovedAmount()
                    : claim.getAmountRequested();

            BigDecimal deductible = req.getDeductibleAmount() != null
                    ? req.getDeductibleAmount()
                    : BigDecimal.ZERO;

            // Guard: deductible cannot be negative
            if (deductible.compareTo(BigDecimal.ZERO) < 0)
                throw new BusinessRuleException("Deductible amount cannot be negative.");

            // Guard: deductible cannot exceed the approved amount (net payout must be >= 0)
            if (deductible.compareTo(approved) > 0)
                throw new BusinessRuleException(
                        "Deductible (Rs." + deductible + ") cannot exceed the approved amount (Rs." + approved + ").");

            Settlement settlement = Settlement.builder()
                    .claimId(claimId)
                    .amountApproved(approved)
                    .deductibleApplied(deductible)
                    .approvedBy(String.valueOf(actorId))
                    .settlementDate(LocalDate.now())
                    .remarks(req.getRemarks())
                    .status(Settlement.SettlementStatus.PENDING)
                    .build();
            settlementRepo.save(settlement);

        }

        eventPublisher.publishAuditEvent(
                String.valueOf(actorId), "CLAIM_STATUS_UPDATED",
                "claims", String.valueOf(claimId),
                "Status: " + newStatus.name());

        // Notify the policyholder of the claim outcome
        String claimNotifMsg = null;
        switch (newStatus) {
            case APPROVED -> {
                BigDecimal approvedAmt = req.getApprovedAmount() != null
                        ? req.getApprovedAmount() : claim.getAmountRequested();
                BigDecimal deductible  = req.getDeductibleAmount() != null
                        ? req.getDeductibleAmount() : BigDecimal.ZERO;
                BigDecimal netPayout   = approvedAmt.subtract(deductible);
                String appRemarks      = (req.getRemarks() != null && !req.getRemarks().isBlank())
                        ? " Remarks: " + req.getRemarks() + "." : "";
                claimNotifMsg = "✅ Your claim " + claim.getClaimNumber() + " has been fully approved. "
                        + "Requested: Rs." + claim.getAmountRequested()
                        + " | Approved: Rs." + approvedAmt
                        + (deductible.compareTo(BigDecimal.ZERO) > 0
                                ? " | Deductible: Rs." + deductible + " | Net Payout: Rs." + netPayout
                                : "")
                        + "." + appRemarks
                        + " Payment will be processed shortly.";
            }
            case PARTIALLY_APPROVED -> {
                BigDecimal partialAmt  = req.getApprovedAmount() != null
                        ? req.getApprovedAmount() : claim.getAmountRequested();
                BigDecimal deductible  = req.getDeductibleAmount() != null
                        ? req.getDeductibleAmount() : BigDecimal.ZERO;
                BigDecimal netPayout   = partialAmt.subtract(deductible);
                String partRemarks     = (req.getRemarks() != null && !req.getRemarks().isBlank())
                        ? " Remarks: " + req.getRemarks() + "." : "";
                claimNotifMsg = "⚠️ Your claim " + claim.getClaimNumber() + " has been partially approved. "
                        + "Requested: Rs." + claim.getAmountRequested()
                        + " | Approved: Rs." + partialAmt
                        + (deductible.compareTo(BigDecimal.ZERO) > 0
                                ? " | Deductible: Rs." + deductible + " | Net Payout: Rs." + netPayout
                                : "")
                        + "." + partRemarks
                        + " You may raise a dispute if you disagree with this decision.";
            }
            case REJECTED -> {
                String rejReason = req.getRemarks() != null && !req.getRemarks().isBlank()
                        ? " Reason: " + req.getRemarks() : "";
                claimNotifMsg = "❌ Your claim " + claim.getClaimNumber() + " has been rejected." + rejReason
                        + " You may raise a dispute if you disagree with this decision.";
            }
            case UNDER_REVIEW ->
                claimNotifMsg = "🔄 Your claim " + claim.getClaimNumber()
                        + " is now under review by our claims team.";
            case CLOSED ->
                claimNotifMsg = "Your claim " + claim.getClaimNumber() + " has been closed.";
            default -> { /* no notification for internal status transitions */ }
        }
        if (claimNotifMsg != null) {
            eventPublisher.publishNotificationEvent(
                    String.valueOf(claim.getCustomerId()), claimNotifMsg, "CLAIMS");
        }

        log.info("Claim status updated: id={}, status={}",
                claimId, newStatus);
        return toResponse(claim);
    }

    //  Assign Adjuster 

    @Override
    @Transactional
    public ClaimResponse assignAdjuster(Long claimId, Long adjusterId) {
        Claim claim = claimRepo
                .findByClaimIdAndDeletedFalse(claimId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Claim not found: " + claimId));
        claim.setAssignedAdjusterId(adjusterId);
        claim.setStatus(Claim.ClaimStatus.UNDER_REVIEW);
        claimRepo.save(claim);

        // Notify the policyholder that their claim is being reviewed
        eventPublisher.publishNotificationEvent(
                String.valueOf(claim.getCustomerId()),
                "🔄 An adjuster has been assigned to your claim " + claim.getClaimNumber()
                + ". Your claim is now under review. You will be notified once a decision is made.",
                "CLAIMS");

        // Notify the adjuster of their new assignment
        eventPublisher.publishNotificationEvent(
                String.valueOf(adjusterId),
                "📋 You have been assigned to review claim " + claim.getClaimNumber()
                + ". Please review the claim details and take action.",
                "CLAIMS");

        log.info("Adjuster {} assigned to claim {}",
                adjusterId, claimId);
        return toResponse(claim);
    }

    //  Add Note

    @Override
    @Transactional
    public ClaimNoteResponse addNote(Long claimId,
                                      AddNoteRequest req,
                                      Long authorId,
                                      String authorRole) {
        claimRepo.findByClaimIdAndDeletedFalse(claimId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Claim not found: " + claimId));

        boolean isInternal = req.isInternal()
                && !authorRole.equals("ROLE_POLICYHOLDER");

        ClaimNote note = ClaimNote.builder()
                .claimId(claimId)
                .authorUserId(authorId)
                .noteText(req.getNoteText())
                .internal(isInternal)
                .build();

        note = noteRepo.save(note);
        return toNoteResponse(note);
    }

    // Get Notes
    @Override
    @Transactional(readOnly = true)
    public Page<ClaimNoteResponse> getNotes(Long claimId,
                                             boolean includeInternal,
                                             Pageable pageable) {
        // Use correct repository method: findByClaim
        return noteRepo.findByClaim(claimId, includeInternal, pageable)
                .map(this::toNoteResponse);
    }

    // Get Settlement

    @Override
    @Transactional(readOnly = true)
    public SettlementResponse getSettlement(Long claimId) {
        // Use correct repository method: findTopByClaimIdOrderByCreatedAtDesc
        Settlement s = settlementRepo
                .findTopByClaimIdOrderByCreatedAtDesc(claimId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Settlement not found for claim: " + claimId));
        return toSettlementResponse(s);
    }
    
    @Override
    @Transactional
    public SettlementResponse settlePayment(Long claimId, Long actorId) {

        Settlement s = settlementRepo
                .findTopByClaimIdOrderByCreatedAtDesc(claimId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Settlement not found for claim: " + claimId));

        if (s.getStatus() != Settlement.SettlementStatus.PENDING) {
            throw new BusinessRuleException(
                    "Settlement is already " + s.getStatus().name());
        }

        Claim claim = claimRepo
                .findByClaimIdAndDeletedFalse(claimId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Claim not found: " + claimId));

        s.setStatus(Settlement.SettlementStatus.SETTLED);
        settlementRepo.save(s);

        claim.setStatus(Claim.ClaimStatus.SETTLED);
        claimRepo.save(claim);

        BigDecimal netPayout = s.getAmountApproved()
                .subtract(s.getDeductibleApplied());

        eventPublisher.publishNotificationEvent(
                String.valueOf(claim.getCustomerId()),
                "✅ Your claim " + claim.getClaimNumber()
                + " has been settled. Net payout: ₹" + netPayout,
                "CLAIMS");

        eventPublisher.publishAuditEvent(
                String.valueOf(actorId),
                "SETTLEMENT_COMPLETED", "claims",
                String.valueOf(claimId),
                "Settled by: " + actorId);

        log.info("Settlement completed: claimId={}", claimId);
        return toSettlementResponse(s);
    }

    // Raise Dispute

    @Override
    @Transactional
    public ClaimResponse raiseDispute(Long claimId, String reason,
                                       Long raisedBy) {
        Claim claim = claimRepo
                .findByClaimIdAndDeletedFalse(claimId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Claim not found: " + claimId));

        if (claim.getStatus() != Claim.ClaimStatus.REJECTED
                && claim.getStatus()
                != Claim.ClaimStatus.PARTIALLY_APPROVED)
            throw new BusinessRuleException(
                    "Dispute only allowed on REJECTED or "
                    + "PARTIALLY_APPROVED claims");

        ClaimDispute dispute = ClaimDispute.builder()
                .claimId(claimId)
                .raisedByUserId(raisedBy)
                .reason(reason)
                .status(ClaimDispute.DisputeStatus.OPEN)
                .build();
        disputeRepo.save(dispute);

        claim.setStatus(Claim.ClaimStatus.DISPUTED);
        claimRepo.save(claim);

        // Notify the assigned adjuster that a dispute was raised
        if (claim.getAssignedAdjusterId() != null) {
            eventPublisher.publishNotificationEvent(
                    String.valueOf(claim.getAssignedAdjusterId()),
                    "⚠️ A dispute has been raised on claim " + claim.getClaimNumber()
                    + ". Please review the dispute reason and take appropriate action.",
                    "CLAIMS");
        }

        log.info("Dispute raised for claim: {}", claimId);
        return toResponse(claim);
    }

    //  Private Helpers 

    private String generateClaimNumber() {
        String yearMonth = LocalDate.now().getYear()
                + String.format("%02d",
                        LocalDate.now().getMonthValue());
        long count = claimRepo.count() + 1;
        return String.format("CLM-%s-%07d", yearMonth, count);
    }

    private ClaimResponse toResponse(Claim c) {
        return ClaimResponse.builder()
                .claimId(c.getClaimId())
                .claimNumber(c.getClaimNumber())
                .policyId(c.getPolicyId())
                .customerId(c.getCustomerId())
                .claimDate(c.getClaimDate())
                .incidentDate(c.getIncidentDate())
                .claimType(c.getClaimType().name())
                .description(c.getDescription())
                .amountRequested(c.getAmountRequested())
                .status(c.getStatus().name())
                .assignedAdjusterId(c.getAssignedAdjusterId())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ClaimNoteResponse toNoteResponse(ClaimNote n) {
        return ClaimNoteResponse.builder()
                .noteId(n.getNoteId())
                .claimId(n.getClaimId())
                .authorUserId(n.getAuthorUserId())
                .noteText(n.getNoteText())
                .internal(n.isInternal())
                .createdAt(n.getCreatedAt())
                .build();
    }

    private SettlementResponse toSettlementResponse(Settlement s) {
        return SettlementResponse.builder()
                .settlementId(s.getSettlementId())
                .claimId(s.getClaimId())
                .amountApproved(s.getAmountApproved())
                .deductibleApplied(s.getDeductibleApplied())
                .approvedBy(s.getApprovedBy())
                .settlementDate(s.getSettlementDate())
                .remarks(s.getRemarks())
                .status(s.getStatus().name())
                .createdAt(s.getCreatedAt())
                .build();
    }
}