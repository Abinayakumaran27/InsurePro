package com.insurepro.customer.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal; import java.time.LocalDate; import java.time.LocalDateTime;
@Entity @Table(name="customers") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Customer {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="customer_id") private Long customerId;
    @Column(name="user_id") private Long userId;
    @Column(name="full_name", nullable=false, length=150) private String fullName;
    @Column(name="date_of_birth", nullable=false) private LocalDate dateOfBirth;
    @Column(name="gender", length=10) private String gender;
    @Column(name="national_id", nullable=false, unique=true, length=50) private String nationalId;
    @Column(name="email", nullable=false, unique=true, length=150) private String email;
    @Column(name="phone", length=20) private String phone;
    @Column(name="address", columnDefinition="TEXT") private String address;
    @Column(name="kyc_status", nullable=false, length=30) @Enumerated(EnumType.STRING) @Builder.Default private KycStatus kycStatus = KycStatus.PENDING;
    @Column(name="kyc_rejection_reason", columnDefinition="TEXT") private String kycRejectionReason;
    @Column(name="occupation", length=100) private String occupation;
    @Column(name="annual_income", precision=15, scale=2) private BigDecimal annualIncome;
    @Column(name="risk_category", length=20) @Builder.Default private String riskCategory = "LOW";
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") private LocalDateTime updatedAt;
    @Column(name="created_by", length=100) private String createdBy;
    @Column(name="modified_by", length=100) private String modifiedBy;
    @Column(name="deleted") @Builder.Default private boolean deleted = false;
    public enum KycStatus { PENDING, IN_PROGRESS, VERIFIED, REJECTED, EXPIRED }
}
