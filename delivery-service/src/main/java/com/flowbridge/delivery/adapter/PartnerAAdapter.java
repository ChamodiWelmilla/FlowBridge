package com.flowbridge.delivery.adapter;

import com.flowbridge.delivery.dto.DeliveryResult;
import com.flowbridge.delivery.dto.DocumentDeliverMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class PartnerAAdapter implements PartnerAdapter {

    private final RestTemplate restTemplate;

    @Override
    public String getSupportedAdapterType() {
        return "PARTNER_A";
    }

    @Override
    public DeliveryResult deliver(DocumentDeliverMessage message, String idempotencyKey, String endpointUrl) {
        log.info("PartnerAAdapter delivering document [{}] with idempotencyKey [{}] to [{}]", 
                message.getDocumentId(), idempotencyKey, endpointUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Idempotency-Key", idempotencyKey);

        Map<String, Object> payload = new HashMap<>();
        payload.put("documentId", message.getDocumentId());
        payload.put("reference", message.getReference());
        payload.put("type", message.getDocumentType());
        payload.put("amount", message.getAmount());
        payload.put("sender", message.getSenderId());
        payload.put("receiver", message.getReceiverId());

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(endpointUrl, requestEntity, String.class);
            log.info("PartnerAAdapter response status [{}] for document [{}]", response.getStatusCode().value(), message.getDocumentId());

            return DeliveryResult.builder()
                    .success(response.getStatusCode().is2xxSuccessful())
                    .responseCode(response.getStatusCode().value())
                    .responseBody(response.getBody())
                    .build();
        } catch (HttpStatusCodeException ex) {
            log.warn("PartnerAAdapter HTTP error [{}] for document [{}]: {}", ex.getStatusCode().value(), message.getDocumentId(), ex.getResponseBodyAsString());
            return DeliveryResult.builder()
                    .success(false)
                    .responseCode(ex.getStatusCode().value())
                    .errorMessage("HTTP Error: " + ex.getStatusCode().value() + " - " + ex.getStatusText())
                    .responseBody(ex.getResponseBodyAsString())
                    .build();
        } catch (Exception ex) {
            log.error("PartnerAAdapter connection error for document [{}]: {}", message.getDocumentId(), ex.getMessage());
            return DeliveryResult.builder()
                    .success(false)
                    .responseCode(500)
                    .errorMessage("Connection failed: " + ex.getMessage())
                    .build();
        }
    }
}
