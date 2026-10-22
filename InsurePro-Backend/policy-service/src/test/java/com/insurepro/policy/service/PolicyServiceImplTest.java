package com.insurepro.policy.service;

import com.insurepro.policy.dto.request.CreatePolicyRequest;
import com.insurepro.policy.dto.response.PolicyResponse;
import com.insurepro.policy.entity.Policy;
import com.insurepro.policy.entity.PolicyType;
import com.insurepro.policy.event.EventPublisher;
import com.insurepro.policy.exception.BusinessRuleException;
import com.insurepro.policy.exception.ResourceNotFoundException;
import com.insurepro.policy.repository.PolicyEndorsementRepository;
import com.insurepro.policy.repository.PolicyRepository;
import com.insurepro.policy.repository.PolicyTypeRepository;
import com.insurepro.policy.service.impl.PolicyServiceImpl;
import com.insurepro.policy.util.PolicyNumberGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PolicyServiceImplTest {

    @Mock PolicyRepository policyRepo;
    @Mock PolicyTypeRepository policyTypeRepo;
    @Mock PolicyEndorsementRepository endorsementRepo;
    @Mock PolicyNumberGenerator numberGen;
    @Mock EventPublisher eventPublisher;

    @InjectMocks PolicyServiceImpl service;

    private PolicyType activeType;
    private CreatePolicyRequest validRequest;

    @BeforeEach
    void setUp() {
        activeType = new PolicyType();
        activeType.setTypeId(1L);
        activeType.setName("LIFE");
        activeType.setActive(true);
        activeType.setBasePremium(new BigDecimal("5000"));

        validRequest = new CreatePolicyRequest();
        validRequest.setCustomerId(10L);
        validRequest.setPolicyTypeId(1L);
        validRequest.setCoverageAmount(new BigDecimal("500000"));
        validRequest.setStartDate(LocalDate.now());
        validRequest.setEndDate(LocalDate.now().plusYears(1));
        validRequest.setNomineeName("Nominee");
        validRequest.setNomineeRelation("Spouse");
    }

    @Test
    void createPolicy_success() {
        when(policyTypeRepo.findById(1L)).thenReturn(Optional.of(activeType));
        when(numberGen.generate("LIFE")).thenReturn("POL-LIFE-000001");

        Policy saved = Policy.builder()
                .policyId(1L)
                .policyNumber("POL-LIFE-000001")
                .customerId(10L)
                .policyTypeId(1L)
                .coverageAmount(new BigDecimal("500000"))
                .premiumAmount(new BigDecimal("6000"))
                .startDate(validRequest.getStartDate())
                .endDate(validRequest.getEndDate())
                .status(Policy.PolicyStatus.DRAFT)
                .build();
        when(policyRepo.save(any())).thenReturn(saved);

        PolicyResponse result = service.createPolicy(validRequest, 99L);

        assertThat(result).isNotNull();
        assertThat(result.getPolicyNumber()).isEqualTo("POL-LIFE-000001");
        assertThat(result.getStatus()).isEqualTo("DRAFT");
        verify(policyRepo).save(any());
    }

    @Test
    void createPolicy_throwsWhenPolicyTypeNotFound() {
        when(policyTypeRepo.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createPolicy(validRequest, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Policy type not found");
    }

    @Test
    void createPolicy_throwsWhenPolicyTypeInactive() {
        activeType.setActive(false);
        when(policyTypeRepo.findById(1L)).thenReturn(Optional.of(activeType));

        assertThatThrownBy(() -> service.createPolicy(validRequest, 99L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not active");
    }

    @Test
    void createPolicy_throwsWhenEndDateNotAfterStartDate() {
        validRequest.setEndDate(validRequest.getStartDate());
        when(policyTypeRepo.findById(1L)).thenReturn(Optional.of(activeType));

        assertThatThrownBy(() -> service.createPolicy(validRequest, 99L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("End date");
    }

    @Test
    void getPolicy_throwsWhenNotFound() {
        when(policyRepo.findByPolicyIdAndDeletedFalse(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getPolicyById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
