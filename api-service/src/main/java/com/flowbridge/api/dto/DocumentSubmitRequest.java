package com.flowbridge.api.dto;

import com.flowbridge.api.domain.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSubmitRequest {

    @NotNull(message = "documentType is required")
    private DocumentType documentType;

    private String senderId;

    @NotBlank(message = "receiverId is required")
    private String receiverId;

    @NotBlank(message = "reference is required")
    private String reference;

    @NotNull(message = "amount is required")
    private BigDecimal amount;

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
    private List<ItemDto> items;

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

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemDto {
        private String itemSku;
        private String itemName;
        private String description;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal taxRate;
        private BigDecimal lineTotal;
    }
}
