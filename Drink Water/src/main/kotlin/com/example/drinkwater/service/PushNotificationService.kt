package com.example.drinkwater.service

import com.example.drinkwater.client.ApnsClient
import com.example.drinkwater.dto.PushNotificationRequest
import com.example.drinkwater.dto.PushNotificationTarget
import com.example.drinkwater.entity.Device
import com.example.drinkwater.repository.DeviceRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean

@Service
class PushNotificationService(
    private val deviceRepository: DeviceRepository,
    @Autowired(required = false) private val apnsClient: ApnsClient?,
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(PushNotificationService::class.java)

    @Value("\${push.apns.topic:com.sk.drink-water}")
    private lateinit var apnsTopic: String

    @Value("\${push.apns.sandbox.url:https://api.sandbox.push.apple.com/3/device}")
    private lateinit var apnsSandboxUrl: String

    @Value("\${push.apns.production.url:https://api.push.apple.com/3/device}")
    private lateinit var apnsProductionUrl: String

    @Value("\${push.apns.sandbox:true}")
    private var useSandbox: Boolean = true

    fun sendPushToDevice(deviceIdentifier: String, notification: PushNotificationRequest): PushNotificationResult {
        if (apnsClient == null) {
            logger.warn("APNS client not available, skipping push notification")
            return PushNotificationResult(
                deviceIdentifier = deviceIdentifier,
                success = false,
                message = "APNS client not configured"
            )
        }

        val device = deviceRepository.findByDeviceIdentifierAndIsActive(deviceIdentifier, true)
            .orElseThrow { IllegalArgumentException("Device not found: $deviceIdentifier") }

        return sendPushToDevice(device, notification)
    }

    fun sendPushToStore(storeId: String, notification: PushNotificationRequest): List<PushNotificationResult> {
        if (apnsClient == null) {
            logger.warn("APNS client not available, skipping push notification")
            return emptyList()
        }

        val devices = deviceRepository.findByStoreIdAndIsActive(storeId, true)
        
        if (devices.isEmpty()) {
            logger.warn("No active devices found for store: $storeId")
            return emptyList()
        }

        return devices.map { device ->
            sendPushToDevice(device, notification)
        }
    }

    fun sendBulkPush(targets: List<PushNotificationTarget>, notification: PushNotificationRequest): List<PushNotificationResult> {
        if (apnsClient == null) {
            logger.warn("APNS client not available, skipping push notification")
            return targets.map { target ->
                PushNotificationResult(
                    deviceIdentifier = target.deviceIdentifier,
                    success = false,
                    message = "APNS client not configured"
                )
            }
        }

        return targets.mapNotNull { target ->
            try {
                val device = deviceRepository.findByDeviceIdentifierAndIsActive(target.deviceIdentifier, true)
                    .filter { it.storeId == target.storeId }
                    .orElse(null)
                
                if (device != null) {
                    sendPushToDevice(device, notification)
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

    private fun sendPushToDevice(device: Device, notification: PushNotificationRequest): PushNotificationResult {
        try {
            val apnsPayload = buildApnsPayload(notification)
            val headers = buildApnsHeaders()
            
            logger.info("Sending push notification to device: ${device.deviceIdentifier}")
            logger.info("Device token: ${device.pushToken}")
            logger.info("APNS topic: $apnsTopic")
            logger.info("Using sandbox: $useSandbox")
            logger.info("APNS URL: ${if (useSandbox) apnsSandboxUrl else apnsProductionUrl}")
            
            val response: ResponseEntity<String> = apnsClient!!.sendPushNotification(
                deviceToken = device.pushToken,
                payload = apnsPayload,
                apnsTopic = apnsTopic,
                apnsPushType = "alert"
            )
            
            val success = response.statusCode.is2xxSuccessful
            
            logger.info("APNS Response Status: ${response.statusCode}")
            logger.info("APNS Response Headers: ${response.headers}")
            logger.info("APNS Response Body: ${response.body}")
            
            return PushNotificationResult(
                deviceIdentifier = device.deviceIdentifier,
                success = success,
                message = if (success) "Push sent successfully" else "Push failed: ${response.statusCode} - ${response.body}",
                statusCode = response.statusCode.value()
            )
            
        } catch (e: Exception) {
            logger.error("Failed to send push notification to device: ${device.deviceIdentifier}", e)
            return PushNotificationResult(
                deviceIdentifier = device.deviceIdentifier,
                success = false,
                message = "Failed to send push: ${e.message}"
            )
        }
    }

    private fun buildApnsPayload(notification: PushNotificationRequest): String {
        val aps = mutableMapOf<String, Any>(
            "alert" to mapOf(
                "title" to notification.title,
                "body" to notification.body
            ),
            "sound" to notification.sound
        )
        
        notification.subtitle?.let { aps["alert"] = mapOf(
            "title" to notification.title,
            "subtitle" to it,
            "body" to notification.body
        ) }
        
        notification.threadId?.let { aps["thread-id"] = it }
        notification.category?.let { aps["category"] = it }
        
        val payload = mutableMapOf<String, Any>("aps" to aps)
        notification.customData?.let { payload.putAll(it) }
        
        return objectMapper.writeValueAsString(payload)
    }

    private fun buildApnsHeaders(): HttpHeaders {
        val headers = HttpHeaders()
        headers["apns-topic"] = apnsTopic
        headers["apns-push-type"] = "alert"
        return headers
    }
}

data class PushNotificationResult(
    val deviceIdentifier: String,
    val success: Boolean,
    val message: String,
    val statusCode: Int? = null
)
