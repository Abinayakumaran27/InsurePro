package com.insurepro.claims.repository;

import com.insurepro.claims.entity.ClaimNote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ClaimNoteRepository extends JpaRepository<ClaimNote, Long> {
	@Query("SELECT n FROM ClaimNote n WHERE n.claimId = :cid AND (:internal = true OR n.internal = false) ORDER BY n.createdAt DESC")
	Page<ClaimNote> findByClaim(@Param("cid") Long claimId, @Param("internal") boolean includeInternal,
			Pageable pageable);
}
