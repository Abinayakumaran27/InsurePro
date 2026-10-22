package com.insurepro.customer.security;
import io.jsonwebtoken.*; import io.jsonwebtoken.io.Decoders; import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain; import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest; import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j; import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component; import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import javax.crypto.SecretKey; import java.io.IOException; import java.util.List; import java.util.UUID;
import java.util.stream.Collectors;
@Component @Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final SecretKey secretKey;
    public JwtAuthenticationFilter(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(
            java.util.Base64.getEncoder().encodeToString(secret.getBytes())));
    }
    @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
            FilterChain chain) throws ServletException, IOException {
        String cid = req.getHeader("X-Correlation-ID");
        if (!StringUtils.hasText(cid)) cid = UUID.randomUUID().toString();
        MDC.put("correlationId", cid); res.setHeader("X-Correlation-ID", cid);
        try {
            String bearer = req.getHeader("Authorization");
            if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
                String token = bearer.substring(7);
                Claims claims = Jwts.parser().verifyWith(secretKey).build()
                        .parseSignedClaims(token).getPayload();
                Long uid = Long.parseLong(claims.getSubject());
                @SuppressWarnings("unchecked")
                List<String> roles = claims.get("roles", List.class);
                MDC.put("userId", String.valueOf(uid));
                List<SimpleGrantedAuthority> authorities = roles == null ? List.of() :
                    roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());
                var auth = new UsernamePasswordAuthenticationToken(uid, null, authorities);
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (JwtException e) { log.warn("JWT invalid: {}", e.getMessage());
        } finally { chain.doFilter(req, res); MDC.clear(); }
    }
}
