package com.insurepro.policy.repository;
import com.insurepro.policy.entity.Policy;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate; import java.util.List; import java.util.Optional;
@Repository
public interface PolicyRepository extends JpaRepository<Policy, Long> {
    Optional<Policy> findByPolicyIdAndDeletedFalse(Long id);
    Optional<Policy> findByPolicyNumberAndDeletedFalse(String number);
    Page<Policy> findByCustomerIdAndDeletedFalse(Long customerId, Pageable pageable);
    Page<Policy> findByStatusAndDeletedFalse(Policy.PolicyStatus status, Pageable pageable);
    List<Policy> findByEndDateBeforeAndStatusAndDeletedFalse(LocalDate date, Policy.PolicyStatus status);
    @Query("SELECT p FROM Policy p WHERE p.deleted = false AND (:customerId IS NULL OR p.customerId = :customerId) AND (:status IS NULL OR p.status = :status)")
    Page<Policy> search(@Param("customerId") Long customerId, @Param("status") Policy.PolicyStatus status, Pageable pageable);
    @Query("SELECT p FROM Policy p WHERE p.policyId = :id AND p.deleted = false")
    Optional<Policy> findForValidation(@Param("id") Long id);
}
