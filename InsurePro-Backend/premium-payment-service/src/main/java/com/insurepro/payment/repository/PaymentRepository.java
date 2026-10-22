package com.insurepro.payment.repository;
import com.insurepro.payment.entity.Payment;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Page<Payment> findByCustomerIdAndDeletedFalse(Long customerId, Pageable pageable);
    List<Payment> findByInvoiceIdAndDeletedFalse(Long invoiceId);
}
