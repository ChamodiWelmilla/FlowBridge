package com.flowbridge.delivery.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryResult {

    private boolean success;
    private int responseCode;
    private String errorMessage;
    private String responseBody;
}
