package com.insurepro.iam.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class TokenBlacklistService {

    // In-memory blacklist since Redis is not available
    private final ConcurrentHashMap<String, Long> blacklist = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor();

    public TokenBlacklistService() {
        // Clean expired tokens every 5 minutes
        cleaner.scheduleAtFixedRate(this::cleanExpired, 5, 5, TimeUnit.MINUTES);
        log.info("TokenBlacklistService initialized with in-memory store");
    }

    public void blacklistToken(String token, long remainingMs) {
        if (remainingMs <= 0) return;
        long expiryTime = System.currentTimeMillis() + remainingMs;
        blacklist.put(token, expiryTime);
        log.info("Token blacklisted in memory, TTL={}ms", remainingMs);
    }

    public boolean isBlacklisted(String token) {
        Long expiryTime = blacklist.get(token);
        if (expiryTime == null) return false;
        if (System.currentTimeMillis() > expiryTime) {
            blacklist.remove(token);
            return false;
        }
        return true;
    }

    private void cleanExpired() {
        long now = System.currentTimeMillis();
        blacklist.entrySet().removeIf(entry -> now > entry.getValue());
        log.debug("Cleaned expired tokens from blacklist");
    }
}