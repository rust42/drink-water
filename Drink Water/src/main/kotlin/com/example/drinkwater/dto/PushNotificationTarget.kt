package com.example.drinkwater.dto

import jakarta.validation.constraints.NotBlank

data class PushNotificationTarget(
    @field:NotBlank(message = "Device identifier is required")
    val deviceIdentifier: String,
    
    @field:NotBlank(message = "Store ID is required")
    val storeId: String
)

data class BulkPushNotificationRequest(
    val notification: PushNotificationRequest,
    val targets: List<PushNotificationTarget>
)
