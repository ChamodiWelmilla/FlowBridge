package com.flowbridge.processing.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQProcessingConfig {

    @Value("${flowbridge.rabbitmq.exchange:flowbridge.direct}")
    private String directExchangeName;

    @Value("${flowbridge.rabbitmq.dlx-exchange:flowbridge.dlx}")
    private String dlxExchangeName;

    @Value("${flowbridge.rabbitmq.received-queue:document.received.queue}")
    private String receivedQueueName;

    @Value("${flowbridge.rabbitmq.deliver-queue:document.deliver.queue}")
    private String deliverQueueName;

    @Value("${flowbridge.rabbitmq.dlq-queue:document.dlq}")
    private String dlqQueueName;

    @Bean
    public DirectExchange directExchange() {
        return new DirectExchange(directExchangeName, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(dlxExchangeName, true, false);
    }

    @Bean
    public Queue documentDeliverQueue() {
        return QueueBuilder.durable(deliverQueueName)
                .withArgument("x-dead-letter-exchange", dlxExchangeName)
                .withArgument("x-dead-letter-routing-key", "document.dlq")
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(dlqQueueName).build();
    }

    @Bean
    public Binding deliverBinding(Queue documentDeliverQueue, DirectExchange directExchange) {
        return BindingBuilder.bind(documentDeliverQueue)
                .to(directExchange)
                .with("document.deliver");
    }

    @Bean
    public Binding dlqBinding(Queue deadLetterQueue, DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(deadLetterQueue)
                .to(deadLetterExchange)
                .with("document.dlq");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
