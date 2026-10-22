package com.insurepro.payment.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class NotificationServiceClientFallback implements NotificationServiceClient {

    @Override
    public void createNotification(Long userId, String message, String category) {
        log.warn("NotificationServiceClient fallback — notification not delivered: userId={} category={}", userId, category);
    }
}
