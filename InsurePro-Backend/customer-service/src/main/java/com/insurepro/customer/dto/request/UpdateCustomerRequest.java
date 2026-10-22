package com.insurepro.customer.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateCustomerRequest {
    @Size(min=2, max=150) private String fullName;
    @Pattern(regexp="^[+]?[0-9]{10,15}$") private String phone;
    private String address;
    @Size(max=100) private String occupation;
    @DecimalMin("0") private BigDecimal annualIncome;
}
