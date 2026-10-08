package com.flowbridge.processing.strategy;

import com.flowbridge.processing.domain.Document;
import com.flowbridge.processing.domain.DocumentStatus;
import com.flowbridge.processing.domain.DocumentType;
import com.flowbridge.processing.dto.DocumentMessage;
import com.flowbridge.processing.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class InvoiceProcessor implements DocumentProcessor {

    private final DocumentRepository documentRepository;

    @Override
    public DocumentType getSupportedType() {
        return DocumentType.INVOICE;
    }

    @Override
    public void validate(DocumentMessage message) throws IllegalArgumentException {
        log.info("Validating INVOICE document [{}]", message.getDocumentId());
        
        if (message.getAmount() == null || message.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Invoice amount must be greater than zero");
        }
        if (message.getSenderId() == null || message.getSenderId().isBlank()) {
            throw new IllegalArgumentException("Invoice must have a valid senderId");
        }
        if (message.getReceiverId() == null || message.getReceiverId().isBlank()) {
            throw new IllegalArgumentException("Invoice must have a valid receiverId");
        }

        if (message.getPoReference() != null && !message.getPoReference().isBlank()) {
            String poRef = message.getPoReference().trim();
            Optional<Document> poOpt = documentRepository.findFirstByExternalReferenceAndDocumentTypeOrderByCreatedAtDesc(poRef, DocumentType.ORDER);

            if (poOpt.isEmpty()) {
                throw new IllegalArgumentException("Purchase Order reference '" + poRef + "' was not found in enterprise records.");
            }

            Document poDoc = poOpt.get();
            if (poDoc.getStatus() == DocumentStatus.DECLINED || poDoc.getStatus() == DocumentStatus.REVISION_REJECTED || poDoc.getStatus() == DocumentStatus.DELIVERY_FAILED || poDoc.getStatus() == DocumentStatus.VALIDATION_FAILED) {
                throw new IllegalArgumentException("Referenced Purchase Order '" + poRef + "' is Declined or Closed and cannot accept new billing.");
            }
        }
    }

    @Override
    public void process(DocumentMessage message) {
        log.info("Processing INVOICE document [{}], applying tax and business rules...", message.getDocumentId());
    }
}
