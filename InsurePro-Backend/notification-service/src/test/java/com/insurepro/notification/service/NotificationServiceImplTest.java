package com.insurepro.notification.service;

import com.insurepro.notification.dto.request.UpdatePreferencesRequest;
import com.insurepro.notification.dto.response.NotificationResponse;
import com.insurepro.notification.dto.response.PreferenceResponse;
import com.insurepro.notification.entity.Notification;
import com.insurepro.notification.entity.NotificationPreference;
import com.insurepro.notification.exception.ResourceNotFoundException;
import com.insurepro.notification.repository.NotificationPreferenceRepository;
import com.insurepro.notification.repository.NotificationRepository;
import com.insurepro.notification.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notifRepo;

    @Mock
    private NotificationPreferenceRepository prefRepo;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private Notification sampleNotification;
    private NotificationPreference samplePreference;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        sampleNotification = Notification.builder()
                .notificationId(1L)
                .userId(10L)
                .message("Your policy has been activated.")
                .category("POLICY")
                .channel("IN_APP")
                .status(Notification.NotificationStatus.SENT)
                .build();

        samplePreference = NotificationPreference.builder()
                .userId(10L)
                .emailEnabled(true)
                .smsEnabled(false)
                .inAppEnabled(true)
                .build();

        pageable = PageRequest.of(0, 10);
    }

    // ── createNotification ────────────────────────────────────────────────────

    @Test
    void createNotification_validInput_returnsResponse() {
        when(notifRepo.save(any(Notification.class))).thenReturn(sampleNotification);

        NotificationResponse result = notificationService
                .createNotification(10L, "Your policy has been activated.", "POLICY");

        assertThat(result).isNotNull();
        assertThat(result.getNotificationId()).isEqualTo(1L);
        assertThat(result.getUserId()).isEqualTo(10L);
        assertThat(result.getMessage()).isEqualTo("Your policy has been activated.");
        assertThat(result.getCategory()).isEqualTo("POLICY");
        assertThat(result.getStatus()).isEqualTo("SENT");
        verify(notifRepo).save(any(Notification.class));
    }

    @Test
    void createNotification_nullCategory_defaultsToSystem() {
        Notification systemNotif = Notification.builder()
                .notificationId(2L)
                .userId(10L)
                .message("System message")
                .category("SYSTEM")
                .channel("IN_APP")
                .status(Notification.NotificationStatus.SENT)
                .build();
        when(notifRepo.save(any(Notification.class))).thenReturn(systemNotif);

        NotificationResponse result = notificationService
                .createNotification(10L, "System message", null);

        assertThat(result).isNotNull();
        assertThat(result.getCategory()).isEqualTo("SYSTEM");
    }

    // ── listNotifications ─────────────────────────────────────────────────────

    @Test
    void listNotifications_returnsPagedResults() {
        Page<Notification> page = new PageImpl<>(List.of(sampleNotification));
        when(notifRepo.findByUserIdAndDeletedFalse(10L, pageable)).thenReturn(page);

        Page<NotificationResponse> result = notificationService
                .listNotifications(10L, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getUserId()).isEqualTo(10L);
        verify(notifRepo).findByUserIdAndDeletedFalse(10L, pageable);
    }

    @Test
    void listNotifications_emptyList_returnsEmptyPage() {
        Page<Notification> emptyPage = new PageImpl<>(List.of());
        when(notifRepo.findByUserIdAndDeletedFalse(999L, pageable)).thenReturn(emptyPage);

        Page<NotificationResponse> result = notificationService
                .listNotifications(999L, pageable);

        assertThat(result.getTotalElements()).isZero();
    }

    // ── markAsRead ────────────────────────────────────────────────────────────

    @Test
    void markAsRead_existingNotification_updatesStatusToRead() {
        Notification readNotif = Notification.builder()
                .notificationId(1L)
                .userId(10L)
                .message("Your policy has been activated.")
                .category("POLICY")
                .channel("IN_APP")
                .status(Notification.NotificationStatus.READ)
                .readAt(LocalDateTime.now())
                .build();
        when(notifRepo.findByNotificationIdAndUserId(1L, 10L))
                .thenReturn(Optional.of(sampleNotification));
        when(notifRepo.save(sampleNotification)).thenReturn(readNotif);

        NotificationResponse result = notificationService.markAsRead(10L, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("READ");
        assertThat(result.getReadAt()).isNotNull();
        verify(notifRepo).save(sampleNotification);
    }

    @Test
    void markAsRead_notFound_throwsResourceNotFoundException() {
        when(notifRepo.findByNotificationIdAndUserId(99L, 10L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(10L, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ── countUnread ───────────────────────────────────────────────────────────

    @Test
    void countUnread_returnsCountFromRepository() {
        when(notifRepo.countByUserIdAndStatus(10L, Notification.NotificationStatus.SENT))
                .thenReturn(5L);

        long count = notificationService.countUnread(10L);

        assertThat(count).isEqualTo(5L);
    }

    @Test
    void countUnread_noUnread_returnsZero() {
        when(notifRepo.countByUserIdAndStatus(10L, Notification.NotificationStatus.SENT))
                .thenReturn(0L);

        long count = notificationService.countUnread(10L);

        assertThat(count).isZero();
    }

    // ── getPreferences ────────────────────────────────────────────────────────

    @Test
    void getPreferences_existingPreference_returnsStoredPreference() {
        when(prefRepo.findByUserId(10L)).thenReturn(Optional.of(samplePreference));

        PreferenceResponse result = notificationService.getPreferences(10L);

        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(10L);
        assertThat(result.isEmailEnabled()).isTrue();
        assertThat(result.isSmsEnabled()).isFalse();
        assertThat(result.isInAppEnabled()).isTrue();
    }

    @Test
    void getPreferences_noPreference_returnsDefaultValues() {
        when(prefRepo.findByUserId(999L)).thenReturn(Optional.empty());

        PreferenceResponse result = notificationService.getPreferences(999L);

        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(999L);
    }

    // ── updatePreferences ─────────────────────────────────────────────────────

    @Test
    void updatePreferences_existingPreference_updatesAndReturns() {
        UpdatePreferencesRequest req = new UpdatePreferencesRequest();
        req.setEmailEnabled(false);
        req.setSmsEnabled(true);
        req.setInAppEnabled(true);

        NotificationPreference updatedPref = NotificationPreference.builder()
                .userId(10L)
                .emailEnabled(false)
                .smsEnabled(true)
                .inAppEnabled(true)
                .build();

        when(prefRepo.findByUserId(10L)).thenReturn(Optional.of(samplePreference));
        when(prefRepo.save(any(NotificationPreference.class))).thenReturn(updatedPref);

        PreferenceResponse result = notificationService.updatePreferences(10L, req);

        assertThat(result).isNotNull();
        assertThat(result.isEmailEnabled()).isFalse();
        assertThat(result.isSmsEnabled()).isTrue();
        verify(prefRepo).save(any(NotificationPreference.class));
    }

    @Test
    void updatePreferences_newUser_createsPreference() {
        UpdatePreferencesRequest req = new UpdatePreferencesRequest();
        req.setEmailEnabled(true);
        req.setSmsEnabled(true);
        req.setInAppEnabled(false);

        NotificationPreference newPref = NotificationPreference.builder()
                .userId(20L)
                .emailEnabled(true)
                .smsEnabled(true)
                .inAppEnabled(false)
                .build();

        when(prefRepo.findByUserId(20L)).thenReturn(Optional.empty());
        when(prefRepo.save(any(NotificationPreference.class))).thenReturn(newPref);

        PreferenceResponse result = notificationService.updatePreferences(20L, req);

        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(20L);
        verify(prefRepo).save(any(NotificationPreference.class));
    }
}
