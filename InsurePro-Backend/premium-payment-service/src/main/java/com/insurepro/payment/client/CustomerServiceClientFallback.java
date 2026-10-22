package com.insurepro.payment.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CustomerServiceClientFallback implements CustomerServiceClient {

    @Override
    public CustomerDto getCustomerById(Long customerId) {
        log.warn("CustomerServiceClient fallback — customer-service unavailable for customerId={}", customerId);
        return null;
    }
}
