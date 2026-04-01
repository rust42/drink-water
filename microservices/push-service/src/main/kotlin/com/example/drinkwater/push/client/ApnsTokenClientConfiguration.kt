package com.example.drinkwater.push.client

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import okhttp3.Interceptor
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.File
import java.nio.file.Files
import java.security.KeyFactory
import java.security.interfaces.ECPrivateKey
import java.security.spec.PKCS8EncodedKeySpec
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*
import java.util.concurrent.ConcurrentHashMap

@Configuration
@ConditionalOnProperty(name = ["push.apns.token.enabled"], havingValue = "true")
class ApnsTokenClientConfiguration {
    // Empty-string defaults prevent binding failures when the docker profile is not active.
    // Values must be non-blank at token generation time (validated in generateJwtToken).
    @Value("\${push.apns.token.key-id:}")
    private lateinit var keyId: String

    @Value("\${push.apns.token.team-id:}")
    private lateinit var teamId: String

    @Value("\${push.apns.token.p8-path:}")
    private lateinit var p8Path: String

    private val tokenCache = ConcurrentHashMap<String, TokenInfo>()
    private val logger = LoggerFactory.getLogger(ApnsTokenClientConfiguration::class.java)

    @Bean
    fun apnsTokenInterceptor(): Interceptor {
        return Interceptor { chain ->
            val request = chain.request()
            val token = getOrCreateJwtToken()

            val newRequest =
                request.newBuilder()
                    .header("authorization", "bearer $token")
                    .build()

            chain.proceed(newRequest)
        }
    }

    private fun getOrCreateJwtToken(): String {
        val cached = tokenCache["apns-jwt"]
        if (cached != null && cached.isValid()) {
            return cached.token
        }

        val newToken = generateJwtToken()
        tokenCache["apns-jwt"] = TokenInfo(newToken, Instant.now())
        return newToken
    }

    private fun generateJwtToken(): String {
        if (keyId.isBlank() || teamId.isBlank() || p8Path.isBlank()) {
            throw IllegalStateException(
                "[APNS] Token-based auth is enabled but configuration is incomplete. " +
                    "Set PUSH_APNS_TOKEN_KEY_ID, PUSH_APNS_TOKEN_TEAM_ID, and PUSH_APNS_TOKEN_P8_PATH.",
            )
        }
        val p8File = File(p8Path)
        if (!p8File.exists()) {
            throw RuntimeException("[APNS] p8 key file not found at: $p8Path")
        }

        val keyContent =
            Files.readString(p8File.toPath())
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace(Regex("\\s"), "")

        val decodedKey = Base64.getDecoder().decode(keyContent)
        val keySpec = PKCS8EncodedKeySpec(decodedKey)
        val keyFactory = KeyFactory.getInstance("EC")
        val privateKey = keyFactory.generatePrivate(keySpec) as ECPrivateKey

        val algorithm = Algorithm.ECDSA256(null, privateKey)

        val token = JWT.create()
            .withKeyId(keyId)
            .withIssuer(teamId)
            .withIssuedAt(Date())
            .sign(algorithm)

        logger.info("[APNS JWT] Generated token — kid={}, iss={}, iat={}", keyId, teamId, Instant.now().epochSecond)
        return token
    }

    data class TokenInfo(val token: String, val createdAt: Instant) {
        fun isValid(): Boolean {
            // Tokens are valid for 1 hour, refresh after 55 minutes
            return createdAt.plus(55, ChronoUnit.MINUTES).isAfter(Instant.now())
        }
    }
}
