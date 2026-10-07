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

import com.flowbridge.api.repository.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitDocument(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DocumentSubmitRequest request) {

        if ((request.getSenderId() == null || request.getSenderId().isBlank()) && userDetails != null) {
            request.setSenderId(userDetails.getUsername());
        }

        if (request.getSenderId() == null || request.getSenderId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Sender Enterprise ID could not be determined. Please log in or provide senderId."
            ));
        }

        DocumentResponse response = documentService.submitDocument(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "documentId", response.getDocumentId(),
                "status", "PROCESSING",
                "message", "Document accepted for asynchronous validation and processing"
        ));
    }

    @GetMapping
    public ResponseEntity<java.util.List<DocumentResponse>> getMyDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {
        String enterpriseName = userDetails != null ? userDetails.getUsername() : null;
        java.util.List<DocumentResponse> documents = documentService.getMyDocuments(enterpriseName);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocumentById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") String documentId) {
        String enterpriseName = userDetails != null ? userDetails.getUsername() : null;
        DocumentResponse response = documentService.getDocumentById(documentId, enterpriseName);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<DocumentStatusResponse> getDocumentStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") String documentId) {
        String enterpriseName = userDetails != null ? userDetails.getUsername() : null;
        DocumentStatusResponse response = documentService.getDocumentStatus(documentId, enterpriseName);
        return ResponseEntity.ok(response);
    }
}
