package com.flowbridge.api.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${flowbridge.rabbitmq.exchange:flowbridge.direct}")
    private String exchangeName;

    @Value("${flowbridge.rabbitmq.routing-key:document.received}")
    private String routingKey;

    @Value("${flowbridge.rabbitmq.received-queue:document.received.queue}")
    private String receivedQueueName;

    @Bean
    public DirectExchange directExchange() {
        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public Queue documentReceivedQueue() {
        return QueueBuilder.durable(receivedQueueName)
                .withArgument("x-dead-letter-exchange", "flowbridge.dlx")
                .withArgument("x-dead-letter-routing-key", "document.dlq")
                .build();
    }

    @Bean
    public Binding binding(Queue documentReceivedQueue, DirectExchange directExchange) {
        return BindingBuilder.bind(documentReceivedQueue)
                .to(directExchange)
                .with(routingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
