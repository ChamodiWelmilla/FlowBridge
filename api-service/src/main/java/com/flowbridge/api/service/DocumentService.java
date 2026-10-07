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

        List<com.flowbridge.api.domain.DocumentItem> items = new java.util.ArrayList<>();
        if (request.getItems() != null) {
            for (DocumentSubmitRequest.ItemDto itemDto : request.getItems()) {
                items.add(com.flowbridge.api.domain.DocumentItem.builder()
                        .id("ITM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .documentId(documentId)
                        .itemSku(itemDto.getItemSku())
                        .itemName(itemDto.getItemName() != null ? itemDto.getItemName() : "Item")
                        .description(itemDto.getDescription())
                        .quantity(itemDto.getQuantity() != null ? itemDto.getQuantity() : java.math.BigDecimal.ONE)
                        .unitPrice(itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : java.math.BigDecimal.ZERO)
                        .taxRate(itemDto.getTaxRate())
                        .lineTotal(itemDto.getLineTotal() != null ? itemDto.getLineTotal() : java.math.BigDecimal.ZERO)
                        .build());
            }
        }

        Document document = Document.builder()
                .id(documentId)
                .externalReference(request.getReference())
                .documentType(request.getDocumentType())
                .senderId(request.getSenderId())
                .receiverId(request.getReceiverId())
                .amount(request.getAmount())
                .status(DocumentStatus.RECEIVED)
                .issueDate(request.getIssueDate())
                .dueDate(request.getDueDate())
                .currency(request.getCurrency())
                .subtotal(request.getSubtotal())
                .taxAmount(request.getTaxAmount())
                .discount(request.getDiscount())
                .notes(request.getNotes())
                .senderTaxId(request.getSenderTaxId())
                .senderAddress(request.getSenderAddress())
                .recipientTaxId(request.getRecipientTaxId())
                .recipientAddress(request.getRecipientAddress())
                .items(items)
                .paymentTerms(request.getPaymentTerms())
                .paymentStatus(request.getPaymentStatus())
                .acceptedPaymentMethods(request.getAcceptedPaymentMethods())
                .poReference(request.getPoReference())
                .deliveryWindow(request.getDeliveryWindow())
                .shippingMethod(request.getShippingMethod())
                .requestedBy(request.getRequestedBy())
                .approvalStatus(request.getApprovalStatus())
                .originalInvoiceReference(request.getOriginalInvoiceReference())
                .reasonCode(request.getReasonCode())
                .refundImpact(request.getRefundImpact())
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
    public List<DocumentResponse> getMyDocuments(String enterpriseName) {
        if (enterpriseName == null || enterpriseName.isBlank()) {
            return List.of();
        }
        return documentRepository.findByEnterpriseName(enterpriseName)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(String documentId, String enterpriseName) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));
        validateEnterpriseAccess(document, enterpriseName);
        return mapToResponse(document);
    }

    @Transactional(readOnly = true)
    public DocumentStatusResponse getDocumentStatus(String documentId, String enterpriseName) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        validateEnterpriseAccess(document, enterpriseName);

        List<DocumentEvent> events = documentEventRepository.findByDocumentIdOrderByCreatedAtAsc(documentId);

        String failureReason = null;
        for (int i = events.size() - 1; i >= 0; i--) {
            DocumentEvent e = events.get(i);
            if (e.getEventType() != null && (e.getEventType().contains("FAILED") || e.getEventType().contains("REJECTED") || (e.getNewStatus() != null && e.getNewStatus().contains("FAILED")))) {
                failureReason = e.getPayload();
                break;
            }
        }

        List<DocumentStatusResponse.EventSummary> history = events.stream()
                .map(e -> DocumentStatusResponse.EventSummary.builder()
                        .eventType(e.getEventType())
                        .previousStatus(e.getPreviousStatus())
                        .newStatus(e.getNewStatus())
                        .payload(e.getPayload())
                        .timestamp(e.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return DocumentStatusResponse.builder()
                .documentId(document.getId())
                .status(document.getStatus())
                .failureReason(failureReason)
                .updatedAt(document.getUpdatedAt())
                .history(history)
                .build();
    }

    private void validateEnterpriseAccess(Document doc, String enterpriseName) {
        if (enterpriseName == null || enterpriseName.isBlank()) {
            return;
        }
        boolean isSender = doc.getSenderId() != null && doc.getSenderId().equalsIgnoreCase(enterpriseName);
        boolean isReceiver = doc.getReceiverId() != null && doc.getReceiverId().equalsIgnoreCase(enterpriseName);

        if (!isSender && !isReceiver) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Access denied: Document " + doc.getId() + " does not belong to enterprise '" + enterpriseName + "'"
            );
        }
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

    @Transactional
    public DocumentResponse processDocumentAction(String documentId, String enterpriseName, com.flowbridge.api.dto.DocumentActionRequest actionReq) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        validateEnterpriseAccess(doc, enterpriseName);

        String action = actionReq.getAction() != null ? actionReq.getAction().toUpperCase() : "";
        DocumentStatus oldStatus = doc.getStatus();

        if (oldStatus == DocumentStatus.DECLINED || oldStatus == DocumentStatus.REVISION_REJECTED) {
            throw new IllegalArgumentException("This document has been declined. Workflow is permanently closed and no further actions can be taken.");
        }

        if (oldStatus == DocumentStatus.CHANGE_REQUESTED) {
            String lastRequester = doc.getRequestedBy();
            boolean isRequester = lastRequester != null && lastRequester.equalsIgnoreCase(enterpriseName);
            if (isRequester) {
                boolean isDeclineAction = action.contains("DECLINE") || action.contains("REJECT");
                if (!isDeclineAction) {
                    throw new IllegalArgumentException("As the party who posted this change request, you cannot accept your own request or submit another change request until the other party responds. Only Decline is available.");
                }
            }
        }

        DocumentStatus newStatus = oldStatus;
        String eventType = "DOCUMENT_UPDATED";

        switch (action) {
            case "ACCEPT":
            case "SIGN":
                newStatus = DocumentStatus.ACCEPTED;
                eventType = "DOCUMENT_ACCEPTED_AND_SIGNED";
                doc.setSignedBy(actionReq.getSignerName() != null && !actionReq.getSignerName().isBlank() ? actionReq.getSignerName() : enterpriseName);
                doc.setSignerRole(actionReq.getSignerRole() != null && !actionReq.getSignerRole().isBlank() ? actionReq.getSignerRole() : "Authorized Representative");
                doc.setSignatureData("SIG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + (enterpriseName != null ? enterpriseName.replaceAll("\\s+", "_") : "RECIPIENT"));
                doc.setPaymentStatus("ACCEPTED_BY_RECEIVER");
                doc.setApprovalStatus("APPROVED");
                break;
            case "DECLINE":
            case "REJECT":
                newStatus = DocumentStatus.DECLINED;
                eventType = "DOCUMENT_DECLINED";
                doc.setPaymentStatus("DECLINED");
                doc.setApprovalStatus("REJECTED");
                break;
            case "REQUEST_CHANGE":
            case "REQUEST_CHANGES":
            case "REQUEST_REVISION":
            case "REQUEST_REVISIONS":
            case "REVISION":
            case "CHANGE_REQUESTED":
                newStatus = DocumentStatus.CHANGE_REQUESTED;
                eventType = "DOCUMENT_CHANGE_REQUESTED";
                doc.setApprovalStatus("REVISION_NEEDED");
                doc.setRequestedBy(enterpriseName != null ? enterpriseName : doc.getRequestedBy());
                break;
            case "ACCEPT_REVISION":
            case "SENDER_ACCEPT_REVISION":
                newStatus = DocumentStatus.REVISION_ACCEPTED;
                eventType = "REVISION_REQUEST_ACCEPTED";
                doc.setApprovalStatus("REVISION_AGREED");
                break;
            case "COUNTER_REVISION":
            case "SENDER_COUNTER_REVISION":
                newStatus = DocumentStatus.CHANGE_REQUESTED;
                eventType = "COUNTER_REVISION_SUBMITTED";
                doc.setApprovalStatus("COUNTER_PROPOSAL_SENT");
                doc.setRequestedBy(enterpriseName != null ? enterpriseName : doc.getRequestedBy());
                break;
            case "REJECT_REVISION":
            case "SENDER_REJECT_REVISION":
                newStatus = DocumentStatus.DECLINED;
                eventType = "REVISION_REQUEST_DECLINED";
                doc.setApprovalStatus("REVISION_DECLINED");
                break;
            case "OPEN":
            case "VIEW":
                if (doc.getStatus() == DocumentStatus.DELIVERED) {
                    newStatus = DocumentStatus.OPENED;
                    eventType = "DOCUMENT_OPENED_BY_RECEIVER";
                }
                break;
            default:
                throw new IllegalArgumentException("Unsupported action: " + actionReq.getAction());
        }

        if (actionReq.getComments() != null && !actionReq.getComments().isBlank()) {
            doc.setActionComments(actionReq.getComments());
        }
        doc.setActionTimestamp(java.time.Instant.now());
        doc.setStatus(newStatus);
        Document savedDoc = documentRepository.save(doc);

        DocumentEvent event = DocumentEvent.builder()
                .id("EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .documentId(savedDoc.getId())
                .eventType(eventType)
                .previousStatus(oldStatus != null ? oldStatus.name() : null)
                .newStatus(newStatus != null ? newStatus.name() : null)
                .payload("Action by [" + (enterpriseName != null ? enterpriseName : "User") + "]: " + (actionReq.getComments() != null ? actionReq.getComments() : action))
                .build();
        documentEventRepository.save(event);

        return mapToResponse(savedDoc);
    }

    private DocumentResponse mapToResponse(Document doc) {
        List<DocumentSubmitRequest.ItemDto> itemDtos = new java.util.ArrayList<>();
        if (doc.getItems() != null) {
            for (com.flowbridge.api.domain.DocumentItem item : doc.getItems()) {
                itemDtos.add(DocumentSubmitRequest.ItemDto.builder()
                        .itemSku(item.getItemSku())
                        .itemName(item.getItemName())
                        .description(item.getDescription())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .taxRate(item.getTaxRate())
                        .lineTotal(item.getLineTotal())
                        .build());
            }
        }

        String failureReason = null;
        if (doc.getStatus() != null && doc.getStatus().name().contains("FAILED")) {
            List<DocumentEvent> events = documentEventRepository.findByDocumentIdOrderByCreatedAtAsc(doc.getId());
            for (int i = events.size() - 1; i >= 0; i--) {
                DocumentEvent e = events.get(i);
                if (e.getEventType() != null && (e.getEventType().contains("FAILED") || e.getEventType().contains("REJECTED"))) {
                    failureReason = e.getPayload();
                    break;
                }
            }
        }

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
                .issueDate(doc.getIssueDate())
                .dueDate(doc.getDueDate())
                .currency(doc.getCurrency())
                .subtotal(doc.getSubtotal())
                .taxAmount(doc.getTaxAmount())
                .discount(doc.getDiscount())
                .notes(doc.getNotes())
                .senderTaxId(doc.getSenderTaxId())
                .senderAddress(doc.getSenderAddress())
                .recipientTaxId(doc.getRecipientTaxId())
                .recipientAddress(doc.getRecipientAddress())
                .items(itemDtos)
                .paymentTerms(doc.getPaymentTerms())
                .paymentStatus(doc.getPaymentStatus())
                .acceptedPaymentMethods(doc.getAcceptedPaymentMethods())
                .poReference(doc.getPoReference())
                .deliveryWindow(doc.getDeliveryWindow())
                .shippingMethod(doc.getShippingMethod())
                .requestedBy(doc.getRequestedBy())
                .approvalStatus(doc.getApprovalStatus())
                .originalInvoiceReference(doc.getOriginalInvoiceReference())
                .reasonCode(doc.getReasonCode())
                .refundImpact(doc.getRefundImpact())
                .signatureData(doc.getSignatureData())
                .signedBy(doc.getSignedBy())
                .signerRole(doc.getSignerRole())
                .actionComments(doc.getActionComments())
                .actionTimestamp(doc.getActionTimestamp())
                .failureReason(failureReason)
                .build();
    }
}
