package com.insurepro.iam.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import java.util.Set;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Schema(description = "Authentication response with JWT tokens")
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default private String tokenType = "Bearer";
    private long expiresIn;
    private Long userId;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private Set<String> roles;
    private boolean mfaRequired;
    private boolean forcePasswordChange;
}
