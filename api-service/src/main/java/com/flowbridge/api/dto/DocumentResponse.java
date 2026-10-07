package com.flowbridge.api.dto;

import com.flowbridge.api.domain.DocumentStatus;
import com.flowbridge.api.domain.DocumentType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

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

    private String issueDate;
    private String dueDate;
    private String currency;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discount;
    private String notes;
    private String senderTaxId;
    private String senderAddress;
    private String recipientTaxId;
    private String recipientAddress;

    // Line items
    private List<DocumentSubmitRequest.ItemDto> items;

    // Invoice specific
    private String paymentTerms;
    private String paymentStatus;
    private String acceptedPaymentMethods;
    private String poReference;

    // PO specific
    private String deliveryWindow;
    private String shippingMethod;
    private String requestedBy;
    private String approvalStatus;

    // Credit note specific
    private String originalInvoiceReference;
    private String reasonCode;
    private String refundImpact;

    // Recipient gigital signature
    private String signatureData;
    private String signedBy;
    private String signerRole;
    private String actionComments;
    private Instant actionTimestamp;

    // For failures
    private String failureReason;
}
