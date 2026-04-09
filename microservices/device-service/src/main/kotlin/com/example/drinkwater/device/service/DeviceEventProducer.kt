package com.example.drinkwater.device.service

import com.example.drinkwater.dto.DeviceRegistrationResponse
import com.example.drinkwater.event.DeviceRegisteredEvent
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service

/**
 * Service to publish device-related events to Kafka
 */
@Service
class DeviceEventProducer(
    private val kafkaTemplate: KafkaTemplate<String, Any>,
) {
    private val logger = LoggerFactory.getLogger(DeviceEventProducer::class.java)

    @Value("\${spring.kafka.topic.device-registered:device-registered}")
    private lateinit var deviceRegisteredTopic: String

    /**
     * Publish a device registered event to Kafka
     */
    fun publishDeviceRegisteredEvent(device: DeviceRegistrationResponse) {
        logger.info("[KAFKA PRODUCER] Publishing device registered event for device: ${device.deviceIdentifier}")
        logger.debug(
            "[KAFKA PRODUCER] Device details: id=${device.id}, deviceIdentifier=${device.deviceIdentifier}, pushToken=${device.pushToken.take(
                10,
            )}..., storeId=${device.storeId}, platform=${device.platform}",
        )

        val event =
            DeviceRegisteredEvent(
                deviceIdentifier = device.deviceIdentifier,
                pushToken = device.pushToken,
                storeId = device.storeId,
                deviceName = device.deviceName ?: "Unknown Device",
                platform = device.platform ?: "Unknown",
                osVersion = device.osVersion ?: "Unknown",
                appVersion = device.appVersion ?: "Unknown",
            )

        logger.info("[KAFKA PRODUCER] Sending to topic: $deviceRegisteredTopic, key: ${device.deviceIdentifier}")

        kafkaTemplate.send(deviceRegisteredTopic, device.deviceIdentifier, event)
            .whenComplete { result, ex ->
                if (ex == null) {
                    logger.info(
                        "[KAFKA PRODUCER SUCCESS] Device registered event published successfully: offset=${result?.recordMetadata?.offset()}, partition=${result?.recordMetadata?.partition()}",
                    )
                } else {
                    logger.error("[KAFKA PRODUCER ERROR] Failed to publish device registered event", ex)
                }
            }
    }
}
