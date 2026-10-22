package com.insurepro.customer.service;
import com.insurepro.customer.dto.request.*;
import com.insurepro.customer.dto.response.CustomerResponse;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
public interface CustomerService {
    CustomerResponse createCustomer(CreateCustomerRequest req, Long createdByUserId);
    /** Self-service registration — always forces KYC_PENDING, prevents duplicate profile. */
    CustomerResponse createSelfProfile(CreateCustomerRequest req, Long userId);
    CustomerResponse getCustomerById(Long customerId);
    CustomerResponse getCustomerByEmail(String email);
    Page<CustomerResponse> listCustomers(Pageable pageable);
    Page<CustomerResponse> searchCustomers(String query, Pageable pageable);
    CustomerResponse updateCustomer(Long customerId, UpdateCustomerRequest req, Long actorId);
    void deleteCustomer(Long customerId, Long actorId);
    CustomerResponse updateKycStatus(Long customerId, String kycStatus, String reason, Long actorId);
    CustomerResponse getCustomerByUserId(Long userId);
}
