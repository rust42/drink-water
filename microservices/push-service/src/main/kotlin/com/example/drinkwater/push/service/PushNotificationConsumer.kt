package com.example.drinkwater.push.service

import com.example.drinkwater.event.DeviceRegisteredEvent
import com.example.drinkwater.event.HydrationReminderRequestEvent
import com.example.drinkwater.event.WaterIntakeRecordedEvent
import com.example.drinkwater.push.dto.PushNotificationRequest
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Service

/**
 * Kafka consumer service for push notifications
 */
@Service
class PushNotificationConsumer(
    private val pushNotificationService: PushNotificationService
) {
    private val logger = LoggerFactory.getLogger(PushNotificationConsumer::class.java)

    /**
     * Listen for device registered events
     */
    @KafkaListener(topics = ["\${spring.kafka.topic.device-registered:device-registered}"], groupId = "\${spring.kafka.consumer.group-id:push-notification-group}")
    fun handleDeviceRegisteredEvent(event: DeviceRegisteredEvent) {
        logger.info("[KAFKA CONSUMER] Received device registered event for device: ${event.deviceIdentifier}")
        logger.debug("[KAFKA CONSUMER] Device registered event details: deviceIdentifier=${event.deviceIdentifier}, pushToken=${event.pushToken.take(10)}..., storeId=${event.storeId}, platform=${event.platform}, deviceName=${event.deviceName}")

        // Send welcome notification to newly registered device
        val notification = PushNotificationRequest(
            title = "Welcome!",
            subtitle = "Device Registered Successfully",
            body = "Your device has been registered for hydration reminders. Stay hydrated!",
            sound = "default"
        )
        
        logger.info("[KAFKA CONSUMER] Sending welcome notification to device: ${event.deviceIdentifier}")

        try {
            val result = pushNotificationService.sendPushToDevice(event.deviceIdentifier, notification)
            if (result.success) {
                logger.info("[KAFKA CONSUMER SUCCESS] Welcome notification sent successfully to device: ${event.deviceIdentifier}")
            } else {
                logger.warn("[KAFKA CONSUMER ERROR] Failed to send welcome notification to device: ${event.deviceIdentifier}, message=${result.message}")
            }
        } catch (e: Exception) {
            logger.error("[KAFKA CONSUMER ERROR] Error sending welcome notification to device: ${event.deviceIdentifier}", e)
        }
    }

    /**
     * Listen for water intake recorded events
     */
    @KafkaListener(topics = ["\${spring.kafka.topic.water-intake-recorded:water-intake-recorded}"], groupId = "\${spring.kafka.consumer.group-id:push-notification-group}")
    fun handleWaterIntakeRecordedEvent(event: WaterIntakeRecordedEvent) {
        logger.info("[KAFKA CONSUMER] Received water intake recorded event for device: ${event.deviceIdentifier}, total: ${event.totalIntake}ml")
        logger.debug("[KAFKA CONSUMER] Water intake event details: deviceIdentifier=${event.deviceIdentifier}, amount=${event.amount}, totalIntake=${event.totalIntake}, dailyGoal=${event.dailyGoal}")

        // Send achievement notification if daily goal is reached
        if (event.totalIntake >= event.dailyGoal) {
            logger.info("[KAFKA CONSUMER] Daily goal reached! Sending achievement notification to device: ${event.deviceIdentifier}")
            
            val notification = PushNotificationRequest(
                title = "Daily Goal Achieved!",
                subtitle = "Congratulations!",
                body = "You've reached your daily hydration goal of ${event.dailyGoal}ml. Great job staying hydrated!",
                sound = "default"
            )

            try {
                val result = pushNotificationService.sendPushToDevice(event.deviceIdentifier, notification)
                if (result.success) {
                    logger.info("[KAFKA CONSUMER SUCCESS] Achievement notification sent successfully to device: ${event.deviceIdentifier}")
                } else {
                    logger.warn("[KAFKA CONSUMER ERROR] Failed to send achievement notification to device: ${event.deviceIdentifier}, message=${result.message}")
                }
            } catch (e: Exception) {
                logger.error("[KAFKA CONSUMER ERROR] Error sending achievement notification to device: ${event.deviceIdentifier}", e)
            }
        } else {
            logger.debug("[KAFKA CONSUMER] Daily goal not yet reached. Total: ${event.totalIntake}ml, Goal: ${event.dailyGoal}ml")
        }
    }

    /**
     * Listen for hydration reminder request events
     */
    @KafkaListener(topics = ["\${spring.kafka.topic.hydration-reminder:hydration-reminder}"], groupId = "\${spring.kafka.consumer.group-id:push-notification-group}")
    fun handleHydrationReminderRequest(event: HydrationReminderRequestEvent) {
        logger.info("[KAFKA CONSUMER] Received hydration reminder request for device: ${event.deviceIdentifier}")
        logger.debug("[KAFKA CONSUMER] Hydration reminder event details: deviceIdentifier=${event.deviceIdentifier}, title=${event.title}, body=${event.body}")

        val notification = PushNotificationRequest(
            title = event.title,
            subtitle = event.subtitle,
            body = event.body,
            sound = "default"
        )
        
        logger.info("[KAFKA CONSUMER] Sending hydration reminder to device: ${event.deviceIdentifier}")

        try {
            val result = pushNotificationService.sendPushToDevice(event.deviceIdentifier, notification)
            if (result.success) {
                logger.info("[KAFKA CONSUMER SUCCESS] Hydration reminder sent successfully to device: ${event.deviceIdentifier}")
            } else {
                logger.warn("[KAFKA CONSUMER ERROR] Failed to send hydration reminder to device: ${event.deviceIdentifier}, message=${result.message}")
            }
        } catch (e: Exception) {
            logger.error("[KAFKA CONSUMER ERROR] Error sending hydration reminder to device: ${event.deviceIdentifier}", e)
        }
    }
}
