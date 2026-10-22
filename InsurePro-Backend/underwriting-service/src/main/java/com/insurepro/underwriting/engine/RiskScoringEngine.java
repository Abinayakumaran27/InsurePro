package com.insurepro.underwriting.engine;
import com.insurepro.underwriting.dto.request.InitiateUnderwritingRequest;
import com.insurepro.underwriting.entity.UnderwritingRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
@Component @Slf4j
public class RiskScoringEngine {
    private static final BigDecimal AUTO_APPROVE_THRESHOLD = new BigDecimal("40");
    private static final BigDecimal REFER_THRESHOLD        = new BigDecimal("60");
    public RiskAssessment assess(InitiateUnderwritingRequest req) {
        BigDecimal score = BigDecimal.ZERO;
        // Rule-based scoring
        if (req.getCustomerAge() > 60) score = score.add(new BigDecimal("30"));
        else if (req.getCustomerAge() > 45) score = score.add(new BigDecimal("15"));
        if (req.isHasExistingClaims()) score = score.add(new BigDecimal("20"));
        if (req.isSmoker()) score = score.add(new BigDecimal("15"));
        if (req.getHealthConditions() != null && !req.getHealthConditions().isBlank()) score = score.add(new BigDecimal("25"));
        if (req.getCoverageAmount() != null && req.getCoverageAmount().compareTo(new BigDecimal("5000000")) > 0) score = score.add(new BigDecimal("20"));
        score = score.min(new BigDecimal("100"));
        UnderwritingRequest.UWStatus status;
        String remarks;
        if (score.compareTo(AUTO_APPROVE_THRESHOLD) <= 0) {
            status = UnderwritingRequest.UWStatus.AUTO_APPROVED;
            remarks = "Low risk profile. Auto-approved. Risk score: " + score;
        } else if (score.compareTo(REFER_THRESHOLD) <= 0) {
            status = UnderwritingRequest.UWStatus.REFERRED;
            remarks = "Medium risk. Requires manual review. Risk score: " + score;
        } else {
            status = UnderwritingRequest.UWStatus.AUTO_DECLINED;
            remarks = "High risk profile. Auto-declined. Risk score: " + score;
        }
        log.info("Risk assessment: policyId={}, score={}, decision={}", req.getPolicyId(), score, status);
        return new RiskAssessment(score, status, remarks);
    }
    public record RiskAssessment(BigDecimal score, UnderwritingRequest.UWStatus status, String remarks) {}
}
