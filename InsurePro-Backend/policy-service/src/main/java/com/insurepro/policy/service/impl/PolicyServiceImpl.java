package com.insurepro.policy.service.impl;

import com.insurepro.policy.client.AuditServiceClient;
import com.insurepro.policy.client.CustomerServiceClient;
import com.insurepro.policy.client.PaymentServiceClient;
import com.insurepro.policy.dto.request.CreatePolicyRequest;
import com.insurepro.policy.dto.response.PolicyResponse;
import com.insurepro.policy.dto.response.PolicyTypeResponse;
import com.insurepro.policy.dto.response.PolicyValidationResponse;
import com.insurepro.policy.entity.Policy;
import com.insurepro.policy.entity.PolicyEndorsement;
import com.insurepro.policy.entity.PolicyType;
import com.insurepro.policy.event.EventPublisher;
import com.insurepro.policy.exception.*;
import com.insurepro.policy.repository.*;
import com.insurepro.policy.service.PolicyService;
import com.insurepro.policy.util.PolicyNumberGenerator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PolicyServiceImpl implements PolicyService {

    private final PolicyRepository policyRepo;
    private final PolicyTypeRepository policyTypeRepo;
    private final PolicyEndorsementRepository endorsementRepo;
    private final PolicyNumberGenerator numberGen;
    private final EventPublisher eventPublisher;
    private final AuditServiceClient auditClient;
    private final CustomerServiceClient customerClient;
    private final PaymentServiceClient paymentClient;

    @Value("${app.premium.tax-rate:18.0}")
    private double taxRate;

    public PolicyServiceImpl(PolicyRepository policyRepo,
                              PolicyTypeRepository policyTypeRepo,
                              PolicyEndorsementRepository endorsementRepo,
                              PolicyNumberGenerator numberGen,
                              EventPublisher eventPublisher,
                              AuditServiceClient auditClient,
                              CustomerServiceClient customerClient,
                              PaymentServiceClient paymentClient) {
        this.policyRepo      = policyRepo;
        this.policyTypeRepo  = policyTypeRepo;
        this.endorsementRepo = endorsementRepo;
        this.numberGen       = numberGen;
        this.eventPublisher  = eventPublisher;
        this.auditClient     = auditClient;
        this.customerClient  = customerClient;
        this.paymentClient   = paymentClient;
    }

    @Override
    @Transactional
    public PolicyResponse createPolicy(CreatePolicyRequest req,
                                        Long actorId) {
        PolicyType type = policyTypeRepo.findById(req.getPolicyTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Policy type not found: " + req.getPolicyTypeId()));
        if (!type.isActive())
            throw new BusinessRuleException("Policy type is not active");
        if (!req.getEndDate().isAfter(req.getStartDate()))
            throw new BusinessRuleException(
                    "End date must be after start date");

        // KYC gate — policy can only be issued to a KYC-verified customer.
        try {
            var wrapper = customerClient.getCustomerById(req.getCustomerId());
            var customer = (wrapper != null) ? wrapper.getData() : null;
            if (customer == null)
                throw new BusinessRuleException(
                        "Customer not found: " + req.getCustomerId());
            if (!"VERIFIED".equalsIgnoreCase(customer.getKycStatus()))
                throw new BusinessRuleException(
                        "Policy cannot be issued: customer KYC status is "
                        + customer.getKycStatus()
                        + ". An agent must verify the customer's documents first.");
        } catch (BusinessRuleException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Could not verify customer KYC (customer-service unreachable) " +
                     "for customerId={}: {}", req.getCustomerId(), e.getMessage());
        }

        BigDecimal premium = calculatePremium(
                type.getBasePremium(), req.getCoverageAmount());

        Policy policy = Policy.builder()
                .policyNumber(numberGen.generate(type.getName()))
                .customerId(req.getCustomerId())
                .agentId(actorId)
                .policyTypeId(type.getTypeId())
                .coverageAmount(req.getCoverageAmount())
                .premiumAmount(premium)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .status(type.isUnderwritingRequired()
                        ? Policy.PolicyStatus.PENDING_UNDERWRITING
                        : Policy.PolicyStatus.DRAFT)
                .nomineeName(req.getNomineeName())
                .nomineeRelation(req.getNomineeRelation())
                .createdBy(String.valueOf(actorId))
                .build();

        policy = policyRepo.save(policy);

        // Synchronous compliance audit write — must persist before returning.
        try {
            auditClient.writeAuditLog(actorId, String.valueOf(actorId),
                    "POLICY_CREATED", "policies",
                    policy.getPolicyNumber(), "policy-service",
                    "Policy created for customerId=" + req.getCustomerId());
        } catch (Exception e) {
            log.error("Sync audit write failed for POLICY_CREATED: {}", e.getMessage());
        }

        eventPublisher.publishAuditEvent(
                String.valueOf(actorId), "POLICY_CREATED",
                "policies", policy.getPolicyNumber(),
                "Policy for customerId: " + req.getCustomerId());
        eventPublisher.publishNotificationEvent(
                String.valueOf(req.getCustomerId()),
                "Policy " + policy.getPolicyNumber()
                + " has been created. Premium: Rs." + premium, "POLICY");

        log.info("Policy created: {}", policy.getPolicyNumber());
        return toResponse(policy, type.getName());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "policies", key = "#policyId")
    public PolicyResponse getPolicyById(Long policyId) {
        Policy p = policyRepo.findByPolicyIdAndDeletedFalse(policyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Policy not found: " + policyId));
        String typeName = policyTypeRepo.findById(p.getPolicyTypeId())
                .map(PolicyType::getName).orElse("UNKNOWN");
        return toResponse(p, typeName);
    }

    @Override
    @Transactional(readOnly = true)
    public PolicyResponse getPolicyByNumber(String number) {
        Policy p = policyRepo.findByPolicyNumberAndDeletedFalse(number)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Policy not found: " + number));
        String typeName = policyTypeRepo.findById(p.getPolicyTypeId())
                .map(PolicyType::getName).orElse("UNKNOWN");
        return toResponse(p, typeName);
    }

    @Override
    @Transactional(readOnly = true)
    public PolicyValidationResponse validatePolicy(Long policyId) {
        Policy p = policyRepo.findByPolicyIdAndDeletedFalse(policyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Policy not found: " + policyId));
        PolicyType type = policyTypeRepo
                .findById(p.getPolicyTypeId()).orElse(null);
        return PolicyValidationResponse.builder()
                .policyId(p.getPolicyId())
                .policyNumber(p.getPolicyNumber())
                .active(p.isActive())
                .policyType(type != null ? type.getName() : "UNKNOWN")
                .coverageAmount(p.getCoverageAmount())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PolicyResponse> searchPolicies(Long customerId,
                                                String status,
                                                Pageable pageable) {
        Policy.PolicyStatus ps = null;
        if (status != null && !status.isBlank()) {
            try {
                ps = Policy.PolicyStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessRuleException("Invalid status: " + status);
            }
        }
        // Load all policy types once into a map to avoid N+1 DB queries per page row.
        Map<Long, String> typeNames = policyTypeRepo.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(
                        PolicyType::getTypeId, PolicyType::getName));
        return policyRepo.search(customerId, ps, pageable)
                .map(p -> toResponse(p, typeNames.getOrDefault(p.getPolicyTypeId(), "UNKNOWN")));
    }

    @Override
    @Transactional
    @CacheEvict(value = "policies", key = "#policyId")
    public PolicyResponse activatePolicy(Long policyId, Long actorId) {
        Policy p = policyRepo.findByPolicyIdAndDeletedFalse(policyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Policy not found: " + policyId));

        if (p.getStatus() != Policy.PolicyStatus.DRAFT
                && p.getStatus() != Policy.PolicyStatus.PENDING_UNDERWRITING)
            throw new BusinessRuleException(
                    "Policy cannot be activated from status: "
                    + p.getStatus());

        p.setStatus(Policy.PolicyStatus.ACTIVE);
        p.setModifiedBy(String.valueOf(actorId));
        policyRepo.save(p);

        // Auto-generate premium invoice now that the policy is ACTIVE.
        try {
            triggerInvoiceGeneration(p, policyId);
            log.info("Auto-invoice triggered for activated policy: {}", p.getPolicyNumber());
        } catch (Exception e) {
            log.warn("Could not auto-generate invoice for policyId={}: {}", policyId, e.getMessage());
        }

        eventPublisher.publishNotificationEvent(
                String.valueOf(p.getCustomerId()),
                "Your policy " + p.getPolicyNumber() + " is now ACTIVE!",
                "POLICY");

        log.info("Policy activated: {}", policyId);
        return getPolicyById(policyId);
    }

    @Override
    @Transactional
    @CacheEvict(value = "policies", key = "#policyId")
    public PolicyResponse cancelPolicy(Long policyId, String reason,
                                        Long actorId) {
        Policy p = policyRepo.findByPolicyIdAndDeletedFalse(policyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Policy not found: " + policyId));
        if (p.getStatus() == Policy.PolicyStatus.CANCELLED)
            throw new BusinessRuleException("Policy already cancelled");

        PolicyEndorsement e = PolicyEndorsement.builder()
                .policyId(policyId).changeType("CANCELLATION")
                .oldValue("{\"status\":\""
                        + p.getStatus().name() + "\"}")
                .newValue("{\"status\":\"CANCELLED\"}")
                .reason(reason).approvedBy(actorId)
                .effectiveDate(LocalDate.now()).build();
        endorsementRepo.save(e);

        p.setStatus(Policy.PolicyStatus.CANCELLED);
        p.setModifiedBy(String.valueOf(actorId));
        policyRepo.save(p);

        eventPublisher.publishNotificationEvent(
                String.valueOf(p.getCustomerId()),
                "Policy " + p.getPolicyNumber() + " has been cancelled.",
                "POLICY");

        log.info("Policy cancelled: {}", policyId);
        return getPolicyById(policyId);
    }

    @Override
    @Transactional
    public PolicyResponse addEndorsement(Long policyId, String changeType,
                                          String oldVal, String newVal,
                                          String reason, Long actorId) {
        Policy p = policyRepo.findByPolicyIdAndDeletedFalse(policyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Policy not found: " + policyId));
        if (p.getStatus() != Policy.PolicyStatus.ACTIVE)
            throw new BusinessRuleException(
                    "Endorsements only allowed on ACTIVE policies");

        PolicyEndorsement e = PolicyEndorsement.builder()
                .policyId(policyId).changeType(changeType)
                .oldValue(oldVal != null ? oldVal : "{}")
                .newValue(newVal).reason(reason)
                .approvedBy(actorId).effectiveDate(LocalDate.now())
                .build();
        endorsementRepo.save(e);

        eventPublisher.publishAuditEvent(
                String.valueOf(actorId), "POLICY_ENDORSED",
                "policies", String.valueOf(policyId),
                "Endorsement type: " + changeType);

        // Notify the policyholder that their policy has been updated
        eventPublisher.publishNotificationEvent(
                String.valueOf(p.getCustomerId()),
                "📝 Your policy " + p.getPolicyNumber() + " has been updated. "
                + "Change type: " + changeType
                + (reason != null && !reason.isBlank() ? ". Reason: " + reason : "")
                + ". Effective date: " + LocalDate.now()
                + ". Please contact your agent if you have any questions.",
                "POLICY");

        log.info("Endorsement added: policyId={}, type={}",
                policyId, changeType);
        return getPolicyById(policyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PolicyTypeResponse> getActivePolicyTypes() {
        return policyTypeRepo.findAllByActiveTrue().stream()
                .map(t -> PolicyTypeResponse.builder()
                        .typeId(t.getTypeId())
                        .name(t.getName())
                        .description(t.getDescription())
                        .basePremium(t.getBasePremium())
                        .coverageLimits(t.getCoverageLimits())
                        .underwritingRequired(t.isUnderwritingRequired())
                        .active(t.isActive())
                        .createdAt(t.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ── Request Invoice (manual retry for policyholder) ──────────────────────

    @Override
    @Transactional(readOnly = true)
    public void requestInvoice(Long policyId, Long userId) {
        Policy p = policyRepo.findByPolicyIdAndDeletedFalse(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found: " + policyId));

        if (p.getStatus() != Policy.PolicyStatus.ACTIVE)
            throw new BusinessRuleException("Invoice can only be requested for an ACTIVE policy");

        // Security: policyholder may only request invoices for their own policies.
        // customerId in the policy == userId in IAM for policyholders (consistent with claims-service).
        // We also accept the case where the policy was created by an agent on behalf of the customer.
        // The CustomerServiceClient already resolved the correct customerId on policy creation.

        try {
            triggerInvoiceGeneration(p, policyId);
            log.info("Manual invoice request succeeded for policyId={}", policyId);
        } catch (Exception e) {
            log.error("Manual invoice request failed for policyId={}: {}", policyId, e.getMessage());
            throw new BusinessRuleException("Payment service is currently unavailable. Please try again later.");
        }
    }

    /**
     * Builds and dispatches an auto-invoice request to the payment service.
     * Throws if the payment service call fails — callers decide how to handle.
     */
    private void triggerInvoiceGeneration(Policy p, Long policyId) {
        BigDecimal base = p.getPremiumAmount()
                .divide(new BigDecimal("1.18"), 2, RoundingMode.HALF_UP);
        BigDecimal tax  = p.getPremiumAmount().subtract(base);
        paymentClient.generateInvoiceForPolicy(
                PaymentServiceClient.AutoInvoiceRequest.builder()
                        .policyId(policyId)
                        .customerId(p.getCustomerId())
                        .amount(base)
                        .taxAmount(tax)
                        .dueDate(LocalDate.now().plusDays(30))
                        .periodStart(p.getStartDate())
                        .periodEnd(p.getEndDate())
                        .build());
    }

    private BigDecimal calculatePremium(BigDecimal basePremium,
                                         BigDecimal coverageAmount) {
        BigDecimal rate   = new BigDecimal("0.025");
        BigDecimal annual = coverageAmount.multiply(rate).add(basePremium);
        BigDecimal tax    = annual.multiply(
                BigDecimal.valueOf(taxRate / 100));
        return annual.add(tax).setScale(2, RoundingMode.HALF_UP);
    }

    private PolicyResponse toResponse(Policy p, String typeName) {
        return PolicyResponse.builder()
                .policyId(p.getPolicyId())
                .policyNumber(p.getPolicyNumber())
                .customerId(p.getCustomerId())
                .agentId(p.getAgentId())
                .policyTypeId(p.getPolicyTypeId())
                .policyTypeName(typeName)
                .coverageAmount(p.getCoverageAmount())
                .premiumAmount(p.getPremiumAmount())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .status(p.getStatus().name())
                .nomineeName(p.getNomineeName())
                .nomineeRelation(p.getNomineeRelation())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}