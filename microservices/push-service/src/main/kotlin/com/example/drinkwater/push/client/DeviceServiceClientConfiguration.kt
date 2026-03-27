package com.example.drinkwater.push.client

import feign.Client
import feign.okhttp.OkHttpClient
import okhttp3.ConnectionSpec
import okhttp3.Protocol
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class DeviceServiceClientConfiguration {
    @Bean
    fun deviceServiceClient(): Client {
        // Build OkHttp client with cleartext enabled for internal HTTP service calls
        val okHttpClient =
            okhttp3.OkHttpClient.Builder()
                .connectionSpecs(listOf(ConnectionSpec.CLEARTEXT, ConnectionSpec.MODERN_TLS))
                .protocols(listOf(Protocol.HTTP_1_1, Protocol.HTTP_2))
                .build()

        return OkHttpClient(okHttpClient)
    }
}
