package com.example.drinkwater.water.dto

import java.time.LocalDateTime

data class WaterIntakeRequest(
    val deviceIdentifier: String,
    val amount: Int,
    val timestamp: LocalDateTime? = null,
)

data class WaterIntakeResponse(
    val deviceIdentifier: String? = null,
    val amount: Int? = null,
    val totalIntake: Int? = null,
    val dailyGoal: Int? = null,
    val timestamp: LocalDateTime? = null,
    val message: String,
)
