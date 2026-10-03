package com.flowbridge.api.controller;

import com.flowbridge.api.dto.DocumentResponse;
import com.flowbridge.api.dto.DocumentStatusResponse;
import com.flowbridge.api.dto.DocumentSubmitRequest;
import com.flowbridge.api.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitDocument(@Valid @RequestBody DocumentSubmitRequest request) {
        DocumentResponse response = documentService.submitDocument(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "documentId", response.getDocumentId(),
                "status", "PROCESSING",
                "message", "Document accepted for asynchronous validation and processing"
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocumentById(@PathVariable("id") String documentId) {
        DocumentResponse response = documentService.getDocumentById(documentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<DocumentStatusResponse> getDocumentStatus(@PathVariable("id") String documentId) {
        DocumentStatusResponse response = documentService.getDocumentStatus(documentId);
        return ResponseEntity.ok(response);
    }
}
