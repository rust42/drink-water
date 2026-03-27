package com.example.drinkwater.push.client

import feign.Client
import feign.okhttp.OkHttpClient
import okhttp3.ConnectionSpec
import okhttp3.Interceptor
import okhttp3.Protocol
import okhttp3.TlsVersion
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.security.KeyStore
import java.util.Collections
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

@Configuration
@ConditionalOnProperty(
    name = ["push.apns.token.enabled"],
    havingValue = "true",
    matchIfMissing = false,
)
class ApnsTokenBasedClientConfiguration {
    @Value("\${push.apns.sandbox.url:https://api.sandbox.push.apple.com/3/device}")
    private lateinit var apnsUrl: String

    @Autowired(required = false)
    private var tokenInterceptor: Interceptor? = null

    @Bean
    fun apnsTokenClient(): Client {
        // Initialize TrustManagerFactory
        val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
        trustManagerFactory.init(null as KeyStore?)

        // Create SSL context without client certificate (using JWT instead)
        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(null, trustManagerFactory.trustManagers, null)

        // Get the trust manager
        val trustManager = trustManagerFactory.trustManagers[0] as X509TrustManager

        // Configure connection spec for TLS 1.2+ with HTTP/2
        val connectionSpec =
            ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
                .tlsVersions(TlsVersion.TLS_1_2, TlsVersion.TLS_1_3)
                .allEnabledCipherSuites()
                .build()

        // Build OkHttp client
        val builder =
            okhttp3.OkHttpClient.Builder()
                .sslSocketFactory(sslContext.socketFactory, trustManager)
                .connectionSpecs(Collections.singletonList(connectionSpec))
                .protocols(listOf(Protocol.HTTP_2, Protocol.HTTP_1_1))

        // Add JWT interceptor if available
        tokenInterceptor?.let {
            builder.addInterceptor(it)
        }

        return OkHttpClient(builder.build())
    }
}
