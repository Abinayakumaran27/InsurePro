package com.insurepro.notification.dto.response;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PreferenceResponse {
    private Long userId; private boolean emailEnabled; private boolean smsEnabled; private boolean inAppEnabled;
}
