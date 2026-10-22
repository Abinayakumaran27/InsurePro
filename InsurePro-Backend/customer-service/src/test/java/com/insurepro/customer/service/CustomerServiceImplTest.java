package com.insurepro.customer.service;

import com.insurepro.customer.client.IamServiceClient;
import com.insurepro.customer.client.dto.CreatePolicyholderUserRequest;
import com.insurepro.customer.client.dto.IamApiResponse;
import com.insurepro.customer.client.dto.IamUserResponse;
import com.insurepro.customer.dto.request.CreateCustomerRequest;
import com.insurepro.customer.dto.request.UpdateCustomerRequest;
import com.insurepro.customer.dto.response.CustomerResponse;
import com.insurepro.customer.entity.Customer;
import com.insurepro.customer.event.EventPublisher;
import com.insurepro.customer.exception.BusinessRuleException;
import com.insurepro.customer.exception.ConflictException;
import com.insurepro.customer.exception.ResourceNotFoundException;
import com.insurepro.customer.repository.CustomerRepository;
import com.insurepro.customer.service.impl.CustomerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

    @Mock
    private CustomerRepository customerRepo;

    @Mock
    private EventPublisher eventPublisher;

    @Mock
    private IamServiceClient iamServiceClient;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private CreateCustomerRequest createReq;
    private Customer savedCustomer;

    @BeforeEach
    void setUp() {
        createReq = new CreateCustomerRequest();
        createReq.setFullName("Ravi Kumar");
        createReq.setEmail("ravi@example.com");
        createReq.setPhone("9876543210");
        createReq.setNationalId("ABCDE1234F");
        createReq.setDateOfBirth(LocalDate.of(1990, 5, 15));
        createReq.setGender("MALE");
        createReq.setAddress("123 MG Road, Bangalore");
        createReq.setOccupation("Engineer");
        createReq.setAnnualIncome(new BigDecimal("1200000"));
        createReq.setPortalUsername("ravikumar");
        createReq.setTemporaryPassword("Temp@1234");

        savedCustomer = Customer.builder()
                .customerId(1L)
                .userId(50L)
                .fullName("Ravi Kumar")
                .email("ravi@example.com")
                .phone("9876543210")
                .nationalId("ABCDE1234F")
                .dateOfBirth(LocalDate.of(1990, 5, 15))
                .gender("MALE")
                .kycStatus(Customer.KycStatus.PENDING)
                .occupation("Engineer")
                .annualIncome(new BigDecimal("1200000"))
                .build();
    }

    // ── createCustomer ────────────────────────────────────────────────────────

    @Test
    void createCustomer_validRequest_createsAndReturnsCustomer() {
        when(customerRepo.existsByEmailAndDeletedFalse("ravi@example.com")).thenReturn(false);
        when(customerRepo.existsByNationalIdAndDeletedFalse("ABCDE1234F")).thenReturn(false);

        // Mock IAM response
        IamUserResponse userData = IamUserResponse.builder()
                .userId(50L)
                .username("ravikumar")
                .build();
        IamApiResponse iamResp = new IamApiResponse();
        iamResp.setData(userData);
        when(iamServiceClient.createPolicyholderUser(any(CreatePolicyholderUserRequest.class)))
                .thenReturn(iamResp);
        when(customerRepo.save(any(Customer.class))).thenReturn(savedCustomer);

        CustomerResponse result = customerService.createCustomer(createReq, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getCustomerId()).isEqualTo(1L);
        assertThat(result.getFullName()).isEqualTo("Ravi Kumar");
        assertThat(result.getEmail()).isEqualTo("ravi@example.com");
        verify(customerRepo).save(any(Customer.class));
        verify(eventPublisher).publishAuditEvent(anyString(), eq("CUSTOMER_CREATED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void createCustomer_emailAlreadyExists_throwsConflictException() {
        when(customerRepo.existsByEmailAndDeletedFalse("ravi@example.com")).thenReturn(true);

        assertThatThrownBy(() -> customerService.createCustomer(createReq, 1L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ravi@example.com");

        verify(customerRepo, never()).save(any());
    }

    @Test
    void createCustomer_nationalIdAlreadyExists_throwsConflictException() {
        when(customerRepo.existsByEmailAndDeletedFalse("ravi@example.com")).thenReturn(false);
        when(customerRepo.existsByNationalIdAndDeletedFalse("ABCDE1234F")).thenReturn(true);

        assertThatThrownBy(() -> customerService.createCustomer(createReq, 1L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("National ID");
    }

    @Test
    void createCustomer_missingTemporaryPassword_throwsBusinessRuleException() {
        createReq.setTemporaryPassword(null);

        assertThatThrownBy(() -> customerService.createCustomer(createReq, 1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("temporary password");
    }

    @Test
    void createCustomer_blankTemporaryPassword_throwsBusinessRuleException() {
        createReq.setTemporaryPassword("   ");

        assertThatThrownBy(() -> customerService.createCustomer(createReq, 1L))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void createCustomer_iamServiceFails_throwsBusinessRuleException() {
        when(customerRepo.existsByEmailAndDeletedFalse("ravi@example.com")).thenReturn(false);
        when(customerRepo.existsByNationalIdAndDeletedFalse("ABCDE1234F")).thenReturn(false);
        when(iamServiceClient.createPolicyholderUser(any()))
                .thenThrow(new RuntimeException("IAM service down"));

        assertThatThrownBy(() -> customerService.createCustomer(createReq, 1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("portal login");
    }

    // ── createSelfProfile ─────────────────────────────────────────────────────

    @Test
    void createSelfProfile_validRequest_createsAndReturnsCustomer() {
        when(customerRepo.findByUserIdAndDeletedFalse(50L)).thenReturn(Optional.empty());
        when(customerRepo.existsByEmailAndDeletedFalse("ravi@example.com")).thenReturn(false);
        when(customerRepo.existsByNationalIdAndDeletedFalse("ABCDE1234F")).thenReturn(false);
        when(customerRepo.save(any(Customer.class))).thenReturn(savedCustomer);

        CustomerResponse result = customerService.createSelfProfile(createReq, 50L);

        assertThat(result).isNotNull();
        assertThat(result.getCustomerId()).isEqualTo(1L);
        verify(customerRepo).save(any(Customer.class));
        verify(eventPublisher).publishAuditEvent(anyString(), eq("CUSTOMER_SELF_REGISTERED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void createSelfProfile_profileAlreadyExists_throwsConflictException() {
        when(customerRepo.findByUserIdAndDeletedFalse(50L))
                .thenReturn(Optional.of(savedCustomer));

        assertThatThrownBy(() -> customerService.createSelfProfile(createReq, 50L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already have a customer profile");
    }

    // ── getCustomerById ───────────────────────────────────────────────────────

    @Test
    void getCustomerById_existingCustomer_returnsResponse() {
        when(customerRepo.findByCustomerIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(savedCustomer));

        CustomerResponse result = customerService.getCustomerById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getCustomerId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("ravi@example.com");
    }

    @Test
    void getCustomerById_notFound_throwsResourceNotFoundException() {
        when(customerRepo.findByCustomerIdAndDeletedFalse(999L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.getCustomerById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    // ── getCustomerByEmail ────────────────────────────────────────────────────

    @Test
    void getCustomerByEmail_existingEmail_returnsResponse() {
        when(customerRepo.findByEmailAndDeletedFalse("ravi@example.com"))
                .thenReturn(Optional.of(savedCustomer));

        CustomerResponse result = customerService.getCustomerByEmail("ravi@example.com");

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("ravi@example.com");
    }

    @Test
    void getCustomerByEmail_notFound_throwsResourceNotFoundException() {
        when(customerRepo.findByEmailAndDeletedFalse("nobody@example.com"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.getCustomerByEmail("nobody@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── getCustomerByUserId ───────────────────────────────────────────────────

    @Test
    void getCustomerByUserId_existingUserId_returnsResponse() {
        when(customerRepo.findByUserIdAndDeletedFalse(50L))
                .thenReturn(Optional.of(savedCustomer));

        CustomerResponse result = customerService.getCustomerByUserId(50L);

        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(50L);
    }

    @Test
    void getCustomerByUserId_notFound_throwsResourceNotFoundException() {
        when(customerRepo.findByUserIdAndDeletedFalse(999L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.getCustomerByUserId(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("userId: 999");
    }

    // ── updateCustomer ────────────────────────────────────────────────────────

    @Test
    void updateCustomer_existingCustomer_updatesFields() {
        UpdateCustomerRequest updateReq = new UpdateCustomerRequest();
        updateReq.setFullName("Ravi Kumar Updated");
        updateReq.setPhone("9999999999");

        Customer updatedCustomer = Customer.builder()
                .customerId(1L)
                .userId(50L)
                .fullName("Ravi Kumar Updated")
                .email("ravi@example.com")
                .phone("9999999999")
                .nationalId("ABCDE1234F")
                .kycStatus(Customer.KycStatus.PENDING)
                .build();

        when(customerRepo.findByCustomerIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(savedCustomer));
        when(customerRepo.save(any(Customer.class))).thenReturn(updatedCustomer);

        CustomerResponse result = customerService.updateCustomer(1L, updateReq, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getFullName()).isEqualTo("Ravi Kumar Updated");
        assertThat(result.getPhone()).isEqualTo("9999999999");
        verify(eventPublisher).publishAuditEvent(anyString(), eq("CUSTOMER_UPDATED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void updateCustomer_notFound_throwsResourceNotFoundException() {
        when(customerRepo.findByCustomerIdAndDeletedFalse(999L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                customerService.updateCustomer(999L, new UpdateCustomerRequest(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── deleteCustomer ────────────────────────────────────────────────────────

    @Test
    void deleteCustomer_existingCustomer_softDeletes() {
        when(customerRepo.findByCustomerIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(savedCustomer));

        customerService.deleteCustomer(1L, 1L);

        verify(customerRepo).save(argThat(c -> c.isDeleted()));
        verify(eventPublisher).publishAuditEvent(anyString(), eq("CUSTOMER_DELETED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void deleteCustomer_notFound_throwsResourceNotFoundException() {
        when(customerRepo.findByCustomerIdAndDeletedFalse(999L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.deleteCustomer(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── updateKycStatus ───────────────────────────────────────────────────────

    @Test
    void updateKycStatus_toVerified_updatesStatus() {
        savedCustomer.setUserId(50L);
        when(customerRepo.findByCustomerIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(savedCustomer));

        Customer verifiedCustomer = Customer.builder()
                .customerId(1L)
                .userId(50L)
                .email("ravi@example.com")
                .fullName("Ravi Kumar")
                .nationalId("ABCDE1234F")
                .kycStatus(Customer.KycStatus.VERIFIED)
                .build();
        when(customerRepo.save(any(Customer.class))).thenReturn(verifiedCustomer);

        CustomerResponse result = customerService.updateKycStatus(1L, "VERIFIED", null, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getKycStatus()).isEqualTo("VERIFIED");
        verify(eventPublisher).publishAuditEvent(anyString(), eq("KYC_STATUS_UPDATED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void updateKycStatus_toRejected_withoutReason_throwsBusinessRuleException() {
        when(customerRepo.findByCustomerIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(savedCustomer));

        assertThatThrownBy(() ->
                customerService.updateKycStatus(1L, "REJECTED", null, 1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("rejection reason");
    }

    @Test
    void updateKycStatus_toRejected_withReason_succeeds() {
        when(customerRepo.findByCustomerIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(savedCustomer));

        Customer rejectedCustomer = Customer.builder()
                .customerId(1L)
                .email("ravi@example.com")
                .fullName("Ravi Kumar")
                .nationalId("ABCDE1234F")
                .kycStatus(Customer.KycStatus.REJECTED)
                .kycRejectionReason("Documents unclear")
                .build();
        when(customerRepo.save(any(Customer.class))).thenReturn(rejectedCustomer);

        CustomerResponse result = customerService.updateKycStatus(
                1L, "REJECTED", "Documents unclear", 1L);

        assertThat(result).isNotNull();
        assertThat(result.getKycStatus()).isEqualTo("REJECTED");
        assertThat(result.getKycRejectionReason()).isEqualTo("Documents unclear");
    }

    @Test
    void updateKycStatus_invalidStatus_throwsBusinessRuleException() {
        when(customerRepo.findByCustomerIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(savedCustomer));

        assertThatThrownBy(() ->
                customerService.updateKycStatus(1L, "INVALID_STATUS", null, 1L))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Invalid KYC status");
    }
}
