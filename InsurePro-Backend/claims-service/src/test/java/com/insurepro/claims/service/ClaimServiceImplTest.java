package com.insurepro.claims.service;


import com.insurepro.claims.client.PolicyServiceClient;
import com.insurepro.claims.dto.request.SubmitClaimRequest;
import com.insurepro.claims.dto.response.ClaimResponse;
import com.insurepro.claims.entity.Claim;
import com.insurepro.claims.event.EventPublisher;
import com.insurepro.claims.exception.BusinessRuleException;
import com.insurepro.claims.repository.ClaimDisputeRepository;
import com.insurepro.claims.repository.ClaimNoteRepository;
import com.insurepro.claims.repository.ClaimRepository;
import com.insurepro.claims.repository.SettlementRepository;
import com.insurepro.claims.service.impl.ClaimServiceImpl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClaimServiceImplTest {

    @Mock ClaimRepository claimRepo;
    @Mock SettlementRepository settlementRepo;
    @Mock ClaimNoteRepository noteRepo;
    @Mock ClaimDisputeRepository disputeRepo;
    @Mock PolicyServiceClient policyClient;

    @Mock EventPublisher eventPublisher;
    

    @InjectMocks ClaimServiceImpl service;

    private PolicyServiceClient.PolicyValidationDto activePolicy;
    private SubmitClaimRequest validRequest;

    @BeforeEach
    void setUp() {
        activePolicy = new PolicyServiceClient.PolicyValidationDto(
                1L, "POL-001", true, "HEALTH",
                new BigDecimal("200000"),
                LocalDate.now().minusMonths(6),
                LocalDate.now().plusMonths(6));

        validRequest = new SubmitClaimRequest();
        validRequest.setPolicyId(1L);
        validRequest.setIncidentDate(LocalDate.now().minusDays(5));
        validRequest.setClaimType("MEDICAL");
        validRequest.setDescription("Hospital admission for surgery");
        validRequest.setAmountRequested(new BigDecimal("50000"));
    }

    @Test
    void submitClaim_success() {
        when(policyClient.validatePolicy(1L)).thenReturn(activePolicy);
        Claim saved = Claim.builder()
                .claimId(1L)
                .claimNumber("CLM-20250101-000001")
                .policyId(1L)
                .customerId(10L)
                .claimDate(LocalDate.now())
                .incidentDate(validRequest.getIncidentDate())
                .claimType(Claim.ClaimType.MEDICAL)
                .description(validRequest.getDescription())
                .amountRequested(validRequest.getAmountRequested())
                .status(Claim.ClaimStatus.SUBMITTED)
                .build();
        when(claimRepo.save(any())).thenReturn(saved);
    

        ClaimResponse result = service.submitClaim(validRequest, 10L);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("SUBMITTED");
        verify(claimRepo).save(any());
    }

    @Test
    void submitClaim_throwsWhenPolicyInactive() {
        activePolicy.setActive(false);
        when(policyClient.validatePolicy(1L)).thenReturn(activePolicy);

        assertThatThrownBy(() -> service.submitClaim(validRequest, 10L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not active");
    }

    @Test
    void submitClaim_throwsWhenIncidentOutsideCoveragePeriod() {
        validRequest.setIncidentDate(LocalDate.now().minusYears(2));
        when(policyClient.validatePolicy(1L)).thenReturn(activePolicy);

        assertThatThrownBy(() -> service.submitClaim(validRequest, 10L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Incident date outside");
    }

    @Test
    void submitClaim_throwsWhenAmountExceedsCoverage() {
        validRequest.setAmountRequested(new BigDecimal("999999"));
        when(policyClient.validatePolicy(1L)).thenReturn(activePolicy);

        assertThatThrownBy(() -> service.submitClaim(validRequest, 10L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("exceeds policy coverage limit");
    }
}
