package com.example.drinkwater.water.service

import com.example.drinkwater.push.dto.PushNotificationRequest
import com.example.drinkwater.water.client.DeviceServiceClient
import com.example.drinkwater.water.client.PushServiceClient
import com.example.drinkwater.water.dto.WaterIntakeRequest
import com.example.drinkwater.water.dto.WaterIntakeResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class WaterService(
    @Autowired(required = false) private val deviceServiceClient: DeviceServiceClient?,
    @Autowired(required = false) private val pushServiceClient: PushServiceClient?,
) {
    private val logger = LoggerFactory.getLogger(WaterService::class.java)
    private val dailyGoal = 2000
    private val intakeRecords = mutableMapOf<String, MutableList<WaterIntakeRecord>>()

    fun recordWaterIntake(request: WaterIntakeRequest): WaterIntakeResponse {
        // Validate device exists via device-service
        if (deviceServiceClient != null) {
            try {
                val deviceResponse = deviceServiceClient.getDevice(request.deviceIdentifier)
                if (!deviceResponse.statusCode.is2xxSuccessful || deviceResponse.body == null) {
                    return WaterIntakeResponse(
                        message = "Device not found or inactive: ${request.deviceIdentifier}",
                    )
                }
                logger.info("Validated device: ${request.deviceIdentifier}")
            } catch (e: Exception) {
                logger.error("Failed to validate device: ${request.deviceIdentifier}", e)
                return WaterIntakeResponse(
                    message = "Failed to validate device: ${e.message}",
                )
            }
        }

        val today = LocalDate.now()
        val records = intakeRecords.getOrPut(request.deviceIdentifier) { mutableListOf() }

        records.add(
            WaterIntakeRecord(
                amount = request.amount,
                timestamp = request.timestamp ?: LocalDateTime.now(),
            ),
        )

        val totalIntake =
            records.filter { it.timestamp.toLocalDate() == today }
                .sumOf { it.amount }

        return WaterIntakeResponse(
            deviceIdentifier = request.deviceIdentifier,
            amount = request.amount,
            totalIntake = totalIntake,
            dailyGoal = dailyGoal,
            timestamp = LocalDateTime.now(),
            message = "Water intake recorded successfully. Total today: $totalIntake ml",
        )
    }

    fun getTodayIntake(deviceIdentifier: String): WaterIntakeResponse {
        val today = LocalDate.now()
        val records = intakeRecords[deviceIdentifier] ?: emptyList()
        val todayIntake = records.filter { it.timestamp.toLocalDate() == today }

        val totalIntake = todayIntake.sumOf { it.amount }

        return WaterIntakeResponse(
            deviceIdentifier = deviceIdentifier,
            totalIntake = totalIntake,
            dailyGoal = dailyGoal,
            message =
                if (totalIntake >= dailyGoal) {
                    "Daily goal achieved! Great job staying hydrated!"
                } else {
                    "Keep drinking! You need ${dailyGoal - totalIntake} ml more to reach your goal."
                },
        )
    }

    fun getDailyGoal(deviceIdentifier: String): Int {
        return dailyGoal
    }

    fun sendHydrationReminder(deviceIdentifier: String): Boolean {
        if (pushServiceClient == null) {
            logger.warn("Push service client not available")
            return false
        }

        return try {
            val notification =
                PushNotificationRequest(
                    title = "Hydration Reminder",
                    body = "Time to drink some water! Stay hydrated!",
                    sound = "default",
                )

            val response = pushServiceClient.sendPushToDevice(deviceIdentifier, notification)
            val success = response.statusCode.is2xxSuccessful && response.body?.success == true

            if (success) {
                logger.info("Hydration reminder sent successfully to device: $deviceIdentifier")
            } else {
                logger.warn("Failed to send hydration reminder to device: $deviceIdentifier")
            }

            success
        } catch (e: Exception) {
            logger.error("Failed to send hydration reminder to device: $deviceIdentifier", e)
            false
        }
    }
}

data class WaterIntakeRecord(
    val amount: Int,
    val timestamp: LocalDateTime,
)
