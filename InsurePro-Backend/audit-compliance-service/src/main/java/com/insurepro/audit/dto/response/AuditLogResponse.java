package com.insurepro.audit.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLogResponse {
    private Long auditId; private Long userId; private String username;
    private String action; private String resource; private String resourceId;
    private String ipAddress; private String details; private String serviceName;
    private LocalDateTime timestamp;
}
