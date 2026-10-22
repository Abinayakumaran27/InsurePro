package com.insurepro.underwriting.service.impl;
import com.insurepro.underwriting.dto.request.InitiateUnderwritingRequest;
import com.insurepro.underwriting.dto.response.UnderwritingResponse;
import com.insurepro.underwriting.engine.RiskScoringEngine;
import com.insurepro.underwriting.entity.UnderwritingRequest;
import com.insurepro.underwriting.event.EventPublisher;
import com.insurepro.underwriting.exception.*;
import com.insurepro.underwriting.repository.UnderwritingRequestRepository;
import com.insurepro.underwriting.service.UnderwritingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
@Service @Slf4j
public class UnderwritingServiceImpl implements UnderwritingService {
    private final UnderwritingRequestRepository uwRepo;
    private final RiskScoringEngine riskEngine;
    private final EventPublisher eventPublisher;
    public UnderwritingServiceImpl(UnderwritingRequestRepository uwRepo, RiskScoringEngine riskEngine, EventPublisher eventPublisher) {
        this.uwRepo = uwRepo; this.riskEngine = riskEngine; this.eventPublisher = eventPublisher;
    }
    @Override @Transactional
    public UnderwritingResponse initiateUnderwriting(InitiateUnderwritingRequest req, Long actorId) {
        log.info("Action=INITIATE_UNDERWRITING, policyId={}", req.getPolicyId());
        RiskScoringEngine.RiskAssessment assessment = riskEngine.assess(req);
        UnderwritingRequest uw = UnderwritingRequest.builder()
            .policyId(req.getPolicyId()).customerId(req.getCustomerId()).policyTypeId(req.getPolicyTypeId())
            .riskScore(assessment.score()).status(assessment.status())
            .decisionRemarks(assessment.remarks()).decidedAt(LocalDateTime.now()).build();
        if (assessment.status() == UnderwritingRequest.UWStatus.REFERRED) {
            uw.setDecidedAt(null);
        }
        uw = uwRepo.save(uw);
        eventPublisher.publishAuditEvent(String.valueOf(actorId), "UNDERWRITING_INITIATED", "underwriting", String.valueOf(uw.getRequestId()), "Score: " + assessment.score() + " Decision: " + assessment.status());

        // Notify based on the auto-decision outcome
        switch (assessment.status()) {
            case AUTO_APPROVED -> {
                // Notify the agent/admin who initiated
                eventPublisher.publishNotificationEvent(String.valueOf(actorId),
                        "✅ Underwriting auto-approved for policy #" + req.getPolicyId()
                        + " (Risk score: " + assessment.score() + "). You may now activate the policy.",
                        "UNDERWRITING");
                // Notify the customer
                eventPublisher.publishNotificationEvent(String.valueOf(req.getCustomerId()),
                        "✅ Your policy application has been automatically approved by our risk assessment engine. "
                        + "Your agent will activate the policy shortly.",
                        "UNDERWRITING");
            }
            case AUTO_DECLINED -> {
                eventPublisher.publishNotificationEvent(String.valueOf(actorId),
                        "❌ Underwriting auto-declined for policy #" + req.getPolicyId()
                        + " (Risk score: " + assessment.score() + "). "
                        + (assessment.remarks() != null ? "Reason: " + assessment.remarks() : ""),
                        "UNDERWRITING");
                eventPublisher.publishNotificationEvent(String.valueOf(req.getCustomerId()),
                        "❌ Your policy application could not be approved after risk assessment. "
                        + "Please contact your agent for further assistance.",
                        "UNDERWRITING");
            }
            case REFERRED -> {
                // Notify the initiating agent/admin that manual review is required
                eventPublisher.publishNotificationEvent(String.valueOf(actorId),
                        "🔄 Underwriting for policy #" + req.getPolicyId()
                        + " requires manual review (Risk score: " + assessment.score()
                        + "). An underwriter will review and make a decision.",
                        "UNDERWRITING");
            }
            default -> { /* PENDING / IN_REVIEW — no notification needed */ }
        }
        return toResponse(uw);
    }
    @Override @Transactional(readOnly=true)
    public UnderwritingResponse getByPolicyId(Long policyId) {
        return toResponse(uwRepo.findByPolicyIdAndDeletedFalse(policyId)
            .orElseThrow(() -> new ResourceNotFoundException("Underwriting request not found for policy: " + policyId)));
    }
    @Override @Transactional(readOnly=true)
    public UnderwritingResponse getById(Long id) {
        return toResponse(uwRepo.findByRequestIdAndDeletedFalse(id)
            .orElseThrow(() -> new ResourceNotFoundException("Underwriting request not found: " + id)));
    }
    @Override @Transactional(readOnly=true)
    public Page<UnderwritingResponse> listByStatus(String status, Pageable pageable) {
        if (status != null) return uwRepo.findByStatusAndDeletedFalse(UnderwritingRequest.UWStatus.valueOf(status.toUpperCase()), pageable).map(this::toResponse);
        return uwRepo.findAll(pageable).map(this::toResponse);
    }
    @Override @Transactional
    public UnderwritingResponse makeDecision(Long requestId, String decision, String remarks, Long actorId) {
        UnderwritingRequest uw = uwRepo.findByRequestIdAndDeletedFalse(requestId)
            .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + requestId));
        if (uw.getStatus() != UnderwritingRequest.UWStatus.REFERRED && uw.getStatus() != UnderwritingRequest.UWStatus.IN_REVIEW)
            throw new BusinessRuleException("Cannot make decision on request in status: " + uw.getStatus());
        UnderwritingRequest.UWStatus newDecision = UnderwritingRequest.UWStatus.valueOf(decision.toUpperCase());
        uw.setStatus(newDecision);
        uw.setDecisionRemarks(remarks); uw.setDecidedAt(LocalDateTime.now()); uw.setReferredToUserId(actorId);
        eventPublisher.publishAuditEvent(String.valueOf(actorId), "UNDERWRITING_DECISION", "underwriting", String.valueOf(requestId), "Decision: " + decision);

        // Notify the underwriter who made the decision (confirmation)
        // and the customer about the outcome
        if (newDecision == UnderwritingRequest.UWStatus.APPROVED) {
            eventPublisher.publishNotificationEvent(String.valueOf(actorId),
                    "✅ You have approved the underwriting request for policy #" + uw.getPolicyId()
                    + ". The policy can now be activated.",
                    "UNDERWRITING");
            eventPublisher.publishNotificationEvent(String.valueOf(uw.getCustomerId()),
                    "✅ Your policy application has been approved by our underwriting team. "
                    + "Your agent will activate the policy shortly.",
                    "UNDERWRITING");
        } else if (newDecision == UnderwritingRequest.UWStatus.DECLINED) {
            String remarkText = (remarks != null && !remarks.isBlank()) ? " Reason: " + remarks : "";
            eventPublisher.publishNotificationEvent(String.valueOf(actorId),
                    "❌ You have declined the underwriting request for policy #" + uw.getPolicyId() + ".",
                    "UNDERWRITING");
            eventPublisher.publishNotificationEvent(String.valueOf(uw.getCustomerId()),
                    "❌ Your policy application has been declined by our underwriting team." + remarkText
                    + " Please contact your agent for further assistance.",
                    "UNDERWRITING");
        }
        return toResponse(uwRepo.save(uw));
    }
    private UnderwritingResponse toResponse(UnderwritingRequest u) {
        return UnderwritingResponse.builder().requestId(u.getRequestId()).policyId(u.getPolicyId())
            .customerId(u.getCustomerId()).riskScore(u.getRiskScore()).status(u.getStatus().name())
            .decisionRemarks(u.getDecisionRemarks()).referredToUserId(u.getReferredToUserId())
            .decidedAt(u.getDecidedAt()).createdAt(u.getCreatedAt()).build();
    }
}
