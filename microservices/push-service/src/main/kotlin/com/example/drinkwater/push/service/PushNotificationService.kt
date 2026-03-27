package com.example.drinkwater.push.service

import com.example.drinkwater.dto.PushNotificationTarget
import com.example.drinkwater.push.client.ApnsClient
import com.example.drinkwater.push.client.ApnsTokenClient
import com.example.drinkwater.push.client.DeviceServiceClient
import com.example.drinkwater.push.dto.PushNotificationRequest
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service

@Service
class PushNotificationService(
    @Autowired(required = false) private val apnsClient: ApnsClient?,
    @Autowired(required = false) private val apnsTokenClient: ApnsTokenClient?,
    @Autowired(required = false) private val deviceServiceClient: DeviceServiceClient?,
    private val objectMapper: ObjectMapper,
) {
    private val logger = LoggerFactory.getLogger(PushNotificationService::class.java)

    @Value("\${push.apns.topic:com.sk.drink-water}")
    private lateinit var apnsTopic: String

    @Value("\${push.apns.token.enabled:false}")
    private var tokenAuthEnabled: Boolean = false

    fun sendPushToDevice(
        deviceIdentifier: String,
        pushToken: String,
        notification: PushNotificationRequest,
    ): PushNotificationResult {
        // Use token-based client if enabled, otherwise fall back to certificate-based
        val client = if (tokenAuthEnabled && apnsTokenClient != null) apnsTokenClient else apnsClient

        if (client == null) {
            logger.warn("No APNS client available (neither token-based nor certificate-based)")
            return PushNotificationResult(
                deviceIdentifier = deviceIdentifier,
                success = false,
                message = "No APNS client configured",
            )
        }

        val authMethod =
            if (tokenAuthEnabled && apnsTokenClient != null) {
                "token-based (p8)"
            } else {
                "certificate-based (p12)"
            }
        logger.info("Using $authMethod authentication for APNS")

        return try {
            val apnsPayload = buildApnsPayload(notification)

            logger.info("Sending push notification to device: $deviceIdentifier")
            logger.info("APNS topic: $apnsTopic")

            val response: ResponseEntity<String> =
                if (client is ApnsTokenClient) {
                    client.sendPushNotification(
                        deviceToken = pushToken,
                        payload = apnsPayload,
                        apnsTopic = apnsTopic,
                        apnsPushType = "alert",
                    )
                } else {
                    (client as ApnsClient).sendPushNotification(
                        deviceToken = pushToken,
                        payload = apnsPayload,
                        apnsTopic = apnsTopic,
                        apnsPushType = "alert",
                    )
                }

            val success = response.statusCode.is2xxSuccessful

            logger.info("APNS Response Status: ${response.statusCode}")
            logger.info("APNS Response Body: ${response.body}")

            PushNotificationResult(
                deviceIdentifier = deviceIdentifier,
                success = success,
                message =
                    if (success) {
                        "Push sent successfully"
                    } else {
                        "Push failed: ${response.statusCode} - ${response.body}"
                    },
                statusCode = response.statusCode.value(),
            )
        } catch (e: Exception) {
            logger.error("Failed to send push notification to device: $deviceIdentifier", e)
            PushNotificationResult(
                deviceIdentifier = deviceIdentifier,
                success = false,
                message = "Failed to send push: ${e.message}",
            )
        }
    }

    fun sendPushToDevice(
        deviceIdentifier: String,
        notification: PushNotificationRequest,
    ): PushNotificationResult {
        if (deviceServiceClient == null) {
            logger.warn("Device service client not available")
            return PushNotificationResult(
                deviceIdentifier = deviceIdentifier,
                success = false,
                message = "Device service client not configured",
            )
        }

        return try {
            val deviceResponse = deviceServiceClient.getDevice(deviceIdentifier)
            if (!deviceResponse.statusCode.is2xxSuccessful || deviceResponse.body == null) {
                return PushNotificationResult(
                    deviceIdentifier = deviceIdentifier,
                    success = false,
                    message = "Device not found or inactive",
                )
            }

            val device = deviceResponse.body!!
            return sendPushToDevice(deviceIdentifier, device.pushToken, notification)
        } catch (e: Exception) {
            logger.error("Failed to fetch device or send push to device: $deviceIdentifier", e)
            return PushNotificationResult(
                deviceIdentifier = deviceIdentifier,
                success = false,
                message = "Failed to send push: ${e.message}",
            )
        }
    }

    fun sendPushToStore(
        storeId: String,
        notification: PushNotificationRequest,
    ): List<PushNotificationResult> {
        if (deviceServiceClient == null) {
            logger.warn("Device service client not available")
            return listOf(
                PushNotificationResult(
                    deviceIdentifier = "store:$storeId",
                    success = false,
                    message = "Device service client not configured",
                ),
            )
        }

        return try {
            val devicesResponse = deviceServiceClient.getDevicesByStore(storeId)
            if (!devicesResponse.statusCode.is2xxSuccessful || devicesResponse.body == null) {
                return listOf(
                    PushNotificationResult(
                        deviceIdentifier = "store:$storeId",
                        success = false,
                        message = "No devices found for store",
                    ),
                )
            }

            val devices = devicesResponse.body!!
            return devices.filter { it.isActive }.map { device ->
                sendPushToDevice(device.deviceIdentifier, device.pushToken, notification)
            }
        } catch (e: Exception) {
            logger.error("Failed to send push to store: $storeId", e)
            return listOf(
                PushNotificationResult(
                    deviceIdentifier = "store:$storeId",
                    success = false,
                    message = "Failed to send push to store: ${e.message}",
                ),
            )
        }
    }

    fun sendBulkPush(
        targets: List<PushNotificationTarget>,
        notification: PushNotificationRequest,
    ): List<PushNotificationResult> {
        return targets.map { target ->
            sendPushToDevice(target.deviceIdentifier, notification)
        }
    }

    private fun buildApnsPayload(notification: PushNotificationRequest): String {
        val aps =
            mutableMapOf<String, Any>(
                "alert" to
                    mapOf(
                        "title" to notification.title,
                        "body" to notification.body,
                    ),
                "sound" to notification.sound,
            )

        notification.subtitle?.let {
            aps["alert"] =
                mapOf(
                    "title" to notification.title,
                    "subtitle" to it,
                    "body" to notification.body,
                )
        }

        notification.threadId?.let { aps["thread-id"] = it }
        notification.category?.let { aps["category"] = it }

        val payload = mutableMapOf<String, Any>("aps" to aps)
        notification.customData?.let { payload.putAll(it) }

        return objectMapper.writeValueAsString(payload)
    }
}

data class PushNotificationResult(
    val deviceIdentifier: String,
    val success: Boolean,
    val message: String,
    val statusCode: Int? = null,
)
