package com.example.drinkwater.push.client

import feign.Client
import feign.okhttp.OkHttpClient
import okhttp3.ConnectionSpec
import okhttp3.Protocol
import okhttp3.TlsVersion
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
    @Value("\${push.apns.cert.path}")
    private lateinit var certPath: String

    @Value("\${push.apns.cert.password}")
    private lateinit var certPassword: String

    @Bean
    fun apnsClient(): Client {
        val certFile = File(certPath)
        if (!certFile.exists()) {
            throw RuntimeException("APNS certificate not found at: $certPath")
        }

        // Load PKCS12 keystore
        val keyStore = KeyStore.getInstance("PKCS12")
        FileInputStream(certFile).use { fis ->
            keyStore.load(fis, certPassword.toCharArray())
        }

        // Initialize KeyManagerFactory with the keystore
        val keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
        keyManagerFactory.init(keyStore, certPassword.toCharArray())

        // Initialize TrustManagerFactory
        val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
        trustManagerFactory.init(null as KeyStore?)

        // Create SSL context
        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(keyManagerFactory.keyManagers, trustManagerFactory.trustManagers, null)

        // Get the trust manager for hostname verification
        val trustManager = trustManagerFactory.trustManagers[0] as X509TrustManager

        // Configure connection spec for TLS 1.2+ with HTTP/2
        val connectionSpec =
            ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
                .tlsVersions(TlsVersion.TLS_1_2, TlsVersion.TLS_1_3)
                .allEnabledCipherSuites()
                .build()

        // Build OkHttp client with HTTP/2 and SSL
        val okHttpClient =
            okhttp3.OkHttpClient.Builder()
                .sslSocketFactory(sslContext.socketFactory, trustManager)
                .connectionSpecs(Collections.singletonList(connectionSpec))
                .protocols(listOf(Protocol.HTTP_2, Protocol.HTTP_1_1))
                .build()

        return OkHttpClient(okHttpClient)
    }
}
