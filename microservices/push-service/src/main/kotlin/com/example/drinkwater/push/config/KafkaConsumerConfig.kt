package com.example.drinkwater.push.config

import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.common.serialization.StringDeserializer
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory
import org.springframework.kafka.core.DefaultKafkaConsumerFactory
import org.springframework.kafka.core.ConsumerFactory
import org.springframework.kafka.support.serializer.JsonDeserializer

/**
 * Kafka consumer configuration for push-service
 */
@Configuration
class KafkaConsumerConfig {

    @Value("\${spring.kafka.bootstrap-servers:localhost:9092}")
    private lateinit var bootstrapServers: String

    @Value("\${spring.kafka.consumer.group-id:push-notification-group}")
    private lateinit var groupId: String

    @Bean
    fun consumerFactory(): ConsumerFactory<String, Any> {
        val configProps = HashMap<String, Any>()
        configProps[ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG] = bootstrapServers
        configProps[ConsumerConfig.GROUP_ID_CONFIG] = groupId
        configProps[ConsumerConfig.AUTO_OFFSET_RESET_CONFIG] = "earliest"
        configProps[ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG] = StringDeserializer::class.java
        configProps[ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG] = JsonDeserializer::class.java
        configProps[JsonDeserializer.TRUSTED_PACKAGES] = "com.example.drinkwater.*"
        return DefaultKafkaConsumerFactory(configProps)
    }

    @Bean
    fun kafkaListenerContainerFactory(): ConcurrentKafkaListenerContainerFactory<String, Any> {
        val factory = ConcurrentKafkaListenerContainerFactory<String, Any>()
        factory.consumerFactory = consumerFactory()
        return factory
    }
}
