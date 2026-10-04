package com.flowbridge.processing.repository;

import com.flowbridge.processing.domain.Document;
import com.flowbridge.processing.domain.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    List<Document> findByStatus(DocumentStatus status);
}
