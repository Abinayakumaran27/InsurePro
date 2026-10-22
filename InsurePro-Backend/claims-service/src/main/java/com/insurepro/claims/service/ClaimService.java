package com.insurepro.claims.service;

import com.insurepro.claims.dto.request.*;
import com.insurepro.claims.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClaimService {
	ClaimResponse submitClaim(SubmitClaimRequest req, Long customerId);

	ClaimResponse getClaimById(Long claimId, Long userId, String role);

	ClaimResponse getClaimByNumber(String claimNumber);

	Page<ClaimResponse> searchClaims(Long customerId, Long policyId, String status, Long adjusterId, Pageable pageable);

	ClaimResponse updateStatus(Long claimId, UpdateClaimStatusRequest req, Long actorId);

	ClaimResponse assignAdjuster(Long claimId, Long adjusterId);

	ClaimNoteResponse addNote(Long claimId, AddNoteRequest req, Long authorId, String authorRole);

	Page<ClaimNoteResponse> getNotes(Long claimId, boolean includeInternal, Pageable pageable);

	SettlementResponse getSettlement(Long claimId);
	SettlementResponse settlePayment(Long claimId, Long actorId);
	

	ClaimResponse raiseDispute(Long claimId, String reason, Long raisedBy);
}
