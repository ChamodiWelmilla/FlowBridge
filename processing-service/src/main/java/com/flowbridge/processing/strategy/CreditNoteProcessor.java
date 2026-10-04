package com.flowbridge.processing.strategy;

import com.flowbridge.processing.domain.DocumentType;
import com.flowbridge.processing.dto.DocumentMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Slf4j
public class CreditNoteProcessor implements DocumentProcessor {

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
    }

    @Override
    public void process(DocumentMessage message) {
        log.info("Processing CREDIT_NOTE document [{}], adjusting customer ledger balance...", message.getDocumentId());
    }
}
