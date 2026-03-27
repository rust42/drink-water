package com.example.drinkwater.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class WaterIntakeRequest(
    @field:NotBlank(message = "Device identifier is required")
    val deviceIdentifier: String,
    // Amount in milliliters
    @field:Min(value = 1, message = "Amount must be at least 1ml")
    @field:Max(value = 1000, message = "Amount must be less than 1000ml")
    val amount: Int,
    val unit: String = "ml",
    // Optional timestamp
    val timestamp: Long? = null,
    val notes: String? = null,
)

data class WaterIntakeResponse(
    val id: Long? = null,
    val deviceIdentifier: String? = null,
    val amount: Int? = null,
    val unit: String? = null,
    val timestamp: Long? = null,
    val notes: String? = null,
    val createdAt: String? = null,
    val message: String? = null,
    // total intake for today in ml
    val todayTotal: Int? = null,
    // daily goal in ml
    val dailyGoal: Int? = null,
    // percentage of daily goal achieved
    val goalProgress: Double? = null,
)
