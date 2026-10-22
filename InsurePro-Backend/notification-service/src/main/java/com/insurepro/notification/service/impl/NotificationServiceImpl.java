package com.insurepro.notification.service.impl;
import com.insurepro.notification.dto.request.UpdatePreferencesRequest;
import com.insurepro.notification.dto.response.NotificationResponse;
import com.insurepro.notification.dto.response.PreferenceResponse;
import com.insurepro.notification.entity.Notification; import com.insurepro.notification.entity.NotificationPreference;
import com.insurepro.notification.exception.ResourceNotFoundException;
import com.insurepro.notification.repository.*;
import com.insurepro.notification.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
@Service @Slf4j
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notifRepo;
    private final NotificationPreferenceRepository prefRepo;
    public NotificationServiceImpl(NotificationRepository notifRepo, NotificationPreferenceRepository prefRepo) {
        this.notifRepo = notifRepo; this.prefRepo = prefRepo;
    }
    @Override @Transactional(readOnly=true)
    public Page<NotificationResponse> listNotifications(Long userId, Pageable pageable) {
        return notifRepo.findByUserIdAndDeletedFalse(userId, pageable).map(this::toResponse);
    }
    @Override @Transactional
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification n = notifRepo.findByNotificationIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        n.setStatus(Notification.NotificationStatus.READ); n.setReadAt(LocalDateTime.now());
        return toResponse(notifRepo.save(n));
    }
    @Override @Transactional(readOnly=true)
    public long countUnread(Long userId) { return notifRepo.countByUserIdAndStatus(userId, Notification.NotificationStatus.SENT); }
    @Override @Transactional
    public PreferenceResponse updatePreferences(Long userId, UpdatePreferencesRequest req) {
        NotificationPreference pref = prefRepo.findByUserId(userId)
            .orElseGet(() -> NotificationPreference.builder().userId(userId).build());
        pref.setEmailEnabled(req.isEmailEnabled()); pref.setSmsEnabled(req.isSmsEnabled()); pref.setInAppEnabled(req.isInAppEnabled());
        return toPrefResponse(prefRepo.save(pref));
    }
    @Override @Transactional(readOnly=true)
    public PreferenceResponse getPreferences(Long userId) {
        return toPrefResponse(prefRepo.findByUserId(userId).orElseGet(() -> NotificationPreference.builder().userId(userId).build()));
    }
    @Override @Transactional
    public NotificationResponse createNotification(Long userId, String message, String category) {
        Notification n = Notification.builder()
            .userId(userId)
            .message(message)
            .category(category != null ? category : "SYSTEM")
            .channel("IN_APP")
            .status(Notification.NotificationStatus.SENT)
            .build();
        return toResponse(notifRepo.save(n));
    }
    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder().notificationId(n.getNotificationId()).userId(n.getUserId())
            .message(n.getMessage()).category(n.getCategory()).channel(n.getChannel())
            .status(n.getStatus().name()).readAt(n.getReadAt()).createdAt(n.getCreatedAt()).build();
    }
    private PreferenceResponse toPrefResponse(NotificationPreference p) {
        return PreferenceResponse.builder().userId(p.getUserId()).emailEnabled(p.isEmailEnabled())
            .smsEnabled(p.isSmsEnabled()).inAppEnabled(p.isInAppEnabled()).build();
    }
}
