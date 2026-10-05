package com.flowbridge.delivery.domain;

public enum DocumentStatus {
    RECEIVED,
    VALIDATING,
    VALIDATED,
    PROCESSING,
    DELIVERING,
    DELIVERED,
    VALIDATION_FAILED,
    DELIVERY_FAILED,
    RETRY_PENDING
}
