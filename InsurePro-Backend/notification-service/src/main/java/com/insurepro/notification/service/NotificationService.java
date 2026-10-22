package com.insurepro.notification.service;
import com.insurepro.notification.dto.request.UpdatePreferencesRequest;
import com.insurepro.notification.dto.response.NotificationResponse;
import com.insurepro.notification.dto.response.PreferenceResponse;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
public interface NotificationService {
    Page<NotificationResponse> listNotifications(Long userId, Pageable pageable);
    NotificationResponse markAsRead(Long userId, Long notificationId);
    long countUnread(Long userId);
    PreferenceResponse updatePreferences(Long userId, UpdatePreferencesRequest req);
    PreferenceResponse getPreferences(Long userId);
    NotificationResponse createNotification(Long userId, String message, String category);
}
