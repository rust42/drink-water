package com.example.drinkwater.water

import com.example.drinkwater.water.dto.WaterIntakeRequest
import com.example.drinkwater.water.dto.WaterIntakeResponse
import com.example.drinkwater.water.service.WaterEventProducer
import com.example.drinkwater.water.service.WaterService
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/water")
class WaterController(
    private val waterService: WaterService,
    private val waterEventProducer: WaterEventProducer
) {
    private val logger = LoggerFactory.getLogger(WaterController::class.java)

    @PostMapping("/intake")
    fun recordWaterIntake(
        @Valid @RequestBody request: WaterIntakeRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<WaterIntakeResponse> {
        logger.info("[API REQUEST] POST ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[REQUEST BODY] WaterIntakeRequest: deviceIdentifier=${request.deviceIdentifier}, amount=${request.amount}, timestamp=${request.timestamp}")
        
        return try {
            val response = waterService.recordWaterIntake(request)
            logger.info("[API RESPONSE] Water intake recorded: deviceIdentifier=${response.deviceIdentifier}, amount=${response.amount}, totalIntake=${response.totalIntake}")
            
            // Publish event to Kafka for async processing
            waterEventProducer.publishWaterIntakeRecordedEvent(request.deviceIdentifier, response)
            ResponseEntity.status(HttpStatus.CREATED).body(response)
        } catch (e: Exception) {
            logger.error("[API ERROR] Failed to record water intake: ${e.message}", e)
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(WaterIntakeResponse(message = "Failed to record water intake: ${e.message}"))
        }
    }

    @GetMapping("/intake/{deviceIdentifier}/today")
    fun getTodayIntake(
        @PathVariable deviceIdentifier: String,
        httpRequest: HttpServletRequest
    ): ResponseEntity<WaterIntakeResponse> {
        logger.info("[API REQUEST] GET ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[PATH VARIABLE] deviceIdentifier=$deviceIdentifier")
        
        return try {
            val response = waterService.getTodayIntake(deviceIdentifier)
            logger.info("[API RESPONSE] Today's intake for device=$deviceIdentifier: totalIntake=${response.totalIntake}, dailyGoal=${response.dailyGoal}")
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            logger.error("[API ERROR] Failed to get today's intake: ${e.message}", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(WaterIntakeResponse(message = "Failed to get today's intake: ${e.message}"))
        }
    }

    @GetMapping("/intake/{deviceIdentifier}/goal")
    fun getDailyGoal(
        @PathVariable deviceIdentifier: String,
        httpRequest: HttpServletRequest
    ): ResponseEntity<Map<String, Any>> {
        logger.info("[API REQUEST] GET ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[PATH VARIABLE] deviceIdentifier=$deviceIdentifier")
        
        return try {
            val goal = waterService.getDailyGoal(deviceIdentifier)
            logger.info("[API RESPONSE] Daily goal for device=$deviceIdentifier: dailyGoal=$goal")
            ResponseEntity.ok(
                mapOf(
                    "deviceIdentifier" to deviceIdentifier,
                    "dailyGoal" to goal,
                    "unit" to "ml",
                ),
            )
        } catch (e: Exception) {
            logger.error("[API ERROR] Failed to get daily goal: ${e.message}", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Failed to get daily goal: ${e.message}"))
        }
    }

    @PostMapping("/reminder/{deviceIdentifier}")
    fun sendHydrationReminder(
        @PathVariable deviceIdentifier: String,
        httpRequest: HttpServletRequest
    ): ResponseEntity<Map<String, Any>> {
        logger.info("[API REQUEST] POST ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[PATH VARIABLE] deviceIdentifier=$deviceIdentifier")
        
        return try {
            // Publish event to Kafka instead of direct call
            waterEventProducer.publishHydrationReminderRequest(deviceIdentifier)
            logger.info("[API RESPONSE] Hydration reminder queued for device: $deviceIdentifier")
            ResponseEntity.ok(
                mapOf(
                    "deviceIdentifier" to deviceIdentifier,
                    "reminderQueued" to true,
                    "message" to "Hydration reminder request queued for processing",
                    "timestamp" to System.currentTimeMillis(),
                ),
            )
        } catch (e: Exception) {
            logger.error("[API ERROR] Failed to queue reminder: ${e.message}", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Failed to queue reminder: ${e.message}"))
        }
    }
}
