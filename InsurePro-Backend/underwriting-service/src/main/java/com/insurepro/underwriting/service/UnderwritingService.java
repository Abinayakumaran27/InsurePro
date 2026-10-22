package com.insurepro.underwriting.service;
import com.insurepro.underwriting.dto.request.InitiateUnderwritingRequest;
import com.insurepro.underwriting.dto.response.UnderwritingResponse;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
public interface UnderwritingService {
    UnderwritingResponse initiateUnderwriting(InitiateUnderwritingRequest req, Long actorId);
    UnderwritingResponse getByPolicyId(Long policyId);
    UnderwritingResponse getById(Long requestId);
    Page<UnderwritingResponse> listByStatus(String status, Pageable pageable);
    UnderwritingResponse makeDecision(Long requestId, String decision, String remarks, Long actorId);
}
