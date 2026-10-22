package com.insurepro.iam.audit;

import com.insurepro.iam.event.EventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final EventPublisher eventPublisher;

    @Around("execution(* com.insurepro.iam.service.impl.*.*(..))")
    public Object auditServiceMethod(ProceedingJoinPoint pjp) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = (auth != null && auth.getPrincipal() instanceof Long)
                ? auth.getPrincipal().toString() : "system";
        String method = pjp.getSignature().getName();
        String clazz  = pjp.getSignature().getDeclaringType().getSimpleName();
        long start = System.currentTimeMillis();

        try {
            Object result = pjp.proceed();
            long elapsed = System.currentTimeMillis() - start;
            log.info("AUDIT OK - {}.{}() user={} durationMs={}", 
                    clazz, method, userId, elapsed);
            eventPublisher.publishAuditEvent(userId, method, clazz,
                    null, "Completed in " + elapsed + "ms");
            return result;
        } catch (Exception ex) {
            long elapsed = System.currentTimeMillis() - start;
            log.error("AUDIT ERR - {}.{}() user={} error={} durationMs={}",
                    clazz, method, userId, ex.getMessage(), elapsed);
            throw ex;
        }
    }
}