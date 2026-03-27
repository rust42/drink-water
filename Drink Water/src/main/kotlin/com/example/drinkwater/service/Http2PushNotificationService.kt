package com.example.drinkwater.service

import com.example.drinkwater.entity.Device
import com.example.drinkwater.repository.DeviceRepository
import com.example.drinkwater.dto.PushNotificationRequest
import com.example.drinkwater.dto.PushNotificationTarget
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import java.io.File
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.security.KeyStore
import javax.net.ssl.SSLContext
import org.apache.http.ssl.SSLContextBuilder
import java.time.Duration

@Service
@ConditionalOnProperty(name = ["push.apns.cert.path"])
class Http2PushNotificationService(
    private val deviceRepository: DeviceRepository,
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(Http2PushNotificationService::class.java)

    @Value("\${push.apns.cert.path}")
    private lateinit var certPath: String

    @Value("\${push.apns.cert.password}")
    private lateinit var certPassword: String

    @Value("\${push.apns.topic}")
    private lateinit var apnsTopic: String

    @Value("\${push.apns.sandbox.url}")
    private lateinit var apnsSandboxUrl: String

    @Value("\${push.apns.production.url}")
    private lateinit var apnsProductionUrl: String

    @Value("\${push.apns.sandbox:true}")
    private var useSandbox: Boolean = true

    private val httpClient by lazy {
        try {
            // Load the certificate
            val keyStore = KeyStore.getInstance("PKCS12")
            File(certPath).inputStream().use { fis ->
                keyStore.load(fis, certPassword.toCharArray())
            }
            
            // Create SSL context
            val sslContext: SSLContext = SSLContextBuilder.create()
                .loadKeyMaterial(keyStore, certPassword.toCharArray())
                .build()
            
            // Create HTTP/2 client
            val client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .sslContext(sslContext)
                .connectTimeout(Duration.ofSeconds(30))
                .build()
            
            logger.info("HTTP/2 APNS client created successfully")
            logger.info("Using sandbox: $useSandbox")
            logger.info("APNS topic: $apnsTopic")
            
            client
        } catch (e: Exception) {
            logger.error("Failed to create HTTP/2 APNS client", e)
            throw RuntimeException("Failed to create HTTP/2 APNS client: ${e.message}", e)
        }
    }

    fun sendPushToDevice(deviceIdentifier: String, notification: PushNotificationRequest): PushNotificationResult {
        try {
            val device = deviceRepository.findByDeviceIdentifierAndIsActive(deviceIdentifier, true)
                .orElseThrow { IllegalArgumentException("Device not found: $deviceIdentifier") }

            return sendPushToDevice(device, notification)
        } catch (e: Exception) {
            logger.error("Failed to send push to device: $deviceIdentifier", e)
            return PushNotificationResult(
                deviceIdentifier = deviceIdentifier,
                success = false,
                message = "Failed: ${e.message}"
            )
        }
    }

    fun sendPushToStore(storeId: String, notification: PushNotificationRequest): List<PushNotificationResult> {
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
            val payload = buildApnsPayload(notification)
            val apnsUrl = if (useSandbox) apnsSandboxUrl else apnsProductionUrl
            
            logger.info("Sending push notification to device: ${device.deviceIdentifier}")
            logger.info("Device token: ${device.pushToken}")
            logger.info("APNS topic: $apnsTopic")
            logger.info("APNS URL: $apnsUrl")
            
            val request = HttpRequest.newBuilder()
                .uri(URI.create("$apnsUrl/${device.pushToken}"))
                .header("Content-Type", "application/json")
                .header("apns-topic", apnsTopic)
                .header("apns-push-type", "alert")
                .header("User-Agent", "Drink-Water/1.0")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .timeout(Duration.ofSeconds(30))
                .build()

            val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
            
            val success = response.statusCode() in 200..299
            
            logger.info("APNS Response Status: ${response.statusCode()}")
            logger.info("APNS Response Headers: ${response.headers()}")
            logger.info("APNS Response Body: ${response.body()}")
            
            return PushNotificationResult(
                deviceIdentifier = device.deviceIdentifier,
                success = success,
                message = if (success) {
                    "Push sent successfully"
                } else {
                    "Push failed: ${response.statusCode()} - ${response.body()}"
                },
                statusCode = response.statusCode()
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
}
