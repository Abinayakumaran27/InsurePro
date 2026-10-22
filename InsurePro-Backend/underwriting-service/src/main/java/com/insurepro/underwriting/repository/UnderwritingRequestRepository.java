package com.insurepro.underwriting.repository;
import com.insurepro.underwriting.entity.UnderwritingRequest;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface UnderwritingRequestRepository extends JpaRepository<UnderwritingRequest, Long> {
    Optional<UnderwritingRequest> findByRequestIdAndDeletedFalse(Long id);
    Optional<UnderwritingRequest> findByPolicyIdAndDeletedFalse(Long policyId);
    Page<UnderwritingRequest> findByStatusAndDeletedFalse(UnderwritingRequest.UWStatus status, Pageable pageable);
    Page<UnderwritingRequest> findByReferredToUserIdAndDeletedFalse(Long userId, Pageable pageable);
}
