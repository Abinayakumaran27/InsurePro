package com.insurepro.analytics.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KpiResponse {
    private String kpiName; private String value; private String unit;
    private String trend; private LocalDateTime calculatedAt;
}
