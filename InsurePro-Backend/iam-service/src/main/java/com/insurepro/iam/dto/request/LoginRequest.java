package com.insurepro.iam.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Schema(description = "Login request")
public class LoginRequest {
    @NotBlank @Schema(example = "john.doe") private String username;
    @NotBlank @Schema(example = "Secure@2024Pass!") private String password;
    @Schema(description = "TOTP code for MFA-enabled accounts", example = "123456") private String totpCode;
}
