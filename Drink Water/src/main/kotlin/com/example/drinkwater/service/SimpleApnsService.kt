package com.example.drinkwater.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service
import org.slf4j.LoggerFactory
import java.io.File
import java.io.FileInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.KeyStore
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import org.apache.http.ssl.SSLContextBuilder
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

@Service
@ConditionalOnProperty(name = ["push.apns.cert.path"])
class SimpleApnsService {

    private val logger = LoggerFactory.getLogger(SimpleApnsService::class.java)

    @Value("\${push.apns.cert.path}")
    private lateinit var certPath: String

    @Value("\${push.apns.cert.password}")
    private lateinit var certPassword: String

    @Value("\${push.apns.topic}")
    private lateinit var apnsTopic: String

    @Value("\${push.apns.sandbox.url}")
    private lateinit var apnsSandboxUrl: String

    fun sendSimplePush(deviceToken: String, payload: String): ResponseEntity<String> {
        return try {
            logger.info("Sending simple push to device: $deviceToken")
            
            // Load the certificate
            val keyStore = KeyStore.getInstance("PKCS12")
            FileInputStream(certPath).use { fis ->
                keyStore.load(fis, certPassword.toCharArray())
            }
            
            // Create SSL context
            val sslContext: SSLContext = SSLContextBuilder.create()
                .loadKeyMaterial(keyStore, certPassword.toCharArray())
                .build()
            
            // Create the URL
            val url = URL("$apnsSandboxUrl/$deviceToken")
            val connection: HttpsURLConnection = url.openConnection() as HttpsURLConnection
            
            // Configure SSL
            connection.sslSocketFactory = sslContext.socketFactory
            connection.hostnameVerifier = javax.net.ssl.HostnameVerifier { hostname, session -> true } // Disable hostname verification for testing
            
            // Configure request
            connection.requestMethod = "POST"
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("apns-topic", apnsTopic)
            connection.setRequestProperty("apns-push-type", "alert")
            connection.setRequestProperty("User-Agent", "Drink-Water/1.0")
            
            // Send the request
            connection.outputStream.use { os ->
                os.write(payload.toByteArray(Charsets.UTF_8))
            }
            
            // Get the response
            val responseCode: Int
            val responseBody: String
            
            try {
                responseCode = connection.responseCode
                responseBody = if (responseCode < 400) {
                    connection.inputStream.use { it.bufferedReader().readText() }
                } else {
                    connection.errorStream.use { it?.bufferedReader()?.readText() ?: "" }
                }
            } catch (e: java.io.IOException) {
                logger.error("Failed to get HTTP response. This might be due to HTTP/2 vs HTTP/1.1 incompatibility.", e)
                throw e
            }
            
            logger.info("APNS Response Code: $responseCode")
            logger.info("APNS Response Body: $responseBody")
            
            ResponseEntity.status(responseCode).body(responseBody)
            
        } catch (e: Exception) {
            logger.error("Failed to send simple push", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error: ${e.message}")
        }
    }
}
