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
    
    @Value("\${push.apns.sandbox.url:https://api.sandbox.push.apple.com/3/device}")
    private lateinit var apnsUrl: String

    fun sendPushToDevice(
        deviceIdentifier: String,
        pushToken: String,
        notification: PushNotificationRequest,
    ): PushNotificationResult {
        logger.info("[SERVICE] sendPushToDevice called with deviceIdentifier=$deviceIdentifier")
        logger.debug("[SERVICE PARAMS] pushToken=${pushToken.take(10)}..., notification title=${notification.title}, body=${notification.body}")
        
        // Use token-based client if enabled, otherwise fall back to certificate-based
        val client = if (tokenAuthEnabled && apnsTokenClient != null) apnsTokenClient else apnsClient

        if (client == null) {
            logger.warn("[SERVICE ERROR] No APNS client available (neither token-based nor certificate-based)")
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
        logger.info("[APNS CONFIG] Using $authMethod authentication for APNS")
        logger.info("[APNS CONFIG] APNS URL: $apnsUrl")
        logger.info("[APNS CONFIG] APNS Topic: $apnsTopic")

        return try {
            val apnsPayload = buildApnsPayload(notification)
            
            logger.info("[APNS REQUEST] Sending push notification to device: $deviceIdentifier")
            logger.info("[APNS REQUEST] Device Token: ${pushToken.take(20)}...")
            logger.info("[APNS REQUEST] Full URL: ${apnsUrl}/$pushToken")
            logger.info("[APNS REQUEST] Headers: apns-topic=$apnsTopic, apns-push-type=alert")
            logger.debug("[APNS REQUEST] Payload: $apnsPayload")

            val response: ResponseEntity<String> =
                if (client is ApnsTokenClient) {
                    logger.info("[APNS CLIENT] Using Token-based client (ApnsTokenClient)")
                    client.sendPushNotification(
                        deviceToken = pushToken,
                        payload = apnsPayload,
                        apnsTopic = apnsTopic,
                        apnsPushType = "alert",
                    )
                } else {
                    logger.info("[APNS CLIENT] Using Certificate-based client (ApnsClient)")
                    (client as ApnsClient).sendPushNotification(
                        deviceToken = pushToken,
                        payload = apnsPayload,
                        apnsTopic = apnsTopic,
                        apnsPushType = "alert",
                    )
                }

            val success = response.statusCode.is2xxSuccessful

            logger.info("[APNS RESPONSE] Status: ${response.statusCode}")
            logger.info("[APNS RESPONSE] Body: ${response.body}")
            logger.info("[APNS RESPONSE] Headers: ${response.headers}")
            
            if (success) {
                logger.info("[APNS SUCCESS] Push notification sent successfully to device: $deviceIdentifier")
            } else {
                logger.error("[APNS ERROR] Push notification failed for device: $deviceIdentifier, status=${response.statusCode}")
            }

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
            logger.error("[APNS EXCEPTION] Failed to send push notification to device: $deviceIdentifier", e)
            logger.error("[APNS EXCEPTION] Error type: ${e.javaClass.simpleName}, message: ${e.message}")
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
        logger.info("[SERVICE] sendPushToDevice (lookup) called with deviceIdentifier=$deviceIdentifier")
        
        if (deviceServiceClient == null) {
            logger.warn("[SERVICE ERROR] Device service client not available")
            return PushNotificationResult(
                deviceIdentifier = deviceIdentifier,
                success = false,
                message = "Device service client not configured",
            )
        }

        return try {
            logger.info("[FEIGN CLIENT] Calling device-service to get device: $deviceIdentifier")
            val deviceResponse = deviceServiceClient.getDevice(deviceIdentifier)
            logger.info("[FEIGN CLIENT] Device service response: status=${deviceResponse.statusCode}")
            
            if (!deviceResponse.statusCode.is2xxSuccessful || deviceResponse.body == null) {
                logger.warn("[FEIGN CLIENT ERROR] Device not found or inactive: $deviceIdentifier")
                return PushNotificationResult(
                    deviceIdentifier = deviceIdentifier,
                    success = false,
                    message = "Device not found or inactive",
                )
            }

            val device = deviceResponse.body!!
            logger.info("[FEIGN CLIENT] Device found: pushToken=${device.pushToken.take(10)}..., deviceIdentifier=${device.deviceIdentifier}")
            return sendPushToDevice(deviceIdentifier, device.pushToken, notification)
        } catch (e: Exception) {
            logger.error("[FEIGN CLIENT ERROR] Failed to fetch device or send push to device: $deviceIdentifier", e)
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
        logger.info("[SERVICE] sendPushToStore called with storeId=$storeId")
        
        if (deviceServiceClient == null) {
            logger.warn("[SERVICE ERROR] Device service client not available")
            return listOf(
                PushNotificationResult(
                    deviceIdentifier = "store:$storeId",
                    success = false,
                    message = "Device service client not configured",
                ),
            )
        }

        return try {
            logger.info("[FEIGN CLIENT] Calling device-service to get devices for store: $storeId")
            val devicesResponse = deviceServiceClient.getDevicesByStore(storeId)
            logger.info("[FEIGN CLIENT] Device service response: status=${devicesResponse.statusCode}")
            
            if (!devicesResponse.statusCode.is2xxSuccessful || devicesResponse.body == null) {
                logger.warn("[FEIGN CLIENT ERROR] No devices found for store: $storeId")
                return listOf(
                    PushNotificationResult(
                        deviceIdentifier = "store:$storeId",
                        success = false,
                        message = "No devices found for store",
                    ),
                )
            }

            val devices = devicesResponse.body!!
            logger.info("[FEIGN CLIENT] Found ${devices.size} devices for store: $storeId")
            
            val results = devices.filter { it.isActive }.map { device ->
                logger.debug("[SERVICE] Sending push to device: ${device.deviceIdentifier}, pushToken=${device.pushToken.take(10)}...")
                sendPushToDevice(device.deviceIdentifier, device.pushToken, notification)
            }
            
            val successCount = results.count { it.success }
            logger.info("[SERVICE RESPONSE] Push to store completed: ${successCount}/${results.size} successful")
            results
        } catch (e: Exception) {
            logger.error("[SERVICE ERROR] Failed to send push to store: $storeId", e)
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
        logger.info("[SERVICE] sendBulkPush called with ${targets.size} targets")
        
        return targets.map { target ->
            logger.debug("[SERVICE] Processing bulk push target: deviceIdentifier=${target.deviceIdentifier}")
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

        val jsonPayload = objectMapper.writeValueAsString(payload)
        logger.debug("[APNS PAYLOAD] Built APNS payload: $jsonPayload")
        return jsonPayload
    }
}

data class PushNotificationResult(
    val deviceIdentifier: String,
    val success: Boolean,
    val message: String,
    val statusCode: Int? = null,
)
