package com.flowbridge.api.repository;

import com.flowbridge.api.domain.Document;
import com.flowbridge.api.domain.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    Optional<Document> findByExternalReference(String externalReference);

    List<Document> findByStatus(DocumentStatus status);

    List<Document> findBySenderId(String senderId);

    List<Document> findByReceiverId(String receiverId);

    @org.springframework.data.jpa.repository.Query("SELECT d FROM Document d WHERE LOWER(d.senderId) = LOWER(:enterpriseName) OR LOWER(d.receiverId) = LOWER(:enterpriseName) ORDER BY d.createdAt DESC")
    List<Document> findByEnterpriseName(@org.springframework.data.repository.query.Param("enterpriseName") String enterpriseName);
}
