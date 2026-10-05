package com.flowbridge.delivery.repository;

import com.flowbridge.delivery.domain.Document;
import com.flowbridge.delivery.domain.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    List<Document> findByStatus(DocumentStatus status);
}
