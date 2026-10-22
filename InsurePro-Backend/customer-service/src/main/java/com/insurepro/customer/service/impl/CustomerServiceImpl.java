package com.insurepro.customer.service.impl;

import com.insurepro.customer.client.IamServiceClient;
import com.insurepro.customer.client.dto.CreatePolicyholderUserRequest;
import com.insurepro.customer.client.dto.IamApiResponse;
import com.insurepro.customer.dto.request.*;
import com.insurepro.customer.dto.response.CustomerResponse;
import com.insurepro.customer.entity.Customer;
import com.insurepro.customer.event.EventPublisher;
import com.insurepro.customer.exception.*;
import com.insurepro.customer.repository.CustomerRepository;
import com.insurepro.customer.service.CustomerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepo;
    private final EventPublisher eventPublisher;
    private final IamServiceClient iamServiceClient;

    public CustomerServiceImpl(CustomerRepository customerRepo,
                                EventPublisher eventPublisher,
                                IamServiceClient iamServiceClient) {
        this.customerRepo     = customerRepo;
        this.eventPublisher   = eventPublisher;
        this.iamServiceClient = iamServiceClient;
    }

    @Override
    @Transactional
    public CustomerResponse createCustomer(CreateCustomerRequest req,
                                            Long createdByUserId) {
        if (customerRepo.existsByEmailAndDeletedFalse(req.getEmail()))
            throw new ConflictException(
                    "Email already registered: " + req.getEmail());
        if (customerRepo.existsByNationalIdAndDeletedFalse(
                req.getNationalId()))
            throw new ConflictException("National ID already registered");

        // Temporary password is mandatory for admin/agent-created policyholders
        if (req.getTemporaryPassword() == null || req.getTemporaryPassword().isBlank()) {
            throw new BusinessRuleException("A temporary password is required to create a portal login for the policyholder.");
        }

        Long linkedUserId = null;
        String portalUsername = null;

        String tmpPwd = req.getTemporaryPassword();
        if (tmpPwd != null && !tmpPwd.isBlank()) {
            try {
                // Derive username: use provided portalUsername or auto-generate from email prefix
                String username = (req.getPortalUsername() != null && !req.getPortalUsername().isBlank())
                        ? req.getPortalUsername()
                        : req.getEmail().split("@")[0].toLowerCase().replaceAll("[^a-z0-9._-]", "");

                IamApiResponse iamResp = iamServiceClient.createPolicyholderUser(
                        CreatePolicyholderUserRequest.builder()
                                .username(username)
                                .email(req.getEmail())
                                .fullName(req.getFullName())
                                .password(tmpPwd)
                                .phone(req.getPhone())
                                .role("ROLE_POLICYHOLDER")
                                .forcePasswordChange(true)
                                .build());
                if (iamResp != null && iamResp.getData() != null) {
                    linkedUserId      = iamResp.getData().getUserId();
                    portalUsername    = iamResp.getData().getUsername();
                    log.info("IAM user created for customer email={}, userId={}, username={}",
                            req.getEmail(), linkedUserId, portalUsername);
                }
            } catch (Exception e) {
                log.error("Failed to create IAM user for customer email={}: {}",
                        req.getEmail(), e.getMessage());
                throw new BusinessRuleException(
                        "Could not create portal login: " + e.getMessage());
            }
        }

        Customer c = Customer.builder()
                .fullName(req.getFullName())
                .dateOfBirth(req.getDateOfBirth())
                .gender(req.getGender())
                .nationalId(req.getNationalId())
                .email(req.getEmail())
                .phone(req.getPhone())
                .address(req.getAddress())
                .occupation(req.getOccupation())
                .annualIncome(req.getAnnualIncome())
                .userId(linkedUserId)
                .createdBy(String.valueOf(createdByUserId))
                .build();

        c = customerRepo.save(c);

        eventPublisher.publishAuditEvent(
                String.valueOf(createdByUserId),
                "CUSTOMER_CREATED", "customers",
                String.valueOf(c.getCustomerId()),
                "Customer: " + c.getEmail());

        if (linkedUserId != null) {
            eventPublisher.publishNotificationEvent(
                    String.valueOf(linkedUserId),
                    "Welcome " + c.getFullName()
                    + "! Your customer profile has been created.",
                    "SYSTEM");
        }

        log.info("Customer created: id={}, email={}",
                c.getCustomerId(), c.getEmail());
        return toResponse(c);
    }

    @Override
    @Transactional
    public CustomerResponse createSelfProfile(CreateCustomerRequest req, Long userId) {
        if (customerRepo.findByUserIdAndDeletedFalse(userId).isPresent())
            throw new ConflictException(
                    "You already have a customer profile. Contact an agent to update it.");
        if (customerRepo.existsByEmailAndDeletedFalse(req.getEmail()))
            throw new ConflictException("Email already registered: " + req.getEmail());
        if (customerRepo.existsByNationalIdAndDeletedFalse(req.getNationalId()))
            throw new ConflictException("National ID already registered");

        Customer c = Customer.builder()
                .fullName(req.getFullName())
                .dateOfBirth(req.getDateOfBirth())
                .gender(req.getGender())
                .nationalId(req.getNationalId())
                .email(req.getEmail())
                .phone(req.getPhone())
                .address(req.getAddress())
                .occupation(req.getOccupation())
                .annualIncome(req.getAnnualIncome())
                .userId(userId)
                .kycStatus(Customer.KycStatus.PENDING)  // always PENDING for self-registration
                .createdBy(String.valueOf(userId))
                .build();

        c = customerRepo.save(c);

        eventPublisher.publishAuditEvent(String.valueOf(userId),
                "CUSTOMER_SELF_REGISTERED", "customers",
                String.valueOf(c.getCustomerId()), "Self-profile: " + c.getEmail());

        log.info("Customer self-profile created: id={}, email={}", c.getCustomerId(), c.getEmail());
        return toResponse(c);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "customers", key = "#customerId")
    public CustomerResponse getCustomerById(Long customerId) {
        return toResponse(customerRepo
                .findByCustomerIdAndDeletedFalse(customerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Customer not found: " + customerId)));
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByEmail(String email) {
        return toResponse(customerRepo
                .findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Customer not found: " + email)));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponse> listCustomers(Pageable pageable) {
        return customerRepo.findAllByDeletedFalse(pageable)
                .map(this::toResponse)
                .map(this::enrichCreatorName);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponse> searchCustomers(String query,
                                                   Pageable pageable) {
        return customerRepo.search(query, pageable)
                .map(this::toResponse)
                .map(this::enrichCreatorName);
    }

    @Override
    @Transactional
    @CacheEvict(value = "customers", key = "#customerId")
    public CustomerResponse updateCustomer(Long customerId,
                                            UpdateCustomerRequest req,
                                            Long actorId) {
        Customer c = customerRepo
                .findByCustomerIdAndDeletedFalse(customerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Customer not found: " + customerId));

        if (req.getFullName()     != null) c.setFullName(req.getFullName());
        if (req.getPhone()        != null) c.setPhone(req.getPhone());
        if (req.getAddress()      != null) c.setAddress(req.getAddress());
        if (req.getOccupation()   != null) c.setOccupation(req.getOccupation());
        if (req.getAnnualIncome() != null) c.setAnnualIncome(req.getAnnualIncome());
        c.setModifiedBy(String.valueOf(actorId));

        eventPublisher.publishAuditEvent(
                String.valueOf(actorId), "CUSTOMER_UPDATED",
                "customers", String.valueOf(customerId),
                "Customer updated: " + c.getEmail());

        log.info("Customer updated: id={}", customerId);
        return toResponse(customerRepo.save(c));
    }

    @Override
    @Transactional
    @CacheEvict(value = "customers", key = "#customerId")
    public void deleteCustomer(Long customerId, Long actorId) {
        Customer c = customerRepo
                .findByCustomerIdAndDeletedFalse(customerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Customer not found: " + customerId));
        c.setDeleted(true);
        c.setModifiedBy(String.valueOf(actorId));
        customerRepo.save(c);
        eventPublisher.publishAuditEvent(
                String.valueOf(actorId), "CUSTOMER_DELETED",
                "customers", String.valueOf(customerId), "Soft deleted");
        log.info("Customer soft deleted: id={}", customerId);
    }

    @Override
    @Transactional
    @CacheEvict(value = "customers", key = "#customerId")
    public CustomerResponse updateKycStatus(Long customerId,
                                             String kycStatus,
                                             String reason,
                                             Long actorId) {
        Customer c = customerRepo
                .findByCustomerIdAndDeletedFalse(customerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Customer not found: " + customerId));
        Customer.KycStatus newStatus;
        try {
            newStatus = Customer.KycStatus.valueOf(kycStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Invalid KYC status: " + kycStatus);
        }
        if (newStatus == Customer.KycStatus.REJECTED
                && (reason == null || reason.isBlank())) {
            throw new BusinessRuleException("A rejection reason is required when rejecting KYC.");
        }
        c.setKycStatus(newStatus);
        // Store reason on rejection; clear it on subsequent approval/verification.
        if (newStatus == Customer.KycStatus.REJECTED) {
            c.setKycRejectionReason(reason.trim());
        } else {
            c.setKycRejectionReason(null);
        }
        c.setModifiedBy(String.valueOf(actorId));
        String auditDetail = "KYC status changed to: " + kycStatus
                + (reason != null && !reason.isBlank() ? " | Reason: " + reason : "");
        eventPublisher.publishAuditEvent(
                String.valueOf(actorId), "KYC_STATUS_UPDATED",
                "customers", String.valueOf(customerId), auditDetail);

        // Notify the policyholder of their KYC outcome (only when they have a portal account)
        if (c.getUserId() != null) {
            String notifMessage;
            switch (newStatus) {
                case VERIFIED ->
                    notifMessage = "✅ Your KYC verification has been approved. "
                            + "You are now eligible to be assigned insurance policies.";
                case REJECTED -> {
                    String reasonText = (reason != null && !reason.isBlank())
                            ? " Reason: " + reason.trim()
                            : "";
                    notifMessage = "❌ Your KYC verification has been rejected." + reasonText
                            + " Please contact your agent to resolve the issue and re-submit your documents.";
                }
                case IN_PROGRESS ->
                    notifMessage = "🔄 Your KYC verification is now in progress. "
                            + "An agent is reviewing your documents.";
                case EXPIRED ->
                    notifMessage = "⚠️ Your KYC verification has expired. "
                            + "Please contact your agent to renew your verification.";
                default ->
                    notifMessage = "Your KYC status has been updated to: " + newStatus.name();
            }
            eventPublisher.publishNotificationEvent(
                    String.valueOf(c.getUserId()), notifMessage, "KYC");
        }

        log.info("KYC status updated: customerId={}, status={}", customerId, kycStatus);
        return toResponse(customerRepo.save(c));
    }

    private CustomerResponse toResponse(Customer c) {
        return CustomerResponse.builder()
                .customerId(c.getCustomerId())
                .userId(c.getUserId())
                .fullName(c.getFullName())
                .dateOfBirth(c.getDateOfBirth())
                .gender(c.getGender())
                .nationalId(c.getNationalId())
                .email(c.getEmail())
                .phone(c.getPhone())
                .address(c.getAddress())
                .kycStatus(c.getKycStatus() != null ? c.getKycStatus().name() : "PENDING")
                .kycRejectionReason(c.getKycRejectionReason())
                .occupation(c.getOccupation())
                .annualIncome(c.getAnnualIncome())
                .riskCategory(c.getRiskCategory())
                .createdBy(c.getCreatedBy())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    // Enriches a CustomerResponse with the creator's full name from IAM.
    // Only called for list/search endpoints — never for service-to-service lookups.
    private CustomerResponse enrichCreatorName(CustomerResponse r) {
        if (r.getCreatedBy() == null) return r;
        try {
            Long creatorId = Long.parseLong(r.getCreatedBy());
            var iamResp = iamServiceClient.getUserById(creatorId);
            if (iamResp != null && iamResp.getData() != null) {
                r.setCreatedByName(iamResp.getData().getFullName());
            }
        } catch (Exception e) {
            log.debug("Could not enrich creatorName for createdBy={}: {}", r.getCreatedBy(), e.getMessage());
        }
        return r;
    }
    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByUserId(Long userId) {
        return toResponse(customerRepo
                .findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Customer profile not found for userId: " + userId
                        + ". Please create your profile first.")));
    }
}