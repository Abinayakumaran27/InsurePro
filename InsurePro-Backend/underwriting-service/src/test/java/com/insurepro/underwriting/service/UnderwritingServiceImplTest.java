package com.insurepro.underwriting.service;

import com.insurepro.underwriting.dto.request.InitiateUnderwritingRequest;
import com.insurepro.underwriting.dto.response.UnderwritingResponse;
import com.insurepro.underwriting.engine.RiskScoringEngine;
import com.insurepro.underwriting.entity.UnderwritingRequest;
import com.insurepro.underwriting.event.EventPublisher;
import com.insurepro.underwriting.exception.BusinessRuleException;
import com.insurepro.underwriting.exception.ResourceNotFoundException;
import com.insurepro.underwriting.repository.UnderwritingRequestRepository;
import com.insurepro.underwriting.service.impl.UnderwritingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UnderwritingServiceImplTest {

    @Mock
    private UnderwritingRequestRepository uwRepo;

    @Mock
    private RiskScoringEngine riskEngine;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private UnderwritingServiceImpl underwritingService;

    private UnderwritingRequest savedUwRequest;
    private InitiateUnderwritingRequest initiateReq;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        initiateReq = new InitiateUnderwritingRequest();
        initiateReq.setPolicyId(5L);
        initiateReq.setCustomerId(10L);
        initiateReq.setPolicyTypeId(2L);
        initiateReq.setCustomerAge(35);
        initiateReq.setHasExistingClaims(false);
        initiateReq.setSmoker(false);

        savedUwRequest = UnderwritingRequest.builder()
                .requestId(1L)
                .policyId(5L)
                .customerId(10L)
                .policyTypeId(2L)
                .riskScore(new BigDecimal("20"))
                .status(UnderwritingRequest.UWStatus.AUTO_APPROVED)
                .decisionRemarks("Low risk profile. Auto-approved. Risk score: 20")
                .decidedAt(LocalDateTime.now())
                .build();

        pageable = PageRequest.of(0, 10);
    }

    // ── initiateUnderwriting ──────────────────────────────────────────────────

    @Test
    void initiateUnderwriting_lowRisk_autoApproved() {
        RiskScoringEngine.RiskAssessment assessment = new RiskScoringEngine.RiskAssessment(
                new BigDecimal("20"),
                UnderwritingRequest.UWStatus.AUTO_APPROVED,
                "Low risk profile. Auto-approved. Risk score: 20");

        when(riskEngine.assess(initiateReq)).thenReturn(assessment);
        when(uwRepo.save(any(UnderwritingRequest.class))).thenReturn(savedUwRequest);

        UnderwritingResponse result = underwritingService
                .initiateUnderwriting(initiateReq, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getRequestId()).isEqualTo(1L);
        assertThat(result.getPolicyId()).isEqualTo(5L);
        assertThat(result.getStatus()).isEqualTo("AUTO_APPROVED");
        assertThat(result.getRiskScore()).isEqualByComparingTo(new BigDecimal("20"));
        verify(uwRepo).save(any(UnderwritingRequest.class));
        verify(eventPublisher).publishAuditEvent(anyString(), eq("UNDERWRITING_INITIATED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void initiateUnderwriting_highRisk_autoDeclined() {
        RiskScoringEngine.RiskAssessment assessment = new RiskScoringEngine.RiskAssessment(
                new BigDecimal("80"),
                UnderwritingRequest.UWStatus.AUTO_DECLINED,
                "High risk profile. Auto-declined. Risk score: 80");

        UnderwritingRequest declinedUw = UnderwritingRequest.builder()
                .requestId(2L)
                .policyId(5L)
                .customerId(10L)
                .policyTypeId(2L)
                .riskScore(new BigDecimal("80"))
                .status(UnderwritingRequest.UWStatus.AUTO_DECLINED)
                .decisionRemarks("High risk profile. Auto-declined.")
                .build();

        when(riskEngine.assess(initiateReq)).thenReturn(assessment);
        when(uwRepo.save(any(UnderwritingRequest.class))).thenReturn(declinedUw);

        UnderwritingResponse result = underwritingService
                .initiateUnderwriting(initiateReq, 1L);

        assertThat(result.getStatus()).isEqualTo("AUTO_DECLINED");
    }

    @Test
    void initiateUnderwriting_mediumRisk_referred_decidedAtSetToNull() {
        RiskScoringEngine.RiskAssessment assessment = new RiskScoringEngine.RiskAssessment(
                new BigDecimal("50"),
                UnderwritingRequest.UWStatus.REFERRED,
                "Medium risk. Requires manual review. Risk score: 50");

        UnderwritingRequest referredUw = UnderwritingRequest.builder()
                .requestId(3L)
                .policyId(5L)
                .customerId(10L)
                .policyTypeId(2L)
                .riskScore(new BigDecimal("50"))
                .status(UnderwritingRequest.UWStatus.REFERRED)
                .decisionRemarks("Medium risk.")
                .decidedAt(null)
                .build();

        when(riskEngine.assess(initiateReq)).thenReturn(assessment);
        when(uwRepo.save(any(UnderwritingRequest.class))).thenReturn(referredUw);

        UnderwritingResponse result = underwritingService
                .initiateUnderwriting(initiateReq, 1L);

        assertThat(result.getStatus()).isEqualTo("REFERRED");
        assertThat(result.getDecidedAt()).isNull();
    }

    // ── getByPolicyId ─────────────────────────────────────────────────────────

    @Test
    void getByPolicyId_existingPolicy_returnsResponse() {
        when(uwRepo.findByPolicyIdAndDeletedFalse(5L))
                .thenReturn(Optional.of(savedUwRequest));

        UnderwritingResponse result = underwritingService.getByPolicyId(5L);

        assertThat(result).isNotNull();
        assertThat(result.getPolicyId()).isEqualTo(5L);
        assertThat(result.getStatus()).isEqualTo("AUTO_APPROVED");
    }

    @Test
    void getByPolicyId_notFound_throwsResourceNotFoundException() {
        when(uwRepo.findByPolicyIdAndDeletedFalse(999L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> underwritingService.getByPolicyId(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    // ── getById ───────────────────────────────────────────────────────────────

    @Test
    void getById_existingId_returnsResponse() {
        when(uwRepo.findByRequestIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(savedUwRequest));

        UnderwritingResponse result = underwritingService.getById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getRequestId()).isEqualTo(1L);
    }

    @Test
    void getById_notFound_throwsResourceNotFoundException() {
        when(uwRepo.findByRequestIdAndDeletedFalse(99L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> underwritingService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── listByStatus ──────────────────────────────────────────────────────────

    @Test
    void listByStatus_withStatus_filtersResults() {
        Page<UnderwritingRequest> page = new PageImpl<>(List.of(savedUwRequest));
        when(uwRepo.findByStatusAndDeletedFalse(
                UnderwritingRequest.UWStatus.AUTO_APPROVED, pageable))
                .thenReturn(page);

        Page<UnderwritingResponse> result = underwritingService
                .listByStatus("AUTO_APPROVED", pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo("AUTO_APPROVED");
    }

    @Test
    void listByStatus_nullStatus_returnsAll() {
        Page<UnderwritingRequest> page = new PageImpl<>(List.of(savedUwRequest));
        when(uwRepo.findAll(pageable)).thenReturn(page);

        Page<UnderwritingResponse> result = underwritingService
                .listByStatus(null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(uwRepo).findAll(pageable);
    }

    // ── makeDecision ──────────────────────────────────────────────────────────

    @Test
    void makeDecision_referredRequest_approvesSuccessfully() {
        UnderwritingRequest referredUw = UnderwritingRequest.builder()
                .requestId(3L)
                .policyId(5L)
                .customerId(10L)
                .status(UnderwritingRequest.UWStatus.REFERRED)
                .riskScore(new BigDecimal("50"))
                .build();

        UnderwritingRequest approvedUw = UnderwritingRequest.builder()
                .requestId(3L)
                .policyId(5L)
                .customerId(10L)
                .status(UnderwritingRequest.UWStatus.APPROVED)
                .decisionRemarks("Manually reviewed and approved.")
                .decidedAt(LocalDateTime.now())
                .referredToUserId(1L)
                .riskScore(new BigDecimal("50"))
                .build();

        when(uwRepo.findByRequestIdAndDeletedFalse(3L))
                .thenReturn(Optional.of(referredUw));
        when(uwRepo.save(any(UnderwritingRequest.class))).thenReturn(approvedUw);

        UnderwritingResponse result = underwritingService
                .makeDecision(3L, "APPROVED", "Manually reviewed and approved.", 1L);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("APPROVED");
        verify(uwRepo).save(any(UnderwritingRequest.class));
        verify(eventPublisher).publishAuditEvent(anyString(), eq("UNDERWRITING_DECISION"),
                anyString(), anyString(), anyString());
    }

    @Test
    void makeDecision_autoApprovedStatus_throwsBusinessRuleException() {
        when(uwRepo.findByRequestIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(savedUwRequest)); // status is AUTO_APPROVED

        assertThatThrownBy(() ->
                underwritingService.makeDecision(1L, "DECLINED", "Overriding", 1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("AUTO_APPROVED");
    }

    @Test
    void makeDecision_notFound_throwsResourceNotFoundException() {
        when(uwRepo.findByRequestIdAndDeletedFalse(99L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                underwritingService.makeDecision(99L, "APPROVED", null, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }
}
