package com.example.drinkwater.service

import com.example.drinkwater.dto.PushNotificationRequest
import com.example.drinkwater.dto.PushNotificationTarget
import com.example.drinkwater.entity.Device
import com.example.drinkwater.repository.DeviceRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class MockPushNotificationService(
    private val deviceRepository: DeviceRepository
) {

    private val logger = LoggerFactory.getLogger(MockPushNotificationService::class.java)

    fun sendPushToDevice(deviceIdentifier: String, notification: PushNotificationRequest): PushNotificationResult {
        logger.info("Mock: Would send push notification to device: $deviceIdentifier")
        logger.info("Mock: Notification payload: title=${notification.title}, body=${notification.body}")
        
        // Verify device exists
        deviceRepository.findByDeviceIdentifierAndIsActive(deviceIdentifier, true)
            .orElseThrow { IllegalArgumentException("Device not found: $deviceIdentifier") }

        return PushNotificationResult(
            deviceIdentifier = deviceIdentifier,
            success = true,
            message = "Mock: Push notification would be sent (APNS client not configured)"
        )
    }

    fun sendPushToStore(storeId: String, notification: PushNotificationRequest): List<PushNotificationResult> {
        val devices = deviceRepository.findByStoreIdAndIsActive(storeId, true)
        
        if (devices.isEmpty()) {
            logger.warn("No active devices found for store: $storeId")
            return emptyList()
        }

        logger.info("Mock: Would send push notification to ${devices.size} devices in store: $storeId")
        logger.info("Mock: Notification payload: title=${notification.title}, body=${notification.body}")

        return devices.map { device ->
            PushNotificationResult(
                deviceIdentifier = device.deviceIdentifier,
                success = true,
                message = "Mock: Push notification would be sent (APNS client not configured)"
            )
        }
    }

    fun sendBulkPush(targets: List<PushNotificationTarget>, notification: PushNotificationRequest): List<PushNotificationResult> {
        logger.info("Mock: Would send bulk push notification to ${targets.size} devices")
        logger.info("Mock: Notification payload: title=${notification.title}, body=${notification.body}")

        return targets.mapNotNull { target ->
            try {
                val device = deviceRepository.findByDeviceIdentifierAndIsActive(target.deviceIdentifier, true)
                    .filter { it.storeId == target.storeId }
                    .orElse(null)
                
                if (device != null) {
                    PushNotificationResult(
                        deviceIdentifier = target.deviceIdentifier,
                        success = true,
                        message = "Mock: Push notification would be sent (APNS client not configured)"
                    )
                } else {
                    logger.warn("Device not found or store mismatch: ${target.deviceIdentifier}")
                    null
                }
            } catch (e: Exception) {
                logger.error("Failed to send push to device: ${target.deviceIdentifier}", e)
                PushNotificationResult(
                    deviceIdentifier = target.deviceIdentifier,
                    success = false,
                    message = "Failed: ${e.message}"
                )
            }
        }
    }
}
