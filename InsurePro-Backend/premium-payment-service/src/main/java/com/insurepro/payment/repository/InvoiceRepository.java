package com.insurepro.payment.repository;
import com.insurepro.payment.entity.Invoice;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.Optional;
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceIdAndDeletedFalse(Long id);
    Optional<Invoice> findByInvoiceNumberAndDeletedFalse(String number);
    Page<Invoice> findByCustomerIdAndDeletedFalse(Long customerId, Pageable pageable);
    Page<Invoice> findByPolicyIdAndDeletedFalse(Long policyId, Pageable pageable);
    Optional<Invoice> findByPolicyIdAndPeriodStartAndPeriodEndAndDeletedFalse(Long policyId, LocalDate periodStart, LocalDate periodEnd);
    Optional<Invoice> findTopByInvoiceNumberStartingWithOrderByInvoiceNumberDesc(String prefix);
}


