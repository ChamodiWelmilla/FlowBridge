package com.flowbridge.delivery.retry;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RetryPolicy {

    @Value("${flowbridge.delivery.max-retries:3}")
    private int maxRetries;

    @Value("${flowbridge.delivery.initial-backoff-ms:1000}")
    private long initialBackoffMs;

    @Value("${flowbridge.delivery.multiplier:2}")
    private double multiplier;

    public int getMaxRetries() {
        return maxRetries;
    }

    public long calculateBackoffDelay(int attemptNumber) {
        if (attemptNumber <= 1) {
            return initialBackoffMs;
        }
        return (long) (initialBackoffMs * Math.pow(multiplier, attemptNumber - 1));
    }
}
