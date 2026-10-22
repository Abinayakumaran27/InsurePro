package com.insurepro.customer.repository;
import com.insurepro.customer.entity.Customer;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCustomerIdAndDeletedFalse(Long id);
    Optional<Customer> findByEmailAndDeletedFalse(String email);
    Optional<Customer> findByNationalIdAndDeletedFalse(String nationalId);
    boolean existsByEmailAndDeletedFalse(String email);
    boolean existsByNationalIdAndDeletedFalse(String nationalId);
    Page<Customer> findAllByDeletedFalse(Pageable pageable);
    @Query("SELECT c FROM Customer c WHERE c.deleted = false AND (LOWER(c.fullName) LIKE LOWER(CONCAT('%',:q,'%')) OR c.email LIKE LOWER(CONCAT('%',:q,'%')) OR c.nationalId LIKE CONCAT('%',:q,'%'))")
    Page<Customer> search(@Param("q") String query, Pageable pageable);
    Optional<Customer> findByUserIdAndDeletedFalse(Long userId);
}
