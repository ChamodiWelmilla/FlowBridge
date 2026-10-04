package com.flowbridge.processing.dto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentMessage implements Serializable {

    private String documentId;
    private String reference;
    private String documentType;
    private String senderId;
    private String receiverId;
    private BigDecimal amount;
    private String status;
}
