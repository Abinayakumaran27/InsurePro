package com.insurepro.policy.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CustomerServiceClientFallback implements CustomerServiceClient {

    @Override
    public CustomerApiWrapper getCustomerById(Long customerId) {
        log.warn("CustomerServiceClient fallback — cannot verify KYC for customerId={}", customerId);
        return null;
    }

    @Override
    public CustomerApiWrapper getMyProfile() {
        log.warn("CustomerServiceClient fallback — cannot resolve policyholder profile");
        return null;
    }
}
