package com.insurepro.iam.service.impl;

import com.insurepro.iam.dto.request.LoginRequest;
import com.insurepro.iam.dto.request.RefreshTokenRequest;
import com.insurepro.iam.dto.request.RegisterRequest;
import com.insurepro.iam.dto.response.AuthResponse;
import com.insurepro.iam.dto.response.UserResponse;
import com.insurepro.iam.entity.*;
import com.insurepro.iam.event.EventPublisher;
import com.insurepro.iam.exception.*;
import com.insurepro.iam.repository.*;
import com.insurepro.iam.security.JwtService;
import com.insurepro.iam.security.TokenBlacklistService;
import com.insurepro.iam.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final JwtService jwtService;
    private final TokenBlacklistService blacklistService;
    private final PasswordEncoder passwordEncoder;
    private final EventPublisher eventPublisher;

    @Value("${app.security.max-login-attempts:5}")
    private int maxLoginAttempts;

    @Value("${app.security.lockout-minutes:30}")
    private int lockoutMinutes;

    @Value("${app.security.password-history-count:5}")
    private int passwordHistoryCount;

    @Value("${app.security.reset-token-expiry-hours:1}")
    private int resetTokenExpiryHours;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    public AuthServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordHistoryRepository passwordHistoryRepository,
            JwtService jwtService,
            TokenBlacklistService blacklistService,
            PasswordEncoder passwordEncoder,
            EventPublisher eventPublisher) {
        this.userRepository            = userRepository;
        this.roleRepository            = roleRepository;
        this.refreshTokenRepository    = refreshTokenRepository;
        this.passwordHistoryRepository = passwordHistoryRepository;
        this.jwtService                = jwtService;
        this.blacklistService          = blacklistService;
        this.passwordEncoder           = passwordEncoder;
        this.eventPublisher            = eventPublisher;
    }

    // ── Public Registration (Policyholder only) ──────────────────────────────

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Action=REGISTER, username={}", request.getUsername());

        String requestedRole = resolveRoleName(request.getRole());
        if (!requestedRole.equals("ROLE_POLICYHOLDER")) {
            throw new BusinessRuleException(
                "Public registration is only allowed for policyholders. "
                + "Other roles must be created by an administrator.");
        }

        if (userRepository.existsByUsernameAndDeletedFalse(
                request.getUsername()))
            throw new ConflictException(
                    "Username already taken: " + request.getUsername());
        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail()))
            throw new ConflictException(
                    "Email already registered: " + request.getEmail());

        Role role = roleRepository.findByName(requestedRole)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role not found: " + requestedRole));

        String hashedPw = passwordEncoder.encode(request.getPassword());
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(hashedPw)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .roles(Set.of(role))
                .status(User.UserStatus.ACTIVE)
                .passwordChangedAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        passwordHistoryRepository.save(PasswordHistory.builder()
                .userId(user.getUserId())
                .passwordHash(hashedPw)
                .build());

        String accessToken = jwtService.generateAccessToken(user);
        String refreshRaw  = jwtService.generateRefreshTokenValue(user);
        saveRefreshToken(user.getUserId(), refreshRaw);

        eventPublisher.publishAuditEvent(
                String.valueOf(user.getUserId()),
                "USER_REGISTERED", "users",
                String.valueOf(user.getUserId()),
                "New policyholder: " + user.getEmail());
        eventPublisher.publishNotificationEvent(
                String.valueOf(user.getUserId()),
                "Welcome to InsurePro! Your account is ready.",
                "SYSTEM");

        log.info("Policyholder registered: id={}", user.getUserId());
        return buildAuthResponse(accessToken, refreshRaw, user);
    }

    // ── Admin/Agent Creates Policyholder User (forced password change) ───────

    @Override
    @Transactional
    public UserResponse createPolicyholderUser(RegisterRequest request) {
        log.info("Action=CREATE_POLICYHOLDER_USER, email={}", request.getEmail());

        String username = generateUsername(request.getEmail());

        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail()))
            throw new ConflictException("Email already registered: " + request.getEmail());

        Role role = roleRepository.findByName("ROLE_POLICYHOLDER")
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: ROLE_POLICYHOLDER"));

        String hashedPw = passwordEncoder.encode(request.getPassword());
        User user = User.builder()
                .username(username)
                .email(request.getEmail())
                .passwordHash(hashedPw)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .roles(Set.of(role))
                .status(User.UserStatus.ACTIVE)
                .forcePasswordChange(true)
                .passwordChangedAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        passwordHistoryRepository.save(PasswordHistory.builder()
                .userId(user.getUserId())
                .passwordHash(hashedPw)
                .build());

        eventPublisher.publishAuditEvent(
                "system", "POLICYHOLDER_USER_CREATED", "users",
                String.valueOf(user.getUserId()),
                "Policyholder user created for: " + user.getEmail());

        log.info("Policyholder user created: id={}, username={}", user.getUserId(), username);
        return toUserResponse(user);
    }

    private String generateUsername(String email) {
        String base = email.split("@")[0]
                .toLowerCase()
                .replaceAll("[^a-z0-9._-]", ".");
        if (base.length() > 40) base = base.substring(0, 40);
        if (!userRepository.existsByUsernameAndDeletedFalse(base)) return base;
        for (int i = 1; i <= 99; i++) {
            String candidate = base + "_" + i;
            if (!userRepository.existsByUsernameAndDeletedFalse(candidate)) return candidate;
        }
        return base + "_" + System.currentTimeMillis() % 10000;
    }

    // ── Admin Creates Any Role User ──────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse adminCreateUser(RegisterRequest request) {
        log.info("Action=ADMIN_CREATE_USER, username={}",
                request.getUsername());

        if (userRepository.existsByUsernameAndDeletedFalse(
                request.getUsername()))
            throw new ConflictException(
                    "Username already taken: " + request.getUsername());
        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail()))
            throw new ConflictException(
                    "Email already registered: " + request.getEmail());

        String roleName = resolveRoleName(request.getRole());
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role not found: " + roleName));

        String hashedPw = passwordEncoder.encode(request.getPassword());
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(hashedPw)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .roles(Set.of(role))
                .status(User.UserStatus.ACTIVE)
                .passwordChangedAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        passwordHistoryRepository.save(PasswordHistory.builder()
                .userId(user.getUserId())
                .passwordHash(hashedPw)
                .build());

        eventPublisher.publishAuditEvent(
                "admin", "ADMIN_USER_CREATED", "users",
                String.valueOf(user.getUserId()),
                "Admin created user: " + user.getEmail()
                + " with role: " + roleName);

        log.info("Admin created user: id={}, role={}",
                user.getUserId(), roleName);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshRaw  = jwtService.generateRefreshTokenValue(user);
        saveRefreshToken(user.getUserId(), refreshRaw);

        return buildAuthResponse(accessToken, refreshRaw, user);
    }

    // ── Login ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request,
                               String ipAddress,
                               String userAgent) {
        log.info("Action=LOGIN, username={}, ip={}",
                request.getUsername(), ipAddress);

        User user = userRepository
                .findByUsernameAndDeletedFalse(request.getUsername())
                .orElseThrow(() -> {
                    log.warn("Login failed - user not found: {}",
                            request.getUsername());
                    return new AuthenticationException("Invalid credentials");
                });

        if (user.isAccountLocked()) {
            throw new AccountLockedException(
                    "Account locked until " + user.getLockedUntil()
                    + ". Contact admin or wait.");
        }

        if (!user.getStatus().equals(User.UserStatus.ACTIVE)) {
            throw new AuthenticationException(
                    "Account is "
                    + user.getStatus().name().toLowerCase());
        }

        if (!passwordEncoder.matches(
                request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new AuthenticationException("Invalid credentials");
        }

        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        refreshTokenRepository.revokeAllByUserId(user.getUserId());

        String accessToken = jwtService.generateAccessToken(user);
        String refreshRaw  = jwtService.generateRefreshTokenValue(user);
        saveRefreshToken(user.getUserId(), refreshRaw);

        eventPublisher.publishAuditEvent(
                String.valueOf(user.getUserId()),
                "USER_LOGIN", "auth",
                String.valueOf(user.getUserId()),
                "Login from IP: " + ipAddress);

        return buildAuthResponse(accessToken, refreshRaw, user);
    }

    // ── Refresh Token ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (!jwtService.isTokenValid(request.getRefreshToken()))
            throw new AuthenticationException("Invalid refresh token");

        String hash = sha256(request.getRefreshToken());
        RefreshToken stored = refreshTokenRepository
                .findByTokenHashAndRevokedFalse(hash)
                .orElseThrow(() -> new AuthenticationException(
                        "Refresh token not found or revoked"));

        if (stored.isExpired()) {
            refreshTokenRepository.delete(stored);
            throw new AuthenticationException(
                    "Refresh token expired. Please login again.");
        }

        User user = userRepository
                .findByUserIdAndDeletedFalse(stored.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found"));

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        String newAccess  = jwtService.generateAccessToken(user);
        String newRefresh = jwtService.generateRefreshTokenValue(user);
        saveRefreshToken(user.getUserId(), newRefresh);

        return buildAuthResponse(newAccess, newRefresh, user);
    }

    // ── Logout ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void logout(String accessToken, Long userId) {
        try {
            var claims = jwtService.extractClaims(accessToken);
            long remaining = claims.getExpiration().getTime()
                    - System.currentTimeMillis();
            if (remaining > 0)
                blacklistService.blacklistToken(accessToken, remaining);
        } catch (Exception e) {
            log.warn("Could not blacklist token on logout: {}",
                    e.getMessage());
        }
        refreshTokenRepository.revokeAllByUserId(userId);
        log.info("User {} logged out", userId);
    }

    // ── Get User by ID ───────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        return toUserResponse(userRepository
                .findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found: " + userId)));
    }

    // ── List Users (includes inactive so admins can reactivate) ─────────────

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::toUserResponse);
    }

    // ── Deactivate User ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deactivateUser(Long userId) {
        User user = userRepository
                .findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found: " + userId));
        user.setDeleted(true);
        user.setStatus(User.UserStatus.INACTIVE);
        userRepository.save(user);
        refreshTokenRepository.revokeAllByUserId(userId);
        eventPublisher.publishAuditEvent(
                "admin", "USER_DEACTIVATED", "users",
                String.valueOf(userId), "User soft-deleted");
    }

    // ── Reactivate User ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public void reactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found: " + userId));
        user.setDeleted(false);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setLockedUntil(null);
        user.setFailedLoginCount(0);
        userRepository.save(user);
        eventPublisher.publishAuditEvent(
                "admin", "USER_REACTIVATED", "users",
                String.valueOf(userId), "User reactivated");
    }

    // ── Unlock User ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void unlockUser(Long userId) {
        User user = userRepository
                .findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found: " + userId));
        user.setLockedUntil(null);
        user.setFailedLoginCount(0);
        user.setStatus(User.UserStatus.ACTIVE);
        userRepository.save(user);
        log.info("User {} unlocked", userId);
    }

    // ── Change Password ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public void changePassword(Long userId, String currentPassword,
                                String newPassword) {
        User user = userRepository
                .findByUserIdAndDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found"));

        if (!passwordEncoder.matches(
                currentPassword, user.getPasswordHash()))
            throw new AuthenticationException(
                    "Current password is incorrect");

        List<PasswordHistory> history = passwordHistoryRepository
                .findRecentByUserId(userId, passwordHistoryCount);
        boolean reused = history.stream()
                .anyMatch(ph -> passwordEncoder.matches(
                        newPassword, ph.getPasswordHash()));
        if (reused)
            throw new BusinessRuleException(
                    "Password was recently used. Choose a different one.");

        String hash = passwordEncoder.encode(newPassword);
        user.setPasswordHash(hash);
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setForcePasswordChange(false);
        userRepository.save(user);

        passwordHistoryRepository.save(PasswordHistory.builder()
                .userId(userId).passwordHash(hash).build());
        refreshTokenRepository.revokeAllByUserId(userId);
        log.info("Password changed for user {}", userId);
    }

    // ── Request Password Reset ───────────────────────────────────────────────

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmailAndDeletedFalse(email)
                .ifPresent(user -> {
                    String token = UUID.randomUUID().toString();
                    user.setPasswordResetToken(sha256(token));
                    user.setResetTokenExpiry(LocalDateTime.now()
                            .plusHours(resetTokenExpiryHours));
                    userRepository.save(user);
                    log.info("Password reset token generated for: {}", user.getEmail());
                });
    }

    // ── Reset Password ───────────────────────────────────────────────────────

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        String hashed = sha256(token);
        User user = userRepository.findByPasswordResetToken(hashed)
                .filter(u -> u.getResetTokenExpiry() != null
                        && u.getResetTokenExpiry().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new AuthenticationException(
                        "Invalid or expired reset token"));

        String hash = passwordEncoder.encode(newPassword);
        user.setPasswordHash(hash);
        user.setPasswordResetToken(null);
        user.setResetTokenExpiry(null);
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        passwordHistoryRepository.save(PasswordHistory.builder()
                .userId(user.getUserId())
                .passwordHash(hash)
                .build());
    }

    @Override
    @Transactional
    public void resetPasswordByUsername(String username, String newPassword) {
        User user = userRepository.findByUsernameAndDeletedFalse(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password reset by username for user: {}", username);
    }
    // ── Validate Token ───────────────────────────────────────────────────────

    @Override
    public boolean validateToken(String token) {
        return !blacklistService.isBlacklisted(token)
                && jwtService.isTokenValid(token);
    }

    // ── Scheduled Cleanup ────────────────────────────────────────────────────

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpired(LocalDateTime.now());
        log.debug("Expired refresh tokens cleaned up");
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private void handleFailedLogin(User user) {
        user.setFailedLoginCount(user.getFailedLoginCount() + 1);
        if (user.getFailedLoginCount() >= maxLoginAttempts) {
            user.setLockedUntil(
                    LocalDateTime.now().plusMinutes(lockoutMinutes));
            user.setStatus(User.UserStatus.LOCKED);
            log.warn("Account locked: user={} after {} attempts",
                    user.getUsername(), maxLoginAttempts);
        }
        userRepository.save(user);
    }

    private void saveRefreshToken(Long userId, String rawToken) {
        RefreshToken rt = RefreshToken.builder()
                .userId(userId)
                .tokenHash(sha256(rawToken))
                .expiryDate(LocalDateTime.now()
                        .plusSeconds(refreshExpiration / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rt);
    }

    private AuthResponse buildAuthResponse(String access,
                                            String refresh,
                                            User user) {
        return AuthResponse.builder()
                .accessToken(access)
                .refreshToken(refresh)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessExpirationSeconds())
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .mfaRequired(false)
                .forcePasswordChange(user.isForcePasswordChange())
                .build();
    }

    private UserResponse toUserResponse(User u) {
        return UserResponse.builder()
                .userId(u.getUserId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .roles(u.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .status(u.getStatus().name())
                .mfaEnabled(u.isMfaEnabled())
                .lastLoginAt(u.getLastLoginAt())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private String resolveRoleName(String role) {
        if (role == null || role.isBlank()) return "ROLE_POLICYHOLDER";
        String upper = role.toUpperCase();
        return upper.startsWith("ROLE_") ? upper : "ROLE_" + upper;
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(
                    input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

}