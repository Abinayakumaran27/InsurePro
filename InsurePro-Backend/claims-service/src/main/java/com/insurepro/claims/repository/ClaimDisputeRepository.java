package com.insurepro.claims.repository;
import com.insurepro.claims.entity.ClaimDispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface ClaimDisputeRepository extends JpaRepository<ClaimDispute, Long> {
    Optional<ClaimDispute> findTopByClaimIdOrderByCreatedAtDesc(Long claimId);
}
