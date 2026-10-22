package com.insurepro.policy.repository;
import com.insurepro.policy.entity.PolicyEndorsement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface PolicyEndorsementRepository extends JpaRepository<PolicyEndorsement, Long> {
    List<PolicyEndorsement> findByPolicyIdOrderByCreatedAtDesc(Long policyId);
}
