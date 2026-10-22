package com.insurepro.customer.dto.response;
import lombok.*;
import java.math.BigDecimal; import java.time.LocalDate; import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomerResponse {
    private Long customerId; private Long userId; private String fullName;
    private LocalDate dateOfBirth; private String gender; private String nationalId;
    private String email; private String phone; private String address;
    private String kycStatus; private String kycRejectionReason; private String occupation; private BigDecimal annualIncome;
    private String riskCategory; private String createdBy; private String createdByName;
    private LocalDateTime createdAt; private LocalDateTime updatedAt;
}
