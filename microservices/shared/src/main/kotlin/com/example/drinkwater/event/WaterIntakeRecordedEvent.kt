package com.example.drinkwater.event

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import java.time.LocalDateTime

/**
 * Event published when a water intake is recorded
 */
data class WaterIntakeRecordedEvent @JsonCreator constructor(
    @JsonProperty("deviceIdentifier") val deviceIdentifier: String,
    @JsonProperty("amount") val amount: Int,
    @JsonProperty("totalIntake") val totalIntake: Int,
    @JsonProperty("dailyGoal") val dailyGoal: Int,
    @JsonProperty("timestamp") val timestamp: LocalDateTime = LocalDateTime.now()
)
