package com.insurepro.notification.repository;
import com.insurepro.notification.entity.Notification;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserIdAndDeletedFalse(Long userId, Pageable pageable);
    Optional<Notification> findByNotificationIdAndUserId(Long id, Long userId);
    long countByUserIdAndStatus(Long userId, Notification.NotificationStatus status);
}
