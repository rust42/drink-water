package com.example.drinkwater.water.service

import com.example.drinkwater.event.HydrationReminderRequestEvent
import com.example.drinkwater.event.WaterIntakeRecordedEvent
import com.example.drinkwater.water.dto.WaterIntakeResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service

/**
 * Service to publish water-related events to Kafka
 */
@Service
class WaterEventProducer(
    private val kafkaTemplate: KafkaTemplate<String, Any>
) {
    private val logger = LoggerFactory.getLogger(WaterEventProducer::class.java)

    @Value("\${spring.kafka.topic.water-intake-recorded:water-intake-recorded}")
    private lateinit var waterIntakeRecordedTopic: String

    @Value("\${spring.kafka.topic.hydration-reminder:hydration-reminder}")
    private lateinit var hydrationReminderTopic: String

    /**
     * Publish a water intake recorded event to Kafka
     */
    fun publishWaterIntakeRecordedEvent(deviceIdentifier: String, response: WaterIntakeResponse) {
        val event = WaterIntakeRecordedEvent(
            deviceIdentifier = deviceIdentifier,
            amount = response.amount ?: 0,
            totalIntake = response.totalIntake ?: 0,
            dailyGoal = response.dailyGoal ?: 2000
        )

        logger.info("Publishing water intake recorded event for device: $deviceIdentifier")

        kafkaTemplate.send(waterIntakeRecordedTopic, deviceIdentifier, event)
            .whenComplete { result, ex ->
                if (ex == null) {
                    logger.info("Water intake recorded event published successfully: ${result?.recordMetadata?.offset()}")
                } else {
                    logger.error("Failed to publish water intake recorded event", ex)
                }
            }
    }

    /**
     * Publish a hydration reminder request event to Kafka
     */
    fun publishHydrationReminderRequest(deviceIdentifier: String) {
        val event = HydrationReminderRequestEvent(
            deviceIdentifier = deviceIdentifier
        )

        logger.info("Publishing hydration reminder request event for device: $deviceIdentifier")

        kafkaTemplate.send(hydrationReminderTopic, deviceIdentifier, event)
            .whenComplete { result, ex ->
                if (ex == null) {
                    logger.info("Hydration reminder request event published successfully: ${result?.recordMetadata?.offset()}")
                } else {
                    logger.error("Failed to publish hydration reminder request event", ex)
                }
            }
    }
}
