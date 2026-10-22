package com.insurepro.policy.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PolicyTypeResponse {
    private Long typeId;
    private String name;
    private String description;
    private BigDecimal basePremium;
    private String coverageLimits;
    private boolean underwritingRequired;
    private boolean active;
    private LocalDateTime createdAt;
}
