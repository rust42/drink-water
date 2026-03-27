package com.example.drinkwater.push.service

data class PushNotificationResult(
    val deviceIdentifier: String,
    val success: Boolean,
    val message: String,
    val statusCode: Int? = null,
)
