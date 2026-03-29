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
        logger.info("[SERVICE] recordWaterIntake called with deviceIdentifier=${request.deviceIdentifier}, amount=${request.amount}")
        logger.debug("[SERVICE REQUEST BODY] deviceIdentifier=${request.deviceIdentifier}, amount=${request.amount}, timestamp=${request.timestamp}")
        
        // Validate device exists via device-service
        if (deviceServiceClient != null) {
            try {
                logger.info("[FEIGN CLIENT] Calling device-service to validate device: ${request.deviceIdentifier}")
                val deviceResponse = deviceServiceClient.getDevice(request.deviceIdentifier)
                logger.info("[FEIGN CLIENT] Device service response: status=${deviceResponse.statusCode}")
                
                if (!deviceResponse.statusCode.is2xxSuccessful || deviceResponse.body == null) {
                    logger.warn("[FEIGN CLIENT ERROR] Device not found or inactive: ${request.deviceIdentifier}")
                    return WaterIntakeResponse(
                        message = "Device not found or inactive: ${request.deviceIdentifier}",
                    )
                }
                logger.info("[FEIGN CLIENT] Device validated successfully: ${request.deviceIdentifier}")
            } catch (e: Exception) {
                logger.error("[FEIGN CLIENT ERROR] Failed to validate device: ${request.deviceIdentifier}", e)
                return WaterIntakeResponse(
                    message = "Failed to validate device: ${e.message}",
                )
            }
        } else {
            logger.warn("[SERVICE WARNING] Device service client not available, skipping device validation")
        }

        val today = LocalDate.now()
        val records = intakeRecords.getOrPut(request.deviceIdentifier) { mutableListOf() }

        records.add(
            WaterIntakeRecord(
                amount = request.amount,
                timestamp = request.timestamp ?: LocalDateTime.now(),
            ),
        )
        logger.debug("[SERVICE] Added water intake record for device=${request.deviceIdentifier}: amount=${request.amount}, timestamp=${request.timestamp ?: LocalDateTime.now()}")

        val totalIntake =
            records.filter { it.timestamp.toLocalDate() == today }
                .sumOf { it.amount }

        logger.info("[SERVICE RESPONSE] Water intake recorded for device=${request.deviceIdentifier}: amount=${request.amount}, totalIntake=$totalIntake, dailyGoal=$dailyGoal")
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
        logger.info("[SERVICE] getTodayIntake called with deviceIdentifier=$deviceIdentifier")
        
        val today = LocalDate.now()
        val records = intakeRecords[deviceIdentifier] ?: emptyList()
        val todayIntake = records.filter { it.timestamp.toLocalDate() == today }

        val totalIntake = todayIntake.sumOf { it.amount }

        logger.info("[SERVICE RESPONSE] Today's intake for device=$deviceIdentifier: totalIntake=$totalIntake, dailyGoal=$dailyGoal, recordsCount=${todayIntake.size}")
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
        logger.info("[SERVICE] getDailyGoal called with deviceIdentifier=$deviceIdentifier")
        logger.info("[SERVICE RESPONSE] Daily goal for device=$deviceIdentifier: dailyGoal=$dailyGoal")
        return dailyGoal
    }

    fun sendHydrationReminder(deviceIdentifier: String): Boolean {
        logger.info("[SERVICE] sendHydrationReminder called with deviceIdentifier=$deviceIdentifier")
        
        if (pushServiceClient == null) {
            logger.warn("[SERVICE ERROR] Push service client not available")
            return false
        }

        return try {
            val notification =
                PushNotificationRequest(
                    title = "Hydration Reminder",
                    body = "Time to drink some water! Stay hydrated!",
                    sound = "default",
                )
            
            logger.debug("[NOTIFICATION] Sending hydration reminder: title=${notification.title}, body=${notification.body}")

            logger.info("[FEIGN CLIENT] Calling push-service to send reminder to device: $deviceIdentifier")
            val response = pushServiceClient.sendPushToDevice(deviceIdentifier, notification)
            val success = response.statusCode.is2xxSuccessful && response.body?.success == true

            logger.info("[FEIGN CLIENT] Push service response: status=${response.statusCode}, body=${response.body}")
            
            if (success) {
                logger.info("[SERVICE RESPONSE] Hydration reminder sent successfully to device: $deviceIdentifier")
            } else {
                logger.warn("[SERVICE RESPONSE] Failed to send hydration reminder to device: $deviceIdentifier")
            }

            success
        } catch (e: Exception) {
            logger.error("[FEIGN CLIENT ERROR] Failed to send hydration reminder to device: $deviceIdentifier", e)
            false
        }
    }
}

data class WaterIntakeRecord(
    val amount: Int,
    val timestamp: LocalDateTime,
)
