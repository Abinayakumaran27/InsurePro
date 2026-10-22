package com.insurepro.customer.client.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreatePolicyholderUserRequest {
    private String username;
    private String email;
    private String fullName;
    private String password;
    private String phone;
    private String role;
    private boolean forcePasswordChange;
}
