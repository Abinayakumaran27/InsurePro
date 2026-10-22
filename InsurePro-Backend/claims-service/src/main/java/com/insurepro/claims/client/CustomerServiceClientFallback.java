package com.insurepro.claims.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CustomerServiceClientFallback
        implements CustomerServiceClient {

    @Override
    public CustomerServiceClient.CustomerDto getCustomerById(
            Long customerId) {
        log.warn("Customer service unavailable for id: {}", customerId);
        CustomerServiceClient.CustomerDto dto =
                new CustomerServiceClient.CustomerDto();
        dto.setCustomerId(customerId);
        dto.setFullName("Customer");
        dto.setEmail("");
        return dto;
    }
}