package com.flowbridge.processing.controller;

import com.flowbridge.processing.domain.Document;
import com.flowbridge.processing.service.ProcessingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dead-letter")
@RequiredArgsConstructor
public class DeadLetterQueueController {

    private final ProcessingService processingService;

    @GetMapping("/documents")
    public ResponseEntity<List<Document>> getDeadLetterDocuments() {
        List<Document> failedDocs = processingService.getDeadLetterDocuments();
        return ResponseEntity.ok(failedDocs);
    }

    @PostMapping("/documents/{id}/reprocess")
    public ResponseEntity<Map<String, String>> reprocessDocument(@PathVariable("id") String documentId) {
        processingService.reprocessDocument(documentId);
        return ResponseEntity.ok(Map.of(
                "documentId", documentId,
                "message", "Reprocessing triggered successfully for dead-letter document"
        ));
    }
}
