package com.flowbridge.delivery.adapter;

import com.flowbridge.delivery.dto.DeliveryResult;
import com.flowbridge.delivery.dto.DocumentDeliverMessage;

public interface PartnerAdapter {

    String getSupportedAdapterType();

    DeliveryResult deliver(DocumentDeliverMessage message, String idempotencyKey, String endpointUrl);
}
