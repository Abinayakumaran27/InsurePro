 package com.insurepro.iam.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenBlacklistService blacklistService;

    public JwtAuthenticationFilter(JwtService jwtService,
                                    TokenBlacklistService blacklistService) {
        this.jwtService = jwtService;
        this.blacklistService = blacklistService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        // Correlation ID propagation
        String correlationId = request.getHeader("X-Correlation-ID");
        if (!StringUtils.hasText(correlationId)) correlationId = UUID.randomUUID().toString();
        MDC.put("correlationId", correlationId);
        response.setHeader("X-Correlation-ID", correlationId);

        try {
            String token = extractToken(request);
            if (StringUtils.hasText(token)) {
                if (blacklistService.isBlacklisted(token)) {
                    log.warn("Blacklisted token rejected for path: {}", request.getRequestURI());
                } else if (jwtService.isTokenValid(token)) {
                    Claims claims = jwtService.extractClaims(token);
                    Long userId = Long.parseLong(claims.getSubject());
                    List<String> roles = jwtService.extractRoles(token);

                    MDC.put("userId", String.valueOf(userId));

                    List<SimpleGrantedAuthority> authorities = roles == null ? List.of() :
                            roles.stream()
                                 .map(SimpleGrantedAuthority::new)
                                 .collect(Collectors.toList());

                    var auth = new UsernamePasswordAuthenticationToken(
                            userId, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (JwtException e) {
            log.warn("JWT filter exception: {}", e.getMessage());
        } finally {
            chain.doFilter(request, response);
            MDC.clear();
        }
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
