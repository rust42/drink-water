package com.example.drinkwater.client

import feign.Client
import feign.httpclient.ApacheHttpClient
import org.apache.http.impl.client.CloseableHttpClient
import org.apache.http.impl.client.HttpClientBuilder
import org.apache.http.ssl.SSLContextBuilder
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.File
import java.io.FileInputStream
import java.security.KeyStore
import java.security.cert.CertificateFactory
import org.slf4j.LoggerFactory
import javax.net.ssl.SSLContext
import org.apache.http.conn.ssl.NoopHostnameVerifier
import org.apache.http.conn.ssl.SSLConnectionSocketFactory
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager
import org.apache.http.client.config.RequestConfig

@Configuration
@ConditionalOnProperty(name = ["push.apns.cert.path"])
class ApnsClientConfiguration {

    private val logger = LoggerFactory.getLogger(ApnsClientConfiguration::class.java)

    @Value("\${push.apns.cert.path}")
    private lateinit var certPath: String

    @Value("\${push.apns.cert.password}")
    private lateinit var certPassword: String

    @Bean
    fun feignClient(): Client {
        logger.info("Creating Feign client with certificate: $certPath")
        try {
            val certFile = File(certPath)
            logger.info("Certificate file exists: ${certFile.exists()}")
            logger.info("Certificate file size: ${certFile.length()} bytes")
            
            // Load PKCS12 keystore (for .p12 files)
            val keyStore = KeyStore.getInstance("PKCS12")
            FileInputStream(certFile).use { fis ->
                logger.info("Loading PKCS12 keystore...")
                keyStore.load(fis, certPassword.toCharArray())
                logger.info("PKCS12 keystore loaded successfully")
                logger.info("Keystore contains ${keyStore.size()} entries")
                
                // Log certificate details
                val aliases = keyStore.aliases()
                while (aliases.hasMoreElements()) {
                    val alias = aliases.nextElement()
                    val cert = keyStore.getCertificate(alias) as? java.security.cert.X509Certificate
                    if (cert != null) {
                        logger.info("Certificate alias: $alias")
                        logger.info("Certificate subject: ${cert.subjectDN}")
                        logger.info("Certificate issuer: ${cert.issuerDN}")
                        logger.info("Certificate valid from: ${cert.notBefore}")
                        logger.info("Certificate valid until: ${cert.notAfter}")
                        logger.info("Certificate expired: ${cert.notAfter.before(java.util.Date())}")
                    }
                }
            }
            
            logger.info("Creating SSL context...")
            val sslContext: SSLContext = SSLContextBuilder.create()
                .loadKeyMaterial(
                    keyStore,
                    certPassword.toCharArray()
                )
                .build()
            
            logger.info("SSL context created successfully")

            val sslSocketFactory = SSLConnectionSocketFactory(
                sslContext,
                arrayOf("TLSv1.2", "TLSv1.3"), // Support TLS 1.2 and 1.3
                null,
                NoopHostnameVerifier.INSTANCE // Disable hostname verification for testing
            )

            val httpClient: CloseableHttpClient = HttpClientBuilder.create()
                .setSSLSocketFactory(sslSocketFactory)
                .build()

            logger.info("Feign client created successfully")
            return ApacheHttpClient(httpClient)
        } catch (e: Exception) {
            logger.error("Failed to load APNS certificate", e)
            throw RuntimeException("Failed to load APNS certificate: ${e.message}", e)
        }
    }
}
