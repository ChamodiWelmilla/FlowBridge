package com.flowbridge.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowbridge.api.domain.Document;
import com.flowbridge.api.domain.DocumentEvent;
import com.flowbridge.api.domain.DocumentStatus;
import com.flowbridge.api.dto.DocumentMessage;
import com.flowbridge.api.dto.DocumentResponse;
import com.flowbridge.api.dto.DocumentStatusResponse;
import com.flowbridge.api.dto.DocumentSubmitRequest;
import com.flowbridge.api.exception.ResourceNotFoundException;
import com.flowbridge.api.repository.DocumentEventRepository;
import com.flowbridge.api.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentEventRepository documentEventRepository;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Value("${flowbridge.rabbitmq.exchange:flowbridge.direct}")
    private String exchangeName;

    @Value("${flowbridge.rabbitmq.routing-key:document.received}")
    private String routingKey;

    @Transactional
    public DocumentResponse submitDocument(DocumentSubmitRequest request) {
        String documentId = generateDocumentId();

        Document document = Document.builder()
                .id(documentId)
                .externalReference(request.getReference())
                .documentType(request.getDocumentType())
                .senderId(request.getSenderId())
                .receiverId(request.getReceiverId())
                .amount(request.getAmount())
                .status(DocumentStatus.RECEIVED)
                .build();

        Document savedDoc = documentRepository.save(document);

        DocumentEvent event = DocumentEvent.builder()
                .id("EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .documentId(savedDoc.getId())
                .eventType("DOCUMENT_RECEIVED")
                .previousStatus(null)
                .newStatus(DocumentStatus.RECEIVED.name())
                .payload("Document submitted via REST API Gateway")
                .build();

        documentEventRepository.save(event);

        DocumentMessage message = DocumentMessage.builder()
                .documentId(savedDoc.getId())
                .reference(savedDoc.getExternalReference())
                .documentType(savedDoc.getDocumentType().name())
                .senderId(savedDoc.getSenderId())
                .receiverId(savedDoc.getReceiverId())
                .amount(savedDoc.getAmount())
                .status(savedDoc.getStatus().name())
                .build();

        try {
            rabbitTemplate.convertAndSend(exchangeName, routingKey, message);
            log.info("Published document [{}] to RabbitMQ exchange [{}] with routingKey [{}]", 
                    documentId, exchangeName, routingKey);
        } catch (Exception e) {
            log.error("Failed to publish message to RabbitMQ for document [{}]: {}", documentId, e.getMessage(), e);
        }

        return mapToResponse(savedDoc);
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(String documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));
        return mapToResponse(document);
    }

    @Transactional(readOnly = true)
    public DocumentStatusResponse getDocumentStatus(String documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        List<DocumentEvent> events = documentEventRepository.findByDocumentIdOrderByCreatedAtAsc(documentId);

        List<DocumentStatusResponse.EventSummary> history = events.stream()
                .map(e -> DocumentStatusResponse.EventSummary.builder()
                        .eventType(e.getEventType())
                        .previousStatus(e.getPreviousStatus())
                        .newStatus(e.getNewStatus())
                        .timestamp(e.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return DocumentStatusResponse.builder()
                .documentId(document.getId())
                .status(document.getStatus())
                .updatedAt(document.getUpdatedAt())
                .history(history)
                .build();
    }

    private String generateDocumentId() {
        String chars = "ABCDEF0123456789";
        StringBuilder sb = new StringBuilder("DOC-");
        Random rnd = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private DocumentResponse mapToResponse(Document doc) {
        return DocumentResponse.builder()
                .documentId(doc.getId())
                .reference(doc.getExternalReference())
                .documentType(doc.getDocumentType())
                .senderId(doc.getSenderId())
                .receiverId(doc.getReceiverId())
                .amount(doc.getAmount())
                .status(doc.getStatus())
                .version(doc.getVersion())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }
}
