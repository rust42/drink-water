package com.example.drinkwater.push.service

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.example.drinkwater.push.dto.DynamicPushRequest
import com.example.drinkwater.push.dto.DynamicPushResponse
import com.example.drinkwater.push.dto.PushResult
import com.example.drinkwater.push.dto.PushNotificationRequest
import com.fasterxml.jackson.databind.ObjectMapper
import okhttp3.ConnectionSpec
import okhttp3.Protocol
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.TlsVersion
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.MediaType.Companion.toMediaType
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.io.File
import java.nio.file.Files
import java.security.KeyFactory
import java.security.KeyStore
import java.security.interfaces.ECPrivateKey
import java.security.spec.PKCS8EncodedKeySpec
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Base64
import java.util.Collections
import java.util.Date
import java.util.concurrent.ConcurrentHashMap
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

@Service
class DynamicPushService(
    private val objectMapper: ObjectMapper,
) {
    private val logger = LoggerFactory.getLogger(DynamicPushService::class.java)
    private val tokenCache = ConcurrentHashMap<String, TokenInfo>()

    companion object {
        private const val APNS_SANDBOX_URL = "https://api.sandbox.push.apple.com/3/device"
        private const val APNS_PRODUCTION_URL = "https://api.push.apple.com/3/device"
    }

    fun sendDynamicPush(
        p8KeyContent: String,
        request: DynamicPushRequest,
    ): DynamicPushResponse {
        logger.info("[DYNAMIC PUSH] Sending dynamic push to ${request.deviceTokens.size} devices")
        logger.info("[DYNAMIC PUSH] Bundle ID: ${request.bundleId}, Key ID: ${request.p8KeyId}, Team ID: ${request.teamId}")
        logger.info("[DYNAMIC PUSH] Environment: ${if (request.isProduction) "Production" else "Sandbox"}")

        return try {
            // Generate JWT token from the p8 key content
            val jwtToken = generateJwtToken(p8KeyContent, request.p8KeyId, request.teamId)
            logger.info("[DYNAMIC PUSH] JWT token generated successfully")

            // Create HTTP client
            val httpClient = createHttpClient()
            val apnsUrl = if (request.isProduction) APNS_PRODUCTION_URL else APNS_SANDBOX_URL

            // Build APNS payload
            val payload = buildApnsPayload(request.notification)
            logger.debug("[DYNAMIC PUSH] APNS Payload: $payload")

            // Send to each device token
            val results = request.deviceTokens.map { deviceToken ->
                sendPushToDevice(httpClient, apnsUrl, jwtToken, request.bundleId, deviceToken, payload)
            }

            val successCount = results.count { it.success }
            logger.info("[DYNAMIC PUSH] Completed: $successCount/${results.size} successful")

            DynamicPushResponse(
                success = successCount > 0,
                message = "Push notifications sent: $successCount/${results.size} successful",
                results = results,
            )
        } catch (e: Exception) {
            logger.error("[DYNAMIC PUSH ERROR] Failed to send dynamic push", e)
            DynamicPushResponse(
                success = false,
                message = "Failed to send push: ${e.message}",
            )
        }
    }

    private fun sendPushToDevice(
        httpClient: OkHttpClient,
        apnsUrl: String,
        jwtToken: String,
        bundleId: String,
        deviceToken: String,
        payload: String,
    ): PushResult {
        return try {
            logger.info("[APNS REQUEST] Sending to device: ${deviceToken.take(20)}...")

            val url = "$apnsUrl/$deviceToken"
            val requestBody = payload.toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url(url)
                .post(requestBody)
                .header("authorization", "bearer $jwtToken")
                .header("apns-topic", bundleId)
                .header("apns-push-type", "alert")
                .header("content-type", "application/json")
                .build()

            httpClient.newCall(request).execute().use { response ->
                val success = response.isSuccessful
                val responseBody = response.body?.string()

                logger.info("[APNS RESPONSE] Status: ${response.code}, Success: $success")
                if (!success) {
                    logger.error("[APNS ERROR] Response body: $responseBody")
                }

                PushResult(
                    deviceToken = deviceToken,
                    success = success,
                    message = if (success) "Push sent successfully" else "Failed: ${response.code} - $responseBody",
                    statusCode = response.code,
                )
            }
        } catch (e: Exception) {
            logger.error("[APNS EXCEPTION] Failed to send to device: ${deviceToken.take(20)}...", e)
            PushResult(
                deviceToken = deviceToken,
                success = false,
                message = "Exception: ${e.message}",
            )
        }
    }

    private fun generateJwtToken(p8KeyContent: String, keyId: String, teamId: String): String {
        val cacheKey = "$teamId:$keyId"
        val cached = tokenCache[cacheKey]
        if (cached != null && cached.isValid()) {
            logger.debug("[JWT] Using cached token for $cacheKey")
            return cached.token
        }

        logger.info("[JWT] Generating new token for keyId=$keyId, teamId=$teamId")

        val privateKey = parseP8Key(p8KeyContent)
        val algorithm = Algorithm.ECDSA256(null, privateKey)

        val token = JWT.create()
            .withKeyId(keyId)
            .withIssuer(teamId)
            .withIssuedAt(Date())
            .sign(algorithm)

        tokenCache[cacheKey] = TokenInfo(token, Instant.now())
        logger.info("[JWT] Token generated successfully")
        return token
    }

    private fun parseP8Key(p8KeyContent: String): ECPrivateKey {
        return try {
            val keyContent = p8KeyContent
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace(Regex("\\s"), "")

            val decodedKey = Base64.getDecoder().decode(keyContent)
            val keySpec = PKCS8EncodedKeySpec(decodedKey)
            val keyFactory = KeyFactory.getInstance("EC")
            keyFactory.generatePrivate(keySpec) as ECPrivateKey
        } catch (e: Exception) {
            throw IllegalArgumentException("Invalid p8 key content: ${e.message}", e)
        }
    }

    private fun createHttpClient(): OkHttpClient {
        val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
        trustManagerFactory.init(null as KeyStore?)

        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(null, trustManagerFactory.trustManagers, null)

        val trustManager = trustManagerFactory.trustManagers[0] as X509TrustManager

        val connectionSpec = ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
            .tlsVersions(TlsVersion.TLS_1_2, TlsVersion.TLS_1_3)
            .allEnabledCipherSuites()
            .build()

        return OkHttpClient.Builder()
            .sslSocketFactory(sslContext.socketFactory, trustManager)
            .connectionSpecs(Collections.singletonList(connectionSpec))
            .protocols(listOf(Protocol.HTTP_2, Protocol.HTTP_1_1))
            .build()
    }

    private fun buildApnsPayload(notification: PushNotificationRequest): String {
        val aps = mutableMapOf<String, Any>(
            "alert" to mutableMapOf<String, Any>(
                "title" to notification.title,
                "body" to notification.body,
            ),
            "sound" to (notification.sound ?: "default"),
        )

        notification.subtitle?.let {
            (aps["alert"] as MutableMap<String, Any>)["subtitle"] = it
        }

        notification.threadId?.let { aps["thread-id"] = it }
        notification.category?.let { aps["category"] = it }

        val payload = mutableMapOf<String, Any>("aps" to aps)
        notification.customData?.let { payload.putAll(it) }

        return objectMapper.writeValueAsString(payload)
    }

    data class TokenInfo(val token: String, val createdAt: Instant) {
        fun isValid(): Boolean {
            // Tokens are valid for 1 hour, refresh after 55 minutes
            return createdAt.plus(55, ChronoUnit.MINUTES).isAfter(Instant.now())
        }
    }
}
