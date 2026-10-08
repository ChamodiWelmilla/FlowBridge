package com.flowbridge.processing.repository;

import com.flowbridge.processing.domain.Document;
import com.flowbridge.processing.domain.DocumentStatus;
import com.flowbridge.processing.domain.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    List<Document> findByStatus(DocumentStatus status);

    Optional<Document> findFirstByExternalReferenceAndDocumentTypeOrderByCreatedAtDesc(String externalReference, DocumentType documentType);
}
