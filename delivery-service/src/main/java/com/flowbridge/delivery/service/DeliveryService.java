package com.flowbridge.delivery.service;

import com.flowbridge.delivery.adapter.PartnerAdapter;
import com.flowbridge.delivery.adapter.PartnerAdapterFactory;
import com.flowbridge.delivery.domain.*;
import com.flowbridge.delivery.dto.DeliveryResult;
import com.flowbridge.delivery.dto.DocumentDeliverMessage;
import com.flowbridge.delivery.repository.*;
import com.flowbridge.delivery.retry.RetryPolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryService {

    private final DocumentRepository documentRepository;
    private final DocumentEventRepository documentEventRepository;
    private final DeliveryAttemptRepository deliveryAttemptRepository;
    private final PartnerRepository partnerRepository;
    private final PartnerAdapterFactory adapterFactory;
    private final RetryPolicy retryPolicy;
    private final RabbitTemplate rabbitTemplate;

    @Value("${flowbridge.rabbitmq.dlx-exchange:flowbridge.dlx}")
    private String dlxExchangeName;

    @Transactional
    public void deliverDocument(DocumentDeliverMessage message) {
        log.info("Processing delivery for document [{}]", message.getDocumentId());

        Document doc = documentRepository.findById(message.getDocumentId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + message.getDocumentId()));

        String targetCode = message.getTargetPartnerCode();
        Partner partner = partnerRepository.findByPartnerCode(targetCode)
                .orElseGet(() -> partnerRepository.save(Partner.builder()
                        .id("P-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .partnerCode(targetCode)
                        .name("Mock Partner " + targetCode)
                        .adapterType("PARTNER_A")
                        .endpointUrl("http://localhost:8083/api/v1/mock-partner/partner-a")
                        .active(true)
                        .build()));

        PartnerAdapter adapter = adapterFactory.getAdapter(partner.getAdapterType());
        int maxRetries = retryPolicy.getMaxRetries();
        boolean delivered = false;

        for (int attemptNum = 1; attemptNum <= maxRetries; attemptNum++) {
            String idempotencyKey = "DELIVERY-" + doc.getId() + "-ATTEMPT-" + attemptNum;

            if (deliveryAttemptRepository.existsByIdempotencyKeyAndStatus(idempotencyKey, "SUCCESS")) {
                log.info("Delivery already succeeded for idempotencyKey [{}], skipping retry", idempotencyKey);
                return;
            }

            log.info("Attempt {}/{} delivering document [{}] via adapter [{}]", 
                    attemptNum, maxRetries, doc.getId(), partner.getAdapterType());

            DeliveryResult result = adapter.deliver(message, idempotencyKey, partner.getEndpointUrl());

            DeliveryAttempt attemptRecord = DeliveryAttempt.builder()
                    .id("ATT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .documentId(doc.getId())
                    .idempotencyKey(idempotencyKey)
                    .partnerId(partner.getId())
                    .attemptNumber(attemptNum)
                    .status(result.isSuccess() ? "SUCCESS" : "FAILED")
                    .responseCode(result.getResponseCode())
                    .errorMessage(result.getErrorMessage())
                    .build();

            deliveryAttemptRepository.save(attemptRecord);

            if (result.isSuccess()) {
                delivered = true;
                updateDocumentState(doc, DocumentStatus.DELIVERED, "DELIVERY_SUCCESSFUL", 
                        "Successfully delivered on attempt " + attemptNum + " with code " + result.getResponseCode());
                log.info("Document [{}] DELIVERED successfully on attempt {}", doc.getId(), attemptNum);
                break;
            } else {
                log.warn("Attempt {} failed for document [{}]: {}", attemptNum, doc.getId(), result.getErrorMessage());
                if (attemptNum < maxRetries) {
                    long backoffDelay = retryPolicy.calculateBackoffDelay(attemptNum);
                    updateDocumentState(doc, DocumentStatus.RETRY_PENDING, "DELIVERY_RETRY_SCHEDULED", 
                            "Attempt " + attemptNum + " failed. Next retry in " + backoffDelay + "ms");
                    try {
                        Thread.sleep(backoffDelay);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        if (!delivered) {
            log.error("All {} delivery attempts exhausted for document [{}]", maxRetries, doc.getId());
            updateDocumentState(doc, DocumentStatus.DELIVERY_FAILED, "DELIVERY_EXHAUSTED", 
                    "Exhausted all " + maxRetries + " delivery attempts");

            rabbitTemplate.convertAndSend(dlxExchangeName, "document.dlq", message);
            log.info("Published failed document [{}] to Dead Letter Queue (DLQ)", doc.getId());
        }
    }

    private void updateDocumentState(Document doc, DocumentStatus newStatus, String eventType, String payload) {
        String prevStatus = doc.getStatus() != null ? doc.getStatus().name() : null;
        doc.setStatus(newStatus);
        documentRepository.save(doc);

        DocumentEvent event = DocumentEvent.builder()
                .id("EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .documentId(doc.getId())
                .eventType(eventType)
                .previousStatus(prevStatus)
                .newStatus(newStatus.name())
                .payload(payload)
                .build();

        documentEventRepository.save(event);
    }
}
