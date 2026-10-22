package com.insurepro.iam.repository;

import com.insurepro.iam.entity.PasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Long> {
    @Query("SELECT ph FROM PasswordHistory ph WHERE ph.userId = :userId ORDER BY ph.changedAt DESC LIMIT :n")
    List<PasswordHistory> findRecentByUserId(@Param("userId") Long userId, @Param("n") int n);
}
