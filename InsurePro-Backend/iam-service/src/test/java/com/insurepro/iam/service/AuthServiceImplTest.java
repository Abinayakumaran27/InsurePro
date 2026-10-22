package com.insurepro.iam.service;

import com.insurepro.iam.dto.request.LoginRequest;
import com.insurepro.iam.dto.request.RegisterRequest;
import com.insurepro.iam.dto.response.AuthResponse;
import com.insurepro.iam.dto.response.UserResponse;
import com.insurepro.iam.entity.*;
import com.insurepro.iam.event.EventPublisher;
import com.insurepro.iam.exception.*;
import com.insurepro.iam.repository.*;
import com.insurepro.iam.security.JwtService;
import com.insurepro.iam.security.TokenBlacklistService;
import com.insurepro.iam.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordHistoryRepository passwordHistoryRepository;
    @Mock private JwtService jwtService;
    @Mock private TokenBlacklistService blacklistService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EventPublisher eventPublisher;

    @InjectMocks
    private AuthServiceImpl authService;

    private Role policyholderRole;
    private User activeUser;

    @BeforeEach
    void setUp() {
        // Inject @Value fields
        ReflectionTestUtils.setField(authService, "maxLoginAttempts", 5);
        ReflectionTestUtils.setField(authService, "lockoutMinutes", 30);
        ReflectionTestUtils.setField(authService, "passwordHistoryCount", 5);
        ReflectionTestUtils.setField(authService, "resetTokenExpiryHours", 1);
        ReflectionTestUtils.setField(authService, "refreshExpiration", 604800000L);

        policyholderRole = Role.builder()
                .roleId(1L)
                .name("ROLE_POLICYHOLDER")
                .build();

        activeUser = User.builder()
                .userId(10L)
                .username("ravi_kumar")
                .email("ravi@example.com")
                .passwordHash("$2a$10$hashedpassword")
                .fullName("Ravi Kumar")
                .phone("9876543210")
                .roles(Set.of(policyholderRole))
                .status(User.UserStatus.ACTIVE)
                .passwordChangedAt(LocalDateTime.now())
                .build();
    }

    // ── register ──────────────────────────────────────────────────────────────

    @Test
    void register_validPolicyholder_returnsAuthResponse() {
        RegisterRequest req = buildRegisterRequest("ravi_kumar",
                "ravi@example.com", "ROLE_POLICYHOLDER");

        when(userRepository.existsByUsernameAndDeletedFalse("ravi_kumar")).thenReturn(false);
        when(userRepository.existsByEmailAndDeletedFalse("ravi@example.com")).thenReturn(false);
        when(roleRepository.findByName("ROLE_POLICYHOLDER")).thenReturn(Optional.of(policyholderRole));
        when(passwordEncoder.encode("Secure@123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(activeUser);
        when(passwordHistoryRepository.save(any())).thenReturn(null);
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");
        when(jwtService.generateRefreshTokenValue(any())).thenReturn("refresh-token");
        when(jwtService.getAccessExpirationSeconds()).thenReturn(3600L);
        when(refreshTokenRepository.save(any())).thenReturn(null);

        AuthResponse result = authService.register(req);

        assertThat(result).isNotNull();
        assertThat(result.getAccessToken()).isEqualTo("access-token");
        assertThat(result.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(result.getTokenType()).isEqualTo("Bearer");
        verify(userRepository).save(any(User.class));
        verify(eventPublisher).publishAuditEvent(anyString(), eq("USER_REGISTERED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void register_nonPolicyholderRole_throwsBusinessRuleException() {
        RegisterRequest req = buildRegisterRequest("admin_user",
                "admin@example.com", "ROLE_ADMIN");

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("policyholders");
    }

    @Test
    void register_duplicateUsername_throwsConflictException() {
        RegisterRequest req = buildRegisterRequest("ravi_kumar",
                "ravi@example.com", "ROLE_POLICYHOLDER");
        when(userRepository.existsByUsernameAndDeletedFalse("ravi_kumar")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ravi_kumar");
    }

    @Test
    void register_duplicateEmail_throwsConflictException() {
        RegisterRequest req = buildRegisterRequest("ravi_kumar",
                "ravi@example.com", "ROLE_POLICYHOLDER");
        when(userRepository.existsByUsernameAndDeletedFalse("ravi_kumar")).thenReturn(false);
        when(userRepository.existsByEmailAndDeletedFalse("ravi@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ravi@example.com");
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_validCredentials_returnsAuthResponse() {
        LoginRequest req = new LoginRequest();
        req.setUsername("ravi_kumar");
        req.setPassword("Secure@123");

        when(userRepository.findByUsernameAndDeletedFalse("ravi_kumar"))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("Secure@123", "$2a$10$hashedpassword")).thenReturn(true);
        when(userRepository.save(any())).thenReturn(activeUser);
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");
        when(jwtService.generateRefreshTokenValue(any())).thenReturn("refresh-token");
        when(jwtService.getAccessExpirationSeconds()).thenReturn(3600L);
        when(refreshTokenRepository.save(any())).thenReturn(null);

        AuthResponse result = authService.login(req, "192.168.1.1", "Chrome");

        assertThat(result).isNotNull();
        assertThat(result.getAccessToken()).isEqualTo("access-token");
        assertThat(result.getUsername()).isEqualTo("ravi_kumar");
    }

    @Test
    void login_userNotFound_throwsAuthenticationException() {
        LoginRequest req = new LoginRequest();
        req.setUsername("nobody");
        req.setPassword("pass");
        when(userRepository.findByUsernameAndDeletedFalse("nobody"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req, "127.0.0.1", "browser"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void login_wrongPassword_throwsAuthenticationException() {
        LoginRequest req = new LoginRequest();
        req.setUsername("ravi_kumar");
        req.setPassword("WrongPass");
        when(userRepository.findByUsernameAndDeletedFalse("ravi_kumar"))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("WrongPass", "$2a$10$hashedpassword")).thenReturn(false);
        when(userRepository.save(any())).thenReturn(activeUser);

        assertThatThrownBy(() -> authService.login(req, "127.0.0.1", "browser"))
                .isInstanceOf(AuthenticationException.class);
    }

    @Test
    void login_lockedAccount_throwsAccountLockedException() {
        activeUser.setLockedUntil(LocalDateTime.now().plusMinutes(25));
        LoginRequest req = new LoginRequest();
        req.setUsername("ravi_kumar");
        req.setPassword("Secure@123");
        when(userRepository.findByUsernameAndDeletedFalse("ravi_kumar"))
                .thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> authService.login(req, "127.0.0.1", "browser"))
                .isInstanceOf(AccountLockedException.class);
    }

    @Test
    void login_inactiveAccount_throwsAuthenticationException() {
        activeUser.setStatus(User.UserStatus.INACTIVE);
        LoginRequest req = new LoginRequest();
        req.setUsername("ravi_kumar");
        req.setPassword("Secure@123");
        when(userRepository.findByUsernameAndDeletedFalse("ravi_kumar"))
                .thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> authService.login(req, "127.0.0.1", "browser"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessageContaining("inactive");
    }

    // ── getUserById ───────────────────────────────────────────────────────────

    @Test
    void getUserById_existingUser_returnsUserResponse() {
        when(userRepository.findByUserIdAndDeletedFalse(10L))
                .thenReturn(Optional.of(activeUser));

        UserResponse result = authService.getUserById(10L);

        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(10L);
        assertThat(result.getUsername()).isEqualTo("ravi_kumar");
        assertThat(result.getEmail()).isEqualTo("ravi@example.com");
    }

    @Test
    void getUserById_notFound_throwsResourceNotFoundException() {
        when(userRepository.findByUserIdAndDeletedFalse(999L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getUserById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    // ── deactivateUser ────────────────────────────────────────────────────────

    @Test
    void deactivateUser_existingUser_softDeletes() {
        when(userRepository.findByUserIdAndDeletedFalse(10L))
                .thenReturn(Optional.of(activeUser));

        authService.deactivateUser(10L);

        verify(userRepository).save(argThat(u ->
                u.isDeleted() && u.getStatus() == User.UserStatus.INACTIVE));
        verify(refreshTokenRepository).revokeAllByUserId(10L);
        verify(eventPublisher).publishAuditEvent(anyString(), eq("USER_DEACTIVATED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void deactivateUser_notFound_throwsResourceNotFoundException() {
        when(userRepository.findByUserIdAndDeletedFalse(999L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.deactivateUser(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── reactivateUser ────────────────────────────────────────────────────────

    @Test
    void reactivateUser_existingUser_reactivates() {
        activeUser.setDeleted(true);
        activeUser.setStatus(User.UserStatus.INACTIVE);
        when(userRepository.findById(10L)).thenReturn(Optional.of(activeUser));

        authService.reactivateUser(10L);

        verify(userRepository).save(argThat(u ->
                !u.isDeleted() && u.getStatus() == User.UserStatus.ACTIVE));
        verify(eventPublisher).publishAuditEvent(anyString(), eq("USER_REACTIVATED"),
                anyString(), anyString(), anyString());
    }

    // ── unlockUser ────────────────────────────────────────────────────────────

    @Test
    void unlockUser_lockedUser_clearsLockout() {
        activeUser.setLockedUntil(LocalDateTime.now().plusMinutes(20));
        activeUser.setFailedLoginCount(5);
        activeUser.setStatus(User.UserStatus.LOCKED);
        when(userRepository.findByUserIdAndDeletedFalse(10L))
                .thenReturn(Optional.of(activeUser));

        authService.unlockUser(10L);

        verify(userRepository).save(argThat(u ->
                u.getLockedUntil() == null
                && u.getFailedLoginCount() == 0
                && u.getStatus() == User.UserStatus.ACTIVE));
    }

    // ── validateToken ─────────────────────────────────────────────────────────

    @Test
    void validateToken_validToken_returnsTrue() {
        when(blacklistService.isBlacklisted("valid-token")).thenReturn(false);
        when(jwtService.isTokenValid("valid-token")).thenReturn(true);

        boolean result = authService.validateToken("valid-token");

        assertThat(result).isTrue();
    }

    @Test
    void validateToken_blacklistedToken_returnsFalse() {
        when(blacklistService.isBlacklisted("blacklisted-token")).thenReturn(true);

        boolean result = authService.validateToken("blacklisted-token");

        assertThat(result).isFalse();
        verify(jwtService, never()).isTokenValid(any());
    }

    @Test
    void validateToken_expiredToken_returnsFalse() {
        when(blacklistService.isBlacklisted("expired-token")).thenReturn(false);
        when(jwtService.isTokenValid("expired-token")).thenReturn(false);

        boolean result = authService.validateToken("expired-token");

        assertThat(result).isFalse();
    }

    // ── changePassword ────────────────────────────────────────────────────────

    @Test
    void changePassword_correctCurrentPassword_updatesSuccessfully() {
        when(userRepository.findByUserIdAndDeletedFalse(10L))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("Secure@123", "$2a$10$hashedpassword")).thenReturn(true);
        when(passwordHistoryRepository.findRecentByUserId(10L, 5)).thenReturn(Collections.emptyList());
        when(passwordEncoder.encode("NewPass@456")).thenReturn("newhash");
        when(userRepository.save(any())).thenReturn(activeUser);

        authService.changePassword(10L, "Secure@123", "NewPass@456");

        verify(userRepository).save(argThat(u ->
                !u.isForcePasswordChange() && u.getPasswordChangedAt() != null));
        verify(refreshTokenRepository).revokeAllByUserId(10L);
    }

    @Test
    void changePassword_wrongCurrentPassword_throwsAuthenticationException() {
        when(userRepository.findByUserIdAndDeletedFalse(10L))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("WrongCurrent", "$2a$10$hashedpassword")).thenReturn(false);

        assertThatThrownBy(() ->
                authService.changePassword(10L, "WrongCurrent", "NewPass@456"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessageContaining("Current password is incorrect");
    }

    @Test
    void changePassword_reusedPassword_throwsBusinessRuleException() {
        PasswordHistory history = PasswordHistory.builder()
                .userId(10L)
                .passwordHash("oldhash")
                .build();
        when(userRepository.findByUserIdAndDeletedFalse(10L))
                .thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("Secure@123", "$2a$10$hashedpassword")).thenReturn(true);
        when(passwordHistoryRepository.findRecentByUserId(10L, 5)).thenReturn(List.of(history));
        when(passwordEncoder.matches("NewPass@456", "oldhash")).thenReturn(true);

        assertThatThrownBy(() ->
                authService.changePassword(10L, "Secure@123", "NewPass@456"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("recently used");
    }

    // ── logout ────────────────────────────────────────────────────────────────

    @Test
    void logout_validToken_revokesRefreshTokens() {
        when(jwtService.extractClaims(any())).thenThrow(new RuntimeException("parse error"));

        authService.logout("some-token", 10L);

        verify(refreshTokenRepository).revokeAllByUserId(10L);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private RegisterRequest buildRegisterRequest(String username,
                                                   String email,
                                                   String role) {
        RegisterRequest req = new RegisterRequest();
        req.setUsername(username);
        req.setEmail(email);
        req.setFullName("Ravi Kumar");
        req.setPhone("9876543210");
        req.setPassword("Secure@123");
        req.setRole(role);
        return req;
    }
}
