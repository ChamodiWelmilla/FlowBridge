package com.flowbridge.api.dto;

import com.flowbridge.api.domain.DocumentStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentStatusResponse {

    private String documentId;
    private DocumentStatus status;
    private String failureReason;
    private Instant updatedAt;
    private List<EventSummary> history;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EventSummary {
        private String eventType;
        private String previousStatus;
        private String newStatus;
        private String payload;
        private Instant timestamp;
    }
}
