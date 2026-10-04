package com.flowbridge.processing.listener;

import com.flowbridge.processing.dto.DocumentMessage;
import com.flowbridge.processing.service.ProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentConsumer {

    private final ProcessingService processingService;

    @RabbitListener(queues = "${flowbridge.rabbitmq.received-queue:document.received.queue}")
    public void consumeDocumentMessage(DocumentMessage message) {
        log.info("Received document message from queue: [{}]", message.getDocumentId());
        try {
            processingService.processIncomingDocument(message);
        } catch (Exception e) {
            log.error("Unhandled error processing document message [{}]: {}", message.getDocumentId(), e.getMessage(), e);
            throw e;
        }
    }
}
