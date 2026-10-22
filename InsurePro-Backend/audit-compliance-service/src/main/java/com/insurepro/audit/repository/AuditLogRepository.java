package com.insurepro.audit.repository;

import com.insurepro.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Keep existing methods (used by exportCsv and other callers)
    Page<AuditLog> findByUserId(Long userId, Pageable pageable);
    Page<AuditLog> findByAction(String action, Pageable pageable);
    Page<AuditLog> findByServiceName(String serviceName, Pageable pageable);
    Page<AuditLog> findByTimestampBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    // New combined filter query — all params optional
    @Query("SELECT a FROM AuditLog a WHERE " +
            "(:userId      IS NULL OR a.userId      = :userId)      AND " +
            "(:action      IS NULL OR a.action      = :action)      AND " +
            "(:resource    IS NULL OR a.resource    = :resource)    AND " +
            "(:serviceName IS NULL OR a.serviceName = :serviceName) AND " +
            "(:from        IS NULL OR a.timestamp  >= :from)        AND " +
            "(:to          IS NULL OR a.timestamp  <= :to)")
    Page<AuditLog> findByFilters(
            @Param("userId")      Long          userId,
            @Param("action")      String        action,
            @Param("resource")    String        resource,
            @Param("serviceName") String        serviceName,
            @Param("from")        LocalDateTime from,
            @Param("to")          LocalDateTime to,
            Pageable pageable);
}