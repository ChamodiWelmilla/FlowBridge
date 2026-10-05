package com.flowbridge.delivery.mock;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/mock-partner")
@Slf4j
public class MockPartnerController {

    @PostMapping("/partner-a")
    public ResponseEntity<Map<String, Object>> handlePartnerA(
            @RequestHeader(value = "X-Simulate-Status", required = false) String simulateStatus,
            @RequestBody Map<String, Object> payload) {

        log.info("Mock Partner A received payload for document [{}]", payload.get("documentId"));

        if ("500".equals(simulateStatus)) {
            log.warn("Mock Partner A simulating 500 Internal Server Error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Partner A system internal server failure"));
        }

        if ("429".equals(simulateStatus)) {
            log.warn("Mock Partner A simulating 429 Rate Limit Exceeded");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Partner A rate limit exceeded"));
        }

        return ResponseEntity.ok(Map.of(
                "partner", "Partner A",
                "status", "RECEIVED",
                "ackId", "ACK-A-" + System.currentTimeMillis(),
                "documentId", payload.getOrDefault("documentId", "UNKNOWN")
        ));
    }

    @PostMapping("/partner-b")
    public ResponseEntity<Map<String, Object>> handlePartnerB(
            @RequestHeader(value = "X-Simulate-Status", required = false) String simulateStatus,
            @RequestBody Map<String, Object> payload) {

        log.info("Mock Partner B received payload for document [{}]", payload.get("documentId"));

        if ("500".equals(simulateStatus)) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Partner B service unavailable"));
        }

        return ResponseEntity.ok(Map.of(
                "partner", "Partner B",
                "status", "ACCEPTED",
                "confirmationRef", "CONF-B-" + System.currentTimeMillis()
        ));
    }

    @PostMapping("/partner-c")
    public ResponseEntity<Map<String, Object>> handlePartnerC(@RequestBody Map<String, Object> payload) {
        log.info("Mock Partner C received payload for document [{}]", payload.get("documentId"));
        return ResponseEntity.ok(Map.of(
                "partner", "Partner C",
                "status", "SUCCESS",
                "receiptId", "RCP-C-" + System.currentTimeMillis()
        ));
    }
}
