package com.insurepro.iam.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private Set<String> roles;
    private String status;
    private boolean mfaEnabled;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
