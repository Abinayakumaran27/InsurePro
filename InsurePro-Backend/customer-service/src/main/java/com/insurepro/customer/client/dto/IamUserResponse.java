package com.insurepro.customer.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class IamUserResponse {
    private Long userId;
    private String username;
    private String email;
    private String fullName;
}
