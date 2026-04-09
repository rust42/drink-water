package com.example.drinkwater.push.dto

data class DynamicPushRequest(
    val p8KeyId: String,
    val teamId: String,
    val bundleId: String,
    val deviceTokens: List<String>,
    val notification: PushNotificationRequest,
    val isProduction: Boolean = false,
)

data class DynamicPushResponse(
    val success: Boolean,
    val message: String,
    val results: List<PushResult>? = null,
)

data class PushResult(
    val deviceToken: String,
    val success: Boolean,
    val message: String,
    val statusCode: Int? = null,
)
