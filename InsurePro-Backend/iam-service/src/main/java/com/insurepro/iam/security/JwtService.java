package com.insurepro.iam.security;

import com.insurepro.iam.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * JWT service using JJWT 0.12.x API — fully compatible with Spring Boot 3.2.x.
 * NOTE: Enterprise ZIP used deprecated 0.11.x API (SignatureAlgorithm.HS256,
 * parserBuilder(), setSubject()) which is removed in 0.12.x. This class uses
 * the correct new API: Jwts.builder().signWith(), Jwts.parser().verifyWith().
 */
@Service
@Slf4j
public class JwtService {

    private final SecretKey secretKey;
    private final long accessExpiration;
    private final long refreshExpiration;
    private final String issuer;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiration:1800000}") long accessExpiration,
            @Value("${jwt.refresh-expiration:604800000}") long refreshExpiration,
            @Value("${jwt.issuer:insurepro-iam-service}") String issuer) {
        byte[] keyBytes = Decoders.BASE64.decode(
                java.util.Base64.getEncoder().encodeToString(secret.getBytes()));
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessExpiration = accessExpiration;
        this.refreshExpiration = refreshExpiration;
        this.issuer = issuer;
    }

    public String generateAccessToken(User user) {
        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(String.valueOf(user.getUserId()))
                .issuer(issuer)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpiration))
                .claims(Map.of(
                    "email",    user.getEmail(),
                    "username", user.getUsername(),
                    "fullName", user.getFullName(),
                    "roles",    roles,
                    "type",     "ACCESS"
                ))
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshTokenValue(User user) {
        return Jwts.builder()
                .subject(String.valueOf(user.getUserId()))
                .issuer(issuer)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .claim("type", "REFRESH")
                .signWith(secretKey)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long extractUserId(String token) {
        return Long.parseLong(extractClaims(token).getSubject());
    }

    public String extractUsername(String token) {
        return extractClaims(token).get("username", String.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return extractClaims(token).get("roles", List.class);
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired: {}", e.getMessage());
        } catch (JwtException e) {
            log.warn("JWT invalid: {}", e.getMessage());
        }
        return false;
    }

    public long getAccessExpirationSeconds() {
        return accessExpiration / 1000;
    }
}
