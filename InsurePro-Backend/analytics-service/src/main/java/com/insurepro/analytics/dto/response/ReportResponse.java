package com.insurepro.analytics.dto.response;
import lombok.*;
import java.time.LocalDate; import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportResponse {
    private Long reportId; private String kpiName; private String reportType;
    private String scope; private LocalDate periodStart; private LocalDate periodEnd;
    private String metrics; private Long generatedBy; private LocalDateTime generatedAt;
}
