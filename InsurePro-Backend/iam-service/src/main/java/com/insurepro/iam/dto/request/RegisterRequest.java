package com.insurepro.iam.dto.request;

import com.insurepro.iam.util.StrongPassword;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Schema(description = "User registration request")
public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50)
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username may only contain letters, digits, dots, dashes, underscores")
    @Schema(example = "john.doe")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 150)
    @Schema(example = "john.doe@example.com")
    private String email;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150)
    @Schema(example = "John Doe")
    private String fullName;

    @StrongPassword
    @Schema(example = "Secure@2024Pass!", description = "Min 12 chars with uppercase, lowercase, digit, special char")
    private String password;

    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number")
    @Schema(example = "+919876543210")
    private String phone;

    @Schema(example = "ROLE_POLICYHOLDER")
    private String role;

    @Schema(description = "Force user to change password on first login (admin/agent use only)")
    @Builder.Default
    private boolean forcePasswordChange = false;
}
