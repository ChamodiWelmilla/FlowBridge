package com.flowbridge.delivery.listener;

import com.flowbridge.delivery.dto.DocumentDeliverMessage;
import com.flowbridge.delivery.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeliveryConsumer {

    private final DeliveryService deliveryService;

    @RabbitListener(queues = "${flowbridge.rabbitmq.deliver-queue:document.deliver.queue}")
    public void consumeDeliveryMessage(DocumentDeliverMessage message) {
        log.info("Received delivery message from queue for document [{}]", message.getDocumentId());
        try {
            deliveryService.deliverDocument(message);
        } catch (Exception e) {
            log.error("Error executing delivery for document [{}]: {}", message.getDocumentId(), e.getMessage(), e);
            throw e;
        }
    }
}
