package com.flowbridge.api.dto;

import com.flowbridge.api.domain.DocumentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSubmitRequest {

    @NotNull(message = "documentType is required")
    private DocumentType documentType;

    @NotBlank(message = "senderId is required")
    private String senderId;

    @NotBlank(message = "receiverId is required")
    private String receiverId;

    @NotBlank(message = "reference is required")
    private String reference;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than zero")
    private BigDecimal amount;
}
