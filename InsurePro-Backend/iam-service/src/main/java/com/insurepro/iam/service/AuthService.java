package com.insurepro.iam.service;

import com.insurepro.iam.dto.request.LoginRequest;
import com.insurepro.iam.dto.request.RefreshTokenRequest;
import com.insurepro.iam.dto.request.RegisterRequest;
import com.insurepro.iam.dto.response.AuthResponse;
import com.insurepro.iam.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuthService {

    // Public registration - policyholder only
    AuthResponse register(RegisterRequest request);

    // Admin creates any role user
    AuthResponse adminCreateUser(RegisterRequest request);

    // Admin/Agent creates policyholder user with forced password change
    UserResponse createPolicyholderUser(RegisterRequest request);

    // Authentication
    AuthResponse login(LoginRequest request, String ipAddress, String userAgent);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(String accessToken, Long userId);

    // User management
    UserResponse getUserById(Long userId);
    Page<UserResponse> listUsers(Pageable pageable);
    void deactivateUser(Long userId);
    void reactivateUser(Long userId);
    void unlockUser(Long userId);
    void changePassword(Long userId, String currentPassword, String newPassword);

    // Password reset
    void requestPasswordReset(String email);
    void resetPassword(String token, String newPassword);

    // Token validation
    boolean validateToken(String token);

    void resetPasswordByUsername(String username, String newPassword);
}