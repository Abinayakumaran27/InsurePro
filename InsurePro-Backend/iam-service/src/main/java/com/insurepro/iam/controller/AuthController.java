package com.insurepro.iam.controller;

import com.insurepro.iam.dto.request.LoginRequest;
import com.insurepro.iam.dto.request.RefreshTokenRequest;
import com.insurepro.iam.dto.request.RegisterRequest;
import com.insurepro.iam.dto.response.ApiResponse;
import com.insurepro.iam.dto.response.AuthResponse;
import com.insurepro.iam.dto.response.UserResponse;
import com.insurepro.iam.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication & IAM",
     description = "User registration, login, token management and user administration")
@Slf4j
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ── Public endpoints ─────────────────────────────────────────────────────

    @RateLimiter(name = "auth-register")
    @PostMapping("/register")
    @Operation(
        summary = "Self-register as Policyholder",
        description = "Public endpoint. Only ROLE_POLICYHOLDER is allowed. " +
                      "All other roles must be created by an Admin via /admin/users.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "201", description = "Policyholder registered successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "400", description = "Role not allowed for self-registration")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "409", description = "Username or email already exists")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Policyholder registered successfully"));
    }

    @RateLimiter(name = "auth-login")
    @PostMapping("/login")
    @Operation(
        summary = "Login",
        description = "Authenticates user and returns JWT access + refresh tokens")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "200", description = "Login successful")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "401", description = "Invalid credentials")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "423", description = "Account locked")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");
        AuthResponse response = authService.login(request, ip, ua);
        return ResponseEntity.ok(ApiResponse.ok(response, "Login successful"));
    }

    @PostMapping("/refresh")
    @Operation(
        summary = "Refresh access token",
        description = "Exchanges valid refresh token for new access + refresh tokens")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "200", description = "Token refreshed")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "401", description = "Invalid or expired refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(authService.refreshToken(request), "Token refreshed"));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Logout",
        description = "Revokes refresh tokens and blacklists the access token",
        security = @SecurityRequirement(name = "bearerAuth"))
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "200", description = "Logged out successfully")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader("Authorization") String authHeader,
            @AuthenticationPrincipal Long userId) {
        String token = authHeader.startsWith("Bearer ")
                ? authHeader.substring(7) : authHeader;
        authService.logout(token, userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    @Operation(
        summary = "Request password reset",
        description = "Sends reset link to email. Always returns 200.")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @RequestParam @Parameter(description = "Registered email") String email) {
        authService.requestPasswordReset(email);
        return ResponseEntity.ok(ApiResponse.ok(null,
                "If that email is registered, a reset link has been sent."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @RequestParam @Parameter(description = "Token from email") String token,
            @RequestParam @Parameter(description = "New password") String newPassword) {
        authService.resetPassword(token, newPassword);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password reset successfully"));
    }

    @GetMapping("/validate")
    @Operation(summary = "Validate JWT token (used by API Gateway)")
    public ResponseEntity<Map<String, Boolean>> validateToken(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.startsWith("Bearer ")
                ? authHeader.substring(7) : authHeader;
        return ResponseEntity.ok(Map.of("valid", authService.validateToken(token)));
    }
    
    @PostMapping("/reset-password-by-username")
    @Operation(summary = "Reset password by username (no email required)")
    public ResponseEntity<ApiResponse<Void>> resetPasswordByUsername(
            @RequestParam String username,
            @RequestParam String newPassword) {
        authService.resetPasswordByUsername(username, newPassword);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password reset successfully"));
    }

    // ── Admin only — create any role user ────────────────────────────────────

    @PostMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Admin — Create user with any role",
        description = "Admin only. Creates Agent, Adjuster, Underwriter, " +
                      "Compliance, Finance or Admin accounts.",
        security = @SecurityRequirement(name = "bearerAuth"))
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "201", description = "User created by admin")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "403", description = "Admin role required")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "409", description = "Username or email already exists")
    public ResponseEntity<ApiResponse<AuthResponse>> adminCreateUser(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.adminCreateUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "User created successfully by admin"));
    }

    // ── Admin/Agent — create policyholder user (forced password change) ──────

    @PostMapping("/customers/register")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT')")
    @Operation(
        summary = "Create policyholder user account",
        description = "Admin or Agent creates a portal login for a customer. " +
                      "Password is temporary — user must change it on first login.",
        security = @SecurityRequirement(name = "bearerAuth"))
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "201", description = "Policyholder user created")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "409", description = "Email already registered")
    public ResponseEntity<ApiResponse<UserResponse>> createPolicyholderUser(
            @Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.createPolicyholderUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Policyholder user created successfully"));
    }

    // ── User management ──────────────────────────────────────────────────────

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "List all users",
        security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Page<UserResponse>>> listUsers(
            @PageableDefault(size = 10, sort = "createdAt",
                             direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(authService.listUsers(pageable)));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT','UNDERWRITER','COMPLIANCE','COMPLIANCE_OFFICER','ADJUSTER','FINANCE') or #userId == authentication.principal")
    @Operation(
        summary = "Get user by ID",
        security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UserResponse>> getUser(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(authService.getUserById(userId)));
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Deactivate user",
        security = @SecurityRequirement(name = "bearerAuth"))
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
        responseCode = "204", description = "User deactivated")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long userId) {
        authService.deactivateUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Unlock locked account",
        security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> unlockUser(
            @PathVariable Long userId) {
        authService.unlockUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Account unlocked"));
    }

    @PatchMapping("/users/{userId}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Reactivate a deactivated user account",
        security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> reactivateUser(
            @PathVariable Long userId) {
        authService.reactivateUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "User reactivated successfully"));
    }

    @PatchMapping("/users/{userId}/password")
    @PreAuthorize("#userId == authentication.principal")
    @Operation(
        summary = "Change own password",
        security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable Long userId,
            @RequestParam String currentPassword,
            @RequestParam String newPassword) {
        authService.changePassword(userId, currentPassword, newPassword);
        return ResponseEntity.ok(
                ApiResponse.ok(null, "Password changed successfully"));
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xff)) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}