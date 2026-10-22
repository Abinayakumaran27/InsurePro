package com.insurepro.claims.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.Getter;
import lombok.Setter;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "customer-service",
             fallback = CustomerServiceClientFallback.class)
public interface CustomerServiceClient {

    @CircuitBreaker(name = "customer-service")
    @Retry(name = "customer-service")
    @GetMapping("/api/v1/customers/{customerId}")
    CustomerDto getCustomerById(@PathVariable Long customerId);

    @Getter
    @Setter
    class CustomerDto {
        private Long customerId;
        private String fullName;
        private String email;
        private String phone;
    }
}