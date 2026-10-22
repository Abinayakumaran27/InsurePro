package com.insurepro.customer.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity @Table(name="kyc_records") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KycRecord {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="kyc_id") private Long kycId;
    @Column(name="customer_id", nullable=false) private Long customerId;
    @Column(name="document_type", nullable=false, length=50) private String documentType;
    @Column(name="document_number", nullable=false, length=100) private String documentNumber;
    @Column(name="document_url", length=500) private String documentUrl;
    @Column(name="verification_provider", length=100) private String verificationProvider;
    @Column(name="verification_ref", length=200) private String verificationRef;
    @Column(name="status", nullable=false, length=30) @Builder.Default private String status = "PENDING";
    @Column(name="verified_at") private LocalDateTime verifiedAt;
    @Column(name="expires_at") private LocalDateTime expiresAt;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
}
