package com.flowbridge.processing.strategy;

import com.flowbridge.processing.domain.DocumentType;
import com.flowbridge.processing.dto.DocumentMessage;

public interface DocumentProcessor {

    DocumentType getSupportedType();

    void validate(DocumentMessage message) throws IllegalArgumentException;

    void process(DocumentMessage message);
}
