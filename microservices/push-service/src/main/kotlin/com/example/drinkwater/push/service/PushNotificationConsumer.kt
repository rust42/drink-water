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
        logger.info("Received device registered event for device: ${event.deviceIdentifier}")

        // Send welcome notification to newly registered device
        val notification = PushNotificationRequest(
            title = "Welcome!",
            subtitle = "Device Registered Successfully",
            body = "Your device has been registered for hydration reminders. Stay hydrated!",
            sound = "default"
        )

        try {
            val result = pushNotificationService.sendPushToDevice(event.deviceIdentifier, notification)
            if (result.success) {
                logger.info("Welcome notification sent successfully to device: ${event.deviceIdentifier}")
            } else {
                logger.warn("Failed to send welcome notification to device: ${event.deviceIdentifier}")
            }
        } catch (e: Exception) {
            logger.error("Error sending welcome notification to device: ${event.deviceIdentifier}", e)
        }
    }

    /**
     * Listen for water intake recorded events
     */
    @KafkaListener(topics = ["\${spring.kafka.topic.water-intake-recorded:water-intake-recorded}"], groupId = "\${spring.kafka.consumer.group-id:push-notification-group}")
    fun handleWaterIntakeRecordedEvent(event: WaterIntakeRecordedEvent) {
        logger.info("Received water intake recorded event for device: ${event.deviceIdentifier}, total: ${event.totalIntake}ml")

        // Send achievement notification if daily goal is reached
        if (event.totalIntake >= event.dailyGoal) {
            val notification = PushNotificationRequest(
                title = "Daily Goal Achieved!",
                subtitle = "Congratulations!",
                body = "You've reached your daily hydration goal of ${event.dailyGoal}ml. Great job staying hydrated!",
                sound = "default"
            )

            try {
                val result = pushNotificationService.sendPushToDevice(event.deviceIdentifier, notification)
                if (result.success) {
                    logger.info("Achievement notification sent successfully to device: ${event.deviceIdentifier}")
                } else {
                    logger.warn("Failed to send achievement notification to device: ${event.deviceIdentifier}")
                }
            } catch (e: Exception) {
                logger.error("Error sending achievement notification to device: ${event.deviceIdentifier}", e)
            }
        }
    }

    /**
     * Listen for hydration reminder request events
     */
    @KafkaListener(topics = ["\${spring.kafka.topic.hydration-reminder:hydration-reminder}"], groupId = "\${spring.kafka.consumer.group-id:push-notification-group}")
    fun handleHydrationReminderRequest(event: HydrationReminderRequestEvent) {
        logger.info("Received hydration reminder request for device: ${event.deviceIdentifier}")

        val notification = PushNotificationRequest(
            title = event.title,
            subtitle = event.subtitle,
            body = event.body,
            sound = "default"
        )

        try {
            val result = pushNotificationService.sendPushToDevice(event.deviceIdentifier, notification)
            if (result.success) {
                logger.info("Hydration reminder sent successfully to device: ${event.deviceIdentifier}")
            } else {
                logger.warn("Failed to send hydration reminder to device: ${event.deviceIdentifier}")
            }
        } catch (e: Exception) {
            logger.error("Error sending hydration reminder to device: ${event.deviceIdentifier}", e)
        }
    }
}
