package com.example.drinkwater.push.client

import feign.Client
import feign.okhttp.OkHttpClient
import okhttp3.ConnectionSpec
import okhttp3.Protocol
import okhttp3.TlsVersion
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.File
import java.io.FileInputStream
import java.security.KeyStore
import java.util.Collections
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

@Configuration
@ConditionalOnProperty(name = ["push.apns.token.enabled"], havingValue = "false", matchIfMissing = true)
class ApnsClientConfiguration {
    // Empty-string default so startup never fails due to a missing property binding.
    // The actual value comes from application.yml / env-var injection in pods.
    @Value("\${push.apns.cert.path:}")
    private lateinit var certPath: String

    @Value("\${push.apns.cert.password:}")
    private lateinit var certPassword: String

    private val logger = LoggerFactory.getLogger(ApnsClientConfiguration::class.java)

    @Bean
    fun apnsClient(): Client {
        val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
        trustManagerFactory.init(null as KeyStore?)
        val trustManager = trustManagerFactory.trustManagers[0] as X509TrustManager

        val connectionSpec =
            ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
                .tlsVersions(TlsVersion.TLS_1_2, TlsVersion.TLS_1_3)
                .allEnabledCipherSuites()
                .build()

        val certFile = certPath.takeIf { it.isNotBlank() }?.let { File(it) }

        if (certFile == null || !certFile.exists()) {
            // Cert not available (e.g. local IntelliJ run without credentials).
            // App starts normally; APNS calls will fail at request-time with a TLS error.
            logger.warn(
                "[APNS] p12 certificate not found at '{}'. " +
                    "APNS push calls will fail at runtime. " +
                    "Set PUSH_APNS_CERT_PATH (p12) or PUSH_APNS_TOKEN_ENABLED=true (p8) for pod deployment.",
                certPath.ifBlank { "(not configured)" },
            )
            val sslContext = SSLContext.getInstance("TLS")
            sslContext.init(null, trustManagerFactory.trustManagers, null)
            val okHttpClient =
                okhttp3.OkHttpClient.Builder()
                    .sslSocketFactory(sslContext.socketFactory, trustManager)
                    .connectionSpecs(Collections.singletonList(connectionSpec))
                    .protocols(listOf(Protocol.HTTP_2, Protocol.HTTP_1_1))
                    .build()
            return OkHttpClient(okHttpClient)
        }

        // Certificate is present — build full mutual-TLS client.
        logger.info("[APNS] Loading p12 certificate from '{}'", certPath)
        val keyStore = KeyStore.getInstance("PKCS12")
        FileInputStream(certFile).use { fis ->
            keyStore.load(fis, certPassword.toCharArray())
        }
        val keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
        keyManagerFactory.init(keyStore, certPassword.toCharArray())

        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(keyManagerFactory.keyManagers, trustManagerFactory.trustManagers, null)

        val okHttpClient =
            okhttp3.OkHttpClient.Builder()
                .sslSocketFactory(sslContext.socketFactory, trustManager)
                .connectionSpecs(Collections.singletonList(connectionSpec))
                .protocols(listOf(Protocol.HTTP_2, Protocol.HTTP_1_1))
                .build()

        logger.info("[APNS] p12 client ready (mTLS)")
        return OkHttpClient(okHttpClient)
    }
}
