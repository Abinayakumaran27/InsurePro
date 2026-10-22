package com.insurepro.claims.repository;
import com.insurepro.claims.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; import java.util.Optional;
@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    List<Settlement> findByClaimId(Long claimId);
    Optional<Settlement> findTopByClaimIdOrderByCreatedAtDesc(Long claimId);
}
