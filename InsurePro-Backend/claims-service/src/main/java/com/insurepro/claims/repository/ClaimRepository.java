package com.insurepro.claims.repository;
import com.insurepro.claims.entity.Claim;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    Optional<Claim> findByClaimIdAndDeletedFalse(Long claimId);
    Optional<Claim> findByClaimNumberAndDeletedFalse(String claimNumber);
    Page<Claim> findByCustomerIdAndDeletedFalse(Long customerId, Pageable pageable);
    Page<Claim> findByStatus(Claim.ClaimStatus status, Pageable pageable);
    @Query("SELECT c FROM Claim c WHERE c.deleted = false AND (:cid IS NULL OR c.customerId = :cid) AND (:pid IS NULL OR c.policyId = :pid) AND (:st IS NULL OR c.status = :st) AND (:aid IS NULL OR c.assignedAdjusterId = :aid)")
    Page<Claim> search(@Param("cid") Long customerId, @Param("pid") Long policyId, @Param("st") Claim.ClaimStatus status, @Param("aid") Long adjusterId, Pageable pageable);
}
