package com.flowbridge.delivery.repository;

import com.flowbridge.delivery.domain.DeliveryAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttempt, String> {

    Optional<DeliveryAttempt> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKeyAndStatus(String idempotencyKey, String status);

    List<DeliveryAttempt> findByDocumentIdOrderByAttemptNumberAsc(String documentId);
}
