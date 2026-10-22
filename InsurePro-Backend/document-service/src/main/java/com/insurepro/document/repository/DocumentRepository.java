package com.insurepro.document.repository;
import com.insurepro.document.entity.Document;
import org.springframework.data.domain.Page; import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; import java.util.Optional;
@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    Optional<Document> findByDocumentIdAndDeletedFalse(Long id);
    List<Document> findByEntityTypeAndEntityIdAndDeletedFalse(String entityType, Long entityId);
    Page<Document> findByEntityTypeAndEntityIdAndDeletedFalse(String entityType, Long entityId, Pageable pageable);
    List<Document> findByEntityTypeAndEntityIdAndDocumentTypeAndDeletedFalse(String entityType, Long entityId, String docType);
}
