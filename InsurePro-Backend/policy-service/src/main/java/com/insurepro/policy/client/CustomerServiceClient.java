package com.insurepro.policy.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "customer-service", fallback = CustomerServiceClientFallback.class)
public interface CustomerServiceClient {

    @GetMapping("/api/v1/customers/{customerId}")
    CustomerApiWrapper getCustomerById(@PathVariable Long customerId);

    @GetMapping("/api/v1/customers/my-profile")
    CustomerApiWrapper getMyProfile();

    @Getter @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    class CustomerApiWrapper {
        private CustomerDto data;
    }

    @Getter @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    class CustomerDto {
        private Long customerId;
        private Long userId;
        private String fullName;
        private String email;
        private String kycStatus;
        private java.time.LocalDate dateOfBirth;
    }
}
