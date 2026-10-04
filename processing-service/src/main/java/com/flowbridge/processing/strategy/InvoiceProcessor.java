package com.flowbridge.processing.strategy;

import com.flowbridge.processing.domain.DocumentType;
import com.flowbridge.processing.dto.DocumentMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Slf4j
public class InvoiceProcessor implements DocumentProcessor {

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
    }

    @Override
    public void process(DocumentMessage message) {
        log.info("Processing INVOICE document [{}], applying tax and business rules...", message.getDocumentId());
    }
}
