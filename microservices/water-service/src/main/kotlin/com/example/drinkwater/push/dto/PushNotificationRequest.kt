package com.example.drinkwater.push.dto

data class PushNotificationRequest(
    val title: String,
    val body: String,
    val subtitle: String? = null,
    val sound: String = "default",
    val threadId: String? = null,
    val category: String? = null,
    val customData: Map<String, Any>? = null,
)
