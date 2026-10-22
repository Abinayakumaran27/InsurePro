package com.insurepro.policy.repository;
import com.insurepro.policy.entity.PolicyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; import java.util.Optional;
@Repository
public interface PolicyTypeRepository extends JpaRepository<PolicyType, Long> {
    Optional<PolicyType> findByNameAndActiveTrue(String name);
    List<PolicyType> findAllByActiveTrue();
}
