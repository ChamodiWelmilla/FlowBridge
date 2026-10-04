package com.flowbridge.processing.strategy;

import com.flowbridge.processing.domain.DocumentType;
import com.flowbridge.processing.dto.DocumentMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Slf4j
public class OrderProcessor implements DocumentProcessor {

    @Override
    public DocumentType getSupportedType() {
        return DocumentType.ORDER;
    }

    @Override
    public void validate(DocumentMessage message) throws IllegalArgumentException {
        log.info("Validating ORDER document [{}]", message.getDocumentId());
        
        if (message.getAmount() == null || message.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Purchase order amount must be greater than zero");
        }
        if (!message.getReference().startsWith("ORD-") && !message.getReference().startsWith("PO-")) {
            log.warn("Order reference [{}] does not use standard ORD/PO prefix", message.getReference());
        }
    }

    @Override
    public void process(DocumentMessage message) {
        log.info("Processing ORDER document [{}], reserving inventory and generating order items...", message.getDocumentId());
    }
}
