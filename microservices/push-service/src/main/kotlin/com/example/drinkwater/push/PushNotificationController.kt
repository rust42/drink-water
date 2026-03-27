package com.example.drinkwater.push

import com.example.drinkwater.push.dto.BulkPushNotificationRequest
import com.example.drinkwater.push.dto.PushNotificationRequest
import com.example.drinkwater.push.service.PushNotificationService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/push-notifications")
class PushNotificationController(
    private val pushNotificationService: PushNotificationService,
) {
    @PostMapping("/send/{deviceIdentifier}")
    fun sendPushToDevice(
        @PathVariable deviceIdentifier: String,
        @Valid @RequestBody notification: PushNotificationRequest,
    ): ResponseEntity<Any> {
        return try {
            val result = pushNotificationService.sendPushToDevice(deviceIdentifier, notification)
            ResponseEntity.status(
                if (result.success) HttpStatus.OK else HttpStatus.BAD_REQUEST,
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
        @Valid @RequestBody notification: PushNotificationRequest,
    ): ResponseEntity<List<Any>> {
        return try {
            val results = pushNotificationService.sendPushToStore(storeId, notification)
            ResponseEntity.ok(results)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(listOf(mapOf("error" to "Internal server error: ${e.message}")))
        }
    }

    @PostMapping("/send/bulk")
    fun sendBulkPush(
        @Valid @RequestBody request: BulkPushNotificationRequest,
    ): ResponseEntity<List<Any>> {
        return try {
            val results = pushNotificationService.sendBulkPush(request.targets, request.notification)
            ResponseEntity.ok(results)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(listOf(mapOf("error" to "Internal server error: ${e.message}")))
        }
    }

    @PostMapping("/send/hydration-reminder/{deviceIdentifier}")
    fun sendHydrationReminder(
        @PathVariable deviceIdentifier: String,
    ): ResponseEntity<Any> {
        val notification =
            PushNotificationRequest(
                title = "Hydration Alert",
                subtitle = "Drink more water today",
                body = "Drink more water to get hydrate and quench your thirst",
                threadId = "1234",
                sound = "default",
                category = "DAILY_SUMMARY",
            )

        return try {
            val result = pushNotificationService.sendPushToDevice(deviceIdentifier, notification)
            ResponseEntity.status(
                if (result.success) HttpStatus.OK else HttpStatus.BAD_REQUEST,
            ).body(result)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(mapOf("error" to e.message))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Internal server error: ${e.message}"))
        }
    }
}
