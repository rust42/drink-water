package com.example.drinkwater.water

import com.example.drinkwater.water.dto.WaterIntakeRequest
import com.example.drinkwater.water.dto.WaterIntakeResponse
import com.example.drinkwater.water.service.WaterService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/water")
class WaterController(
    private val waterService: WaterService,
) {
    @PostMapping("/intake")
    fun recordWaterIntake(
        @Valid @RequestBody request: WaterIntakeRequest,
    ): ResponseEntity<WaterIntakeResponse> {
        return try {
            val response = waterService.recordWaterIntake(request)
            ResponseEntity.status(HttpStatus.CREATED).body(response)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(WaterIntakeResponse(message = "Failed to record water intake: ${e.message}"))
        }
    }

    @GetMapping("/intake/{deviceIdentifier}/today")
    fun getTodayIntake(
        @PathVariable deviceIdentifier: String,
    ): ResponseEntity<WaterIntakeResponse> {
        return try {
            val response = waterService.getTodayIntake(deviceIdentifier)
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(WaterIntakeResponse(message = "Failed to get today's intake: ${e.message}"))
        }
    }

    @GetMapping("/intake/{deviceIdentifier}/goal")
    fun getDailyGoal(
        @PathVariable deviceIdentifier: String,
    ): ResponseEntity<Map<String, Any>> {
        return try {
            val goal = waterService.getDailyGoal(deviceIdentifier)
            ResponseEntity.ok(
                mapOf(
                    "deviceIdentifier" to deviceIdentifier,
                    "dailyGoal" to goal,
                    "unit" to "ml",
                ),
            )
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Failed to get daily goal: ${e.message}"))
        }
    }

    @PostMapping("/reminder/{deviceIdentifier}")
    fun sendHydrationReminder(
        @PathVariable deviceIdentifier: String,
    ): ResponseEntity<Map<String, Any>> {
        return try {
            val result = waterService.sendHydrationReminder(deviceIdentifier)
            ResponseEntity.ok(
                mapOf(
                    "deviceIdentifier" to deviceIdentifier,
                    "reminderSent" to result,
                    "timestamp" to System.currentTimeMillis(),
                ),
            )
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("error" to "Failed to send reminder: ${e.message}"))
        }
    }
}
