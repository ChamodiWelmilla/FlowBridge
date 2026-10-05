package com.flowbridge.delivery.repository;

import com.flowbridge.delivery.domain.DocumentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentEventRepository extends JpaRepository<DocumentEvent, String> {

    List<DocumentEvent> findByDocumentIdOrderByCreatedAtAsc(String documentId);
}
