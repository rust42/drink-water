package com.example.drinkwater.push

import com.example.drinkwater.push.dto.BulkPushNotificationRequest
import com.example.drinkwater.push.dto.DynamicPushRequest
import com.example.drinkwater.push.dto.DynamicPushResponse
import com.example.drinkwater.push.dto.P8UploadResponse
import com.example.drinkwater.push.dto.PushNotificationRequest
import com.example.drinkwater.push.service.DynamicPushService
import com.example.drinkwater.push.service.PushNotificationService
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.concurrent.ConcurrentHashMap

@RestController
@RequestMapping("/api/push-notifications")
class PushNotificationController(
    private val pushNotificationService: PushNotificationService,
    private val dynamicPushService: DynamicPushService? = null,
) {
    private val logger = LoggerFactory.getLogger(PushNotificationController::class.java)
    
    // Temporary storage for uploaded p8 keys (key = "teamId:keyId", value = p8 content)
    private val p8KeyStorage = ConcurrentHashMap<String, String>()

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

    @PostMapping("/upload-p8")
    fun uploadP8File(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("keyId") keyId: String,
        @RequestParam("teamId") teamId: String,
        @RequestParam("bundleId") bundleId: String,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<P8UploadResponse> {
        logger.info("[API REQUEST] POST ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.info("[UPLOAD P8] keyId=$keyId, teamId=$teamId, bundleId=$bundleId, filename=${file.originalFilename}")

        return try {
            // Validate file
            if (file.isEmpty) {
                logger.warn("[UPLOAD P8 ERROR] Empty file uploaded")
                return ResponseEntity.badRequest()
                    .body(P8UploadResponse(success = false, message = "File is empty"))
            }

            if (!file.originalFilename?.endsWith(".p8", ignoreCase = true)!!) {
                logger.warn("[UPLOAD P8 ERROR] Invalid file type: ${file.originalFilename}")
                return ResponseEntity.badRequest()
                    .body(P8UploadResponse(success = false, message = "File must be a .p8 file"))
            }

            // Read file content
            val p8Content = file.inputStream.bufferedReader().use { it.readText() }

            // Validate p8 content format
            if (!p8Content.contains("BEGIN PRIVATE KEY") || !p8Content.contains("END PRIVATE KEY")) {
                logger.warn("[UPLOAD P8 ERROR] Invalid p8 key format")
                return ResponseEntity.badRequest()
                    .body(P8UploadResponse(success = false, message = "Invalid p8 key format"))
            }

            // Store the p8 content
            val storageKey = "$teamId:$keyId"
            p8KeyStorage[storageKey] = p8Content

            logger.info("[UPLOAD P8 SUCCESS] P8 key stored successfully for $storageKey")

            ResponseEntity.ok(
                P8UploadResponse(
                    success = true,
                    message = "P8 key uploaded successfully",
                    keyId = keyId,
                    teamId = teamId,
                    bundleId = bundleId,
                ),
            )
        } catch (e: Exception) {
            logger.error("[UPLOAD P8 ERROR] Failed to upload p8 file", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(P8UploadResponse(success = false, message = "Failed to upload: ${e.message}"))
        }
    }

    @PostMapping("/send-dynamic")
    fun sendDynamicPush(
        @Valid @RequestBody request: DynamicPushRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<DynamicPushResponse> {
        logger.info("[API REQUEST] POST ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.info("[SEND DYNAMIC] keyId=${request.p8KeyId}, teamId=${request.teamId}, bundleId=${request.bundleId}, deviceCount=${request.deviceTokens.size}")

        if (dynamicPushService == null) {
            logger.error("[SEND DYNAMIC ERROR] Dynamic push service not available")
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(DynamicPushResponse(success = false, message = "Dynamic push service not available"))
        }

        return try {
            // Retrieve the stored p8 key
            val storageKey = "${request.teamId}:${request.p8KeyId}"
            val p8Content = p8KeyStorage[storageKey]

            if (p8Content == null) {
                logger.warn("[SEND DYNAMIC ERROR] P8 key not found for $storageKey")
                return ResponseEntity.badRequest()
                    .body(DynamicPushResponse(success = false, message = "P8 key not found. Please upload the p8 file first."))
            }

            // Send the dynamic push notification
            val result = dynamicPushService.sendDynamicPush(p8Content, request)

            logger.info("[SEND DYNAMIC RESULT] success=${result.success}, message=${result.message}")

            ResponseEntity.status(if (result.success) HttpStatus.OK else HttpStatus.BAD_REQUEST)
                .body(result)
        } catch (e: Exception) {
            logger.error("[SEND DYNAMIC ERROR] Failed to send dynamic push", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(DynamicPushResponse(success = false, message = "Internal server error: ${e.message}"))
        }
    }
}
