package com.insurepro.customer.dto.request;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal; import java.time.LocalDate;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateCustomerRequest {
    @NotBlank @Size(min=2, max=150) private String fullName;
    @NotNull @Past private LocalDate dateOfBirth;
    @Pattern(regexp="MALE|FEMALE|OTHER") private String gender;
    @NotBlank @Size(min=5, max=50) private String nationalId;
    @NotBlank @Email private String email;
    @Pattern(regexp="^[+]?[0-9]{10,15}$") private String phone;
    private String address;
    @Size(max=100) private String occupation;
    @DecimalMin("0") private BigDecimal annualIncome;

    @Schema(description = "Optional temporary password to create a portal login for this customer. " +
            "Must be at least 12 characters with uppercase, lowercase, digit, and special character.")
    @Size(min = 12, message = "Temporary password must be at least 12 characters")
    private String temporaryPassword;

    @Schema(description = "Optional portal username. If omitted, auto-generated from email prefix.")
    private String portalUsername;
}
