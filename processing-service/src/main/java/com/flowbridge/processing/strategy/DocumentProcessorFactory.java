package com.flowbridge.processing.strategy;

import com.flowbridge.processing.domain.DocumentType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class DocumentProcessorFactory {

    private final Map<DocumentType, DocumentProcessor> processorMap = new EnumMap<>(DocumentType.class);

    public DocumentProcessorFactory(List<DocumentProcessor> processors) {
        for (DocumentProcessor processor : processors) {
            processorMap.put(processor.getSupportedType(), processor);
        }
    }

    public DocumentProcessor getProcessor(DocumentType type) {
        DocumentProcessor processor = processorMap.get(type);
        if (processor == null) {
            throw new IllegalArgumentException("No processor registered for document type: " + type);
        }
        return processor;
    }
}
