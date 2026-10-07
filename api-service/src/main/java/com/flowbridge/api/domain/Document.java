package com.flowbridge.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "external_reference", nullable = false, length = 100)
    private String externalReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private DocumentType documentType;

    @Column(name = "sender_id", nullable = false, length = 100)
    private String senderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "sender_id",
        referencedColumnName = "enterprise_name",
        insertable = false,
        updatable = false,
        foreignKey = @ForeignKey(name = "fk_documents_sender_user")
    )
    private User sender;

    @Column(name = "receiver_id", nullable = false, length = 100)
    private String receiverId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "receiver_id",
        referencedColumnName = "enterprise_name",
        insertable = false,
        updatable = false,
        foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT)
    )
    private User receiver;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private DocumentStatus status;

    @Column(name = "issue_date", length = 50)
    private String issueDate;

    @Column(name = "due_date", length = 50)
    private String dueDate;

    @Column(length = 10)
    private String currency;

    @Column(precision = 15, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "tax_amount", precision = 15, scale = 2)
    private BigDecimal taxAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal discount;

    @Column(length = 1000)
    private String notes;

    @Column(name = "sender_tax_id", length = 100)
    private String senderTaxId;

    @Column(name = "sender_address", length = 300)
    private String senderAddress;

    @Column(name = "recipient_tax_id", length = 100)
    private String recipientTaxId;

    @Column(name = "recipient_address", length = 300)
    private String recipientAddress;

    // Line items
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(name = "document_id")
    @Builder.Default
    private List<DocumentItem> items = new ArrayList<>();

    // Invoice specific
    @Column(name = "payment_terms", length = 100)
    private String paymentTerms;

    @Column(name = "payment_status", length = 50)
    private String paymentStatus;

    @Column(name = "accepted_payment_methods", length = 200)
    private String acceptedPaymentMethods;

    @Column(name = "po_reference", length = 100)
    private String poReference;

    // PO specific
    @Column(name = "delivery_window", length = 100)
    private String deliveryWindow;

    @Column(name = "shipping_method", length = 100)
    private String shippingMethod;

    @Column(name = "requested_by", length = 100)
    private String requestedBy;

    @Column(name = "approval_status", length = 50)
    private String approvalStatus;

    // Credit note specific
    @Column(name = "original_invoice_reference", length = 100)
    private String originalInvoiceReference;

    @Column(name = "reason_code", length = 100)
    private String reasonCode;

    @Column(name = "refund_impact", length = 100)
    private String refundImpact;

    // Recipient digital signature
    @Column(name = "signature_data", length = 200)
    private String signatureData;

    @Column(name = "signed_by", length = 100)
    private String signedBy;

    @Column(name = "signer_role", length = 100)
    private String signerRole;

    @Column(name = "action_comments", length = 1000)
    private String actionComments;

    @Column(name = "action_timestamp")
    private Instant actionTimestamp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
