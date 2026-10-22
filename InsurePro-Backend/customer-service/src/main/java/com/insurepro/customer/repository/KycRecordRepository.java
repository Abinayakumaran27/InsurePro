package com.insurepro.customer.repository;
import com.insurepro.customer.entity.KycRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface KycRecordRepository extends JpaRepository<KycRecord, Long> {
    List<KycRecord> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
