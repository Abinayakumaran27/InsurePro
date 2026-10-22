package com.insurepro.notification.controller;

import com.insurepro.notification.dto.request.UpdatePreferencesRequest;
import com.insurepro.notification.dto.response.*;
import com.insurepro.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications",
     description = "Notification management, preferences and read status")
@PreAuthorize("isAuthenticated()")
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // ── Internal: create notification (service-to-service) ──────────────────

    @PostMapping("/internal")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Create notification (internal)",
               description = "Used by other microservices to push in-app notifications. No user JWT required.")
    public ResponseEntity<Void> createInternal(
            @RequestParam Long userId,
            @RequestParam String message,
            @RequestParam(required = false) String category) {
        notificationService.createNotification(userId, message, category);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // ── List Notifications ───────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List my notifications",
               description = "Returns paginated list of notifications for current user.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> list(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort direction: asc or desc")
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by("createdAt").ascending()
                : Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.listNotifications(userId, pageable)));
    }

    // ── Mark as Read ─────────────────────────────────────────────────────────

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark notification as read",
               description = "Marks a specific notification as read.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.markAsRead(userId, id),
                "Marked as read"));
    }

    // ── Unread Count ─────────────────────────────────────────────────────────

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count",
               description = "Returns count of unread notifications for current user.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Long>> unreadCount(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.countUnread(userId)));
    }

    // ── Get Preferences ──────────────────────────────────────────────────────

    @GetMapping("/preferences")
    @Operation(summary = "Get notification preferences",
               description = "Returns notification preferences for current user.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PreferenceResponse>> getPrefs(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.getPreferences(userId)));
    }

    // ── Update Preferences ───────────────────────────────────────────────────

    @PutMapping("/preferences")
    @Operation(summary = "Update notification preferences",
               description = "Updates notification channel preferences for current user.",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PreferenceResponse>> updatePrefs(
            @RequestBody UpdatePreferencesRequest req,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.updatePreferences(userId, req),
                "Preferences updated successfully"));
    }
}