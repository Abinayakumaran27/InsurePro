package com.insurepro.customer.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class IamApiResponse {
    private IamUserResponse data;
    private String message;
    private boolean success;
}
