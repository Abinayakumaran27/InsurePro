package com.insurepro.document.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "notification-service", fallback = NotificationServiceClientFallback.class)
public interface NotificationServiceClient {

    @PostMapping("/api/v1/notifications/internal")
    void createNotification(
            @RequestParam Long userId,
            @RequestParam String message,
            @RequestParam(required = false) String category);
}
