package com.example.drinkwater.controller

import com.example.drinkwater.dto.BulkPushNotificationRequest
import com.example.drinkwater.dto.PushNotificationRequest
import com.example.drinkwater.service.PushNotificationService
import com.example.drinkwater.service.Http2PushNotificationService
import com.example.drinkwater.client.ApnsClient
import com.example.drinkwater.service.SimpleApnsService
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/push-notifications")
class PushNotificationController(
    private val pushNotificationService: PushNotificationService,
    @Autowired(required = false) private val http2PushNotificationService: Http2PushNotificationService?,
    @Autowired(required = false) private val apnsClient: ApnsClient?,
    @Autowired(required = false) private val simpleApnsService: SimpleApnsService?
) {

    @PostMapping("/send/{deviceIdentifier}")
    fun sendPushToDevice(
        @PathVariable deviceIdentifier: String,
        @Valid @RequestBody notification: PushNotificationRequest
    ): ResponseEntity<Any> {
        return try {
            val result = if (http2PushNotificationService != null) {
                http2PushNotificationService.sendPushToDevice(deviceIdentifier, notification)
            } else {
                pushNotificationService.sendPushToDevice(deviceIdentifier, notification)
            }

            ResponseEntity.status(
                if (result.success) HttpStatus.OK else HttpStatus.BAD_REQUEST
            ).body(result)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(mapOf("error" to e.message))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Internal server error: ${e.message}"))
        }
    }

    @PostMapping("/send/store/{storeId}")
    fun sendPushToStore(
        @PathVariable storeId: String,
        @Valid @RequestBody notification: PushNotificationRequest
    ): ResponseEntity<Any> {
        return try {
            val results = pushNotificationService.sendPushToStore(storeId, notification)
ResponseEntity.ok(mapOf(
                "storeId" to storeId,
                "results" to results,
                "successCount" to results.count { it.success },
                "failureCount" to results.count { !it.success }
            ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Internal server error: ${e.message}"))
        }
    }

    @PostMapping("/send/bulk")
    fun sendBulkPush(
        @Valid @RequestBody request: BulkPushNotificationRequest
    ): ResponseEntity<Any> {
        return try {
            val results = pushNotificationService.sendBulkPush(request.targets, request.notification)
            ResponseEntity.ok(mapOf(
                "results" to results,
                "successCount" to results.count { it.success },
                "failureCount" to results.count { !it.success }
            ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Internal server error: ${e.message}"))
        }
    }

    @PostMapping("/send/hydration-reminder/{deviceIdentifier}")
    fun sendHydrationReminder(@PathVariable deviceIdentifier: String): ResponseEntity<Any> {
        val notification = PushNotificationRequest(
            title = "Hydration Alert",
            subtitle = "Drink more water today",
            body = "Drink more water to get hydrate and quench your thirst",
            threadId = "1234",
            sound = "default",
            category = "DAILY_SUMMARY"
        )
        
        return try {
            val result = if (http2PushNotificationService != null) {
                http2PushNotificationService.sendPushToDevice(deviceIdentifier, notification)
            } else {
                pushNotificationService.sendPushToDevice(deviceIdentifier, notification)
            }
            
            ResponseEntity.status(
                if (result.success) HttpStatus.OK else HttpStatus.BAD_REQUEST
            ).body(result)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(mapOf("error" to e.message))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Internal server error: ${e.message}"))
        }
    }

    @PostMapping("/send/hydration-reminder/store/{storeId}")
    fun sendHydrationReminderToStore(@PathVariable storeId: String): ResponseEntity<Any> {
        val notification = PushNotificationRequest(
            title = "Hydration Alert",
            subtitle = "Drink more water today",
            body = "Drink more water to get hydrate and quench your thirst",
            threadId = "1234",
            sound = "default",
            category = "DAILY_SUMMARY"
        )
        
        return try {
            val results = pushNotificationService.sendPushToStore(storeId, notification)
            ResponseEntity.ok(mapOf(
                "storeId" to storeId,
                "results" to results,
                "successCount" to results.count { it.success },
                "failureCount" to results.count { !it.success }
            ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Internal server error: ${e.message}"))
        }
    }

    @GetMapping("/test-connection")
    fun testApnsConnection(): ResponseEntity<Any> {
        return try {
            if (apnsClient == null) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(mapOf("error" to "APNS client not configured"))
            }
            
            ResponseEntity.ok(mapOf(
                "message" to "APNS client configured successfully",
                "clientType" to apnsClient::class.simpleName
            ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Failed to test APNS connection: ${e.message}"))
        }
    }

    @PostMapping("/test-http2/{deviceIdentifier}")
    fun testHttp2Push(@PathVariable deviceIdentifier: String): ResponseEntity<Any> {
        return try {
            if (http2PushNotificationService == null) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(mapOf("error" to "HTTP/2 APNS service not configured"))
            }
            
            val notification = PushNotificationRequest(
                title = "HTTP/2 Test",
                subtitle = "Testing HTTP/2 APNS",
                body = "This is a test push notification using Java HTTP/2 client",
                threadId = "test-http2",
                sound = "default",
                category = "TEST"
            )
            
            val result = http2PushNotificationService.sendPushToDevice(deviceIdentifier, notification)
            
            ResponseEntity.ok(mapOf(
                "deviceIdentifier" to result.deviceIdentifier,
                "success" to result.success,
                "message" to result.message,
                "statusCode" to result.statusCode
            ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Failed to send HTTP/2 test push: ${e.message}"))
        }
    }

    @PostMapping("/test-simple/{deviceIdentifier}")
    fun testSimplePush(@PathVariable deviceIdentifier: String): ResponseEntity<Any> {
        return try {
            if (simpleApnsService == null) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(mapOf("error" to "Simple APNS service not configured"))
            }
            
            val payload = """{"aps":{"alert":{"title":"Test","body":"Simple test push"},"sound":"default"}}"""
            
            val response = simpleApnsService.sendSimplePush(deviceIdentifier, payload)
            
            ResponseEntity.ok(mapOf(
                "statusCode" to response.statusCode.value(),
                "responseBody" to response.body,
                "success" to response.statusCode.is2xxSuccessful
            ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Failed to send simple push: ${e.message}"))
        }
    }
}
