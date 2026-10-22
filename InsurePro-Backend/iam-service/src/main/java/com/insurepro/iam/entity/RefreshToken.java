package com.insurepro.iam.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_id") private Long tokenId;

    @Column(name = "user_id", nullable = false) private Long userId;

    /**
     * SHA-256 hash of the token. Raw token is returned to client; only hash stored.
     * This prevents token theft from DB compromise.
     */
    @Column(name = "token_hash", nullable = false) private String tokenHash;

    @Column(name = "expiry_date", nullable = false) private LocalDateTime expiryDate;

    @Column(name = "revoked", nullable = false) @Builder.Default private boolean revoked = false;

    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;

    public boolean isExpired() {
        return expiryDate.isBefore(LocalDateTime.now());
    }
}
