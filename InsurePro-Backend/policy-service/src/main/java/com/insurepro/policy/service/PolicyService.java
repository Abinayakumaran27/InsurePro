package com.insurepro.policy.service;
import com.insurepro.policy.dto.request.CreatePolicyRequest;
import com.insurepro.policy.dto.response.PolicyResponse;
import com.insurepro.policy.dto.response.PolicyTypeResponse;
import com.insurepro.policy.dto.response.PolicyValidationResponse;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import java.util.List;
public interface PolicyService {
    PolicyResponse createPolicy(CreatePolicyRequest req, Long actorId);
    PolicyResponse getPolicyById(Long policyId);
    PolicyResponse getPolicyByNumber(String policyNumber);
    PolicyValidationResponse validatePolicy(Long policyId);
    Page<PolicyResponse> searchPolicies(Long customerId, String status, Pageable pageable);
    PolicyResponse activatePolicy(Long policyId, Long actorId);
    PolicyResponse cancelPolicy(Long policyId, String reason, Long actorId);
    PolicyResponse addEndorsement(Long policyId, String changeType, String oldValue, String newValue, String reason, Long actorId);
    List<PolicyTypeResponse> getActivePolicyTypes();
    /** Manually trigger invoice generation for an already-ACTIVE policy (used when auto-generation failed). */
    void requestInvoice(Long policyId, Long userId);
}
