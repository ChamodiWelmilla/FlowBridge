package com.flowbridge.processing.service;

import com.flowbridge.processing.domain.Document;
import com.flowbridge.processing.domain.DocumentEvent;
import com.flowbridge.processing.domain.DocumentStatus;
import com.flowbridge.processing.domain.DocumentType;
import com.flowbridge.processing.dto.DocumentDeliverMessage;
import com.flowbridge.processing.dto.DocumentMessage;
import com.flowbridge.processing.repository.DocumentEventRepository;
import com.flowbridge.processing.repository.DocumentRepository;
import com.flowbridge.processing.strategy.DocumentProcessor;
import com.flowbridge.processing.strategy.DocumentProcessorFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcessingService {

    private final DocumentRepository documentRepository;
    private final DocumentEventRepository documentEventRepository;
    private final DocumentProcessorFactory processorFactory;
    private final RabbitTemplate rabbitTemplate;

    @Value("${flowbridge.rabbitmq.exchange:flowbridge.direct}")
    private String exchangeName;

    @Value("${flowbridge.rabbitmq.dlx-exchange:flowbridge.dlx}")
    private String dlxExchangeName;

    @Transactional
    public void processIncomingDocument(DocumentMessage message) {
        log.info("Received document [{}] for processing pipeline", message.getDocumentId());

        Document doc = documentRepository.findById(message.getDocumentId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + message.getDocumentId()));

        DocumentType docType;
        try {
            docType = DocumentType.valueOf(message.getDocumentType());
        } catch (Exception e) {
            transitionToFailed(doc, "Invalid document type: " + message.getDocumentType());
            return;
        }

        DocumentProcessor processor = processorFactory.getProcessor(docType);

        // State Machine Transition 1: RECEIVED -> VALIDATING
        updateDocumentState(doc, DocumentStatus.VALIDATING, "VALIDATION_STARTED", "Starting document validation strategy");

        try {
            processor.validate(message);
        } catch (Exception ex) {
            log.error("Validation failed for document [{}]: {}", doc.getId(), ex.getMessage());
            transitionToFailed(doc, ex.getMessage());
            return;
        }

        // State Machine Transition 2: VALIDATING -> VALIDATED
        updateDocumentState(doc, DocumentStatus.VALIDATED, "VALIDATION_PASSED", "Document passed validation rules successfully");

        // State Machine Transition 3: VALIDATED -> PROCESSING
        updateDocumentState(doc, DocumentStatus.PROCESSING, "PROCESSING_STARTED", "Executing business transformation logic");
        processor.process(message);

        // State Machine Transition 4: PROCESSING -> DELIVERING
        updateDocumentState(doc, DocumentStatus.DELIVERING, "DELIVERY_INITIATED", "Document queued for external partner delivery");

        // Publish to Delivery Queue
        DocumentDeliverMessage deliverMessage = DocumentDeliverMessage.builder()
                .documentId(doc.getId())
                .reference(doc.getExternalReference())
                .documentType(doc.getDocumentType().name())
                .senderId(doc.getSenderId())
                .receiverId(doc.getReceiverId())
                .amount(doc.getAmount())
                .status(doc.getStatus().name())
                .targetPartnerCode(doc.getReceiverId())
                .build();

        rabbitTemplate.convertAndSend(exchangeName, "document.deliver", deliverMessage);
        log.info("Published document [{}] to delivery queue with status DELIVERING", doc.getId());
    }

    @Transactional(readOnly = true)
    public List<Document> getDeadLetterDocuments() {
        return documentRepository.findByStatus(DocumentStatus.VALIDATION_FAILED);
    }

    @Transactional
    public void reprocessDocument(String documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));

        DocumentMessage message = DocumentMessage.builder()
                .documentId(doc.getId())
                .reference(doc.getExternalReference())
                .documentType(doc.getDocumentType().name())
                .senderId(doc.getSenderId())
                .receiverId(doc.getReceiverId())
                .amount(doc.getAmount())
                .status(doc.getStatus().name())
                .build();

        log.info("Reprocessing document [{}] from DLQ/Failed state", documentId);
        processIncomingDocument(message);
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

    private void transitionToFailed(Document doc, String reason) {
        String cleanReason = sanitizeErrorMessage(reason);
        updateDocumentState(doc, DocumentStatus.VALIDATION_FAILED, "VALIDATION_FAILED", cleanReason);
        log.warn("Document [{}] marked as VALIDATION_FAILED. Reason: {}", doc.getId(), cleanReason);
    }

    private String sanitizeErrorMessage(String msg) {
        if (msg == null || msg.isBlank()) {
            return "Document validation failed due to a system verification constraint.";
        }
        if (msg.contains("No enum constant") || msg.contains("status is 'D'")) {
            return "Referenced Purchase Order is Declined or Closed and cannot accept new billing.";
        }
        if (msg.contains("com.flowbridge") || msg.contains("NullPointerException")) {
            return "Validation system encountered an unexpected internal data mapping constraint.";
        }
        return msg;
    }
}
