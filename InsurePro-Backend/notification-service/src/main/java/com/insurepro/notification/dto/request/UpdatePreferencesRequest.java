package com.insurepro.notification.dto.request;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdatePreferencesRequest {
    private boolean emailEnabled; private boolean smsEnabled; private boolean inAppEnabled;
}
