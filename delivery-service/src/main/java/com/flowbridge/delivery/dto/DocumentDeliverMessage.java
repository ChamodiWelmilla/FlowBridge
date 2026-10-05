package com.flowbridge.delivery.dto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentDeliverMessage implements Serializable {

    private String documentId;
    private String reference;
    private String documentType;
    private String senderId;
    private String receiverId;
    private BigDecimal amount;
    private String status;
    private String targetPartnerCode;
}
