package com.example.drinkwater.push

import com.example.drinkwater.push.dto.BulkPushNotificationRequest
import com.example.drinkwater.push.dto.PushNotificationRequest
import com.example.drinkwater.push.service.PushNotificationService
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/push-notifications")
class PushNotificationController(
    private val pushNotificationService: PushNotificationService,
) {
    private val logger = LoggerFactory.getLogger(PushNotificationController::class.java)

    @PostMapping("/send/{deviceIdentifier}")
    fun sendPushToDevice(
        @PathVariable deviceIdentifier: String,
        @Valid @RequestBody notification: PushNotificationRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<Any> {
        logger.info("[API REQUEST] POST ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[PATH VARIABLE] deviceIdentifier=$deviceIdentifier")
        logger.debug("[REQUEST BODY] PushNotificationRequest: title=${notification.title}, body=${notification.body}, sound=${notification.sound}, category=${notification.category}")
        
        return try {
            val result = pushNotificationService.sendPushToDevice(deviceIdentifier, notification)
            logger.info("[API RESPONSE] Push notification result: success=${result.success}, message=${result.message}")
            ResponseEntity.status(
                if (result.success) HttpStatus.OK else HttpStatus.BAD_REQUEST,
            ).body(result)
        } catch (e: IllegalArgumentException) {
            logger.warn("[API ERROR] Device not found: ${e.message}")
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(mapOf("error" to e.message))
        } catch (e: Exception) {
            logger.error("[API ERROR] Internal server error: ${e.message}", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Internal server error: ${e.message}"))
        }
    }

    @PostMapping("/send/store/{storeId}")
    fun sendPushToStore(
        @PathVariable storeId: String,
        @Valid @RequestBody notification: PushNotificationRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<List<Any>> {
        logger.info("[API REQUEST] POST ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[PATH VARIABLE] storeId=$storeId")
        logger.debug("[REQUEST BODY] PushNotificationRequest: title=${notification.title}, body=${notification.body}")
        
        return try {
            val results = pushNotificationService.sendPushToStore(storeId, notification)
            val successCount = results.count { it.success }
            logger.info("[API RESPONSE] Push to store completed: ${successCount}/${results.size} successful")
            ResponseEntity.ok(results)
        } catch (e: Exception) {
            logger.error("[API ERROR] Internal server error: ${e.message}", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(listOf(mapOf("error" to "Internal server error: ${e.message}")))
        }
    }

    @PostMapping("/send/bulk")
    fun sendBulkPush(
        @Valid @RequestBody request: BulkPushNotificationRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<List<Any>> {
        logger.info("[API REQUEST] POST ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[REQUEST BODY] BulkPushNotificationRequest: targets count=${request.targets.size}, notification title=${request.notification.title}")
        
        return try {
            val results = pushNotificationService.sendBulkPush(request.targets, request.notification)
            val successCount = results.count { it.success }
            logger.info("[API RESPONSE] Bulk push completed: ${successCount}/${results.size} successful")
            ResponseEntity.ok(results)
        } catch (e: Exception) {
            logger.error("[API ERROR] Internal server error: ${e.message}", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(listOf(mapOf("error" to "Internal server error: ${e.message}")))
        }
    }

    @PostMapping("/send/hydration-reminder/{deviceIdentifier}")
    fun sendHydrationReminder(
        @PathVariable deviceIdentifier: String,
        httpRequest: HttpServletRequest
    ): ResponseEntity<Any> {
        logger.info("[API REQUEST] POST ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[PATH VARIABLE] deviceIdentifier=$deviceIdentifier")
        
        val notification =
            PushNotificationRequest(
                title = "Hydration Alert",
                subtitle = "Drink more water today",
                body = "Drink more water to get hydrate and quench your thirst",
                threadId = "1234",
                sound = "default",
                category = "DAILY_SUMMARY",
            )
        
        logger.debug("[NOTIFICATION] Pre-built hydration reminder: title=${notification.title}, body=${notification.body}")

        return try {
            val result = pushNotificationService.sendPushToDevice(deviceIdentifier, notification)
            logger.info("[API RESPONSE] Hydration reminder result: success=${result.success}, message=${result.message}")
            ResponseEntity.status(
                if (result.success) HttpStatus.OK else HttpStatus.BAD_REQUEST,
            ).body(result)
        } catch (e: IllegalArgumentException) {
            logger.warn("[API ERROR] Device not found: ${e.message}")
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(mapOf("error" to e.message))
        } catch (e: Exception) {
            logger.error("[API ERROR] Internal server error: ${e.message}", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Internal server error: ${e.message}"))
        }
    }
}
