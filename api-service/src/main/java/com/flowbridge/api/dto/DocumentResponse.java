package com.flowbridge.api.dto;

import com.flowbridge.api.domain.DocumentStatus;
import com.flowbridge.api.domain.DocumentType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponse {

    private String documentId;
    private String reference;
    private DocumentType documentType;
    private String senderId;
    private String receiverId;
    private BigDecimal amount;
    private DocumentStatus status;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;
}
