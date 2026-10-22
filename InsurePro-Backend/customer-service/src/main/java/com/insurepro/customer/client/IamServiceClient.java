package com.insurepro.customer.client;

import com.insurepro.customer.client.dto.CreatePolicyholderUserRequest;
import com.insurepro.customer.client.dto.IamApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "iam-service", url = "${services.iam.url:http://localhost:8081}")
public interface IamServiceClient {

    @PostMapping("/api/v1/auth/customers/register")
    IamApiResponse createPolicyholderUser(@RequestBody CreatePolicyholderUserRequest request);

    @org.springframework.web.bind.annotation.GetMapping("/api/v1/auth/users/{userId}")
    IamApiResponse getUserById(@org.springframework.web.bind.annotation.PathVariable("userId") Long userId);
}
