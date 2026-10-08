package com.flowbridge.processing.strategy;

import com.flowbridge.processing.domain.Document;
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
public class CreditNoteProcessor implements DocumentProcessor {

    private final DocumentRepository documentRepository;

    @Override
    public DocumentType getSupportedType() {
        return DocumentType.CREDIT_NOTE;
    }

    @Override
    public void validate(DocumentMessage message) throws IllegalArgumentException {
        log.info("Validating CREDIT_NOTE document [{}]", message.getDocumentId());
        
        if (message.getAmount() == null || message.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Credit note amount must be greater than zero");
        }

        if (message.getOriginalInvoiceReference() != null && !message.getOriginalInvoiceReference().isBlank()) {
            String invRef = message.getOriginalInvoiceReference().trim();
            Optional<Document> invOpt = documentRepository.findFirstByExternalReferenceAndDocumentTypeOrderByCreatedAtDesc(invRef, DocumentType.INVOICE);

            if (invOpt.isEmpty()) {
                throw new IllegalArgumentException("Original Invoice reference '" + invRef + "' was not found in enterprise records.");
            }

            Document inv = invOpt.get();
            if (message.getAmount().compareTo(inv.getAmount()) > 0) {
                throw new IllegalArgumentException(
                    "Credit Note amount ($" + message.getAmount().setScale(2) + 
                    ") exceeds total of original invoice " + invRef + " ($" + inv.getAmount().setScale(2) + ")."
                );
            }
        }
    }

    @Override
    public void process(DocumentMessage message) {
        log.info("Processing CREDIT_NOTE document [{}], adjusting customer ledger balance...", message.getDocumentId());
    }
}
