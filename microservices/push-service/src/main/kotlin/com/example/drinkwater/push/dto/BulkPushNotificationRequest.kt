package com.example.drinkwater.push.dto

import com.example.drinkwater.dto.PushNotificationTarget

data class BulkPushNotificationRequest(
    val targets: List<PushNotificationTarget>,
    val notification: PushNotificationRequest,
)
