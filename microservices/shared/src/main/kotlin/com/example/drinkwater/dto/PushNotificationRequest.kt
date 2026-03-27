package com.example.drinkwater.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class PushNotificationRequest(
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 100, message = "Title must be less than 100 characters")
    val title: String,
    @field:Size(max = 200, message = "Subtitle must be less than 200 characters")
    val subtitle: String? = null,
    @field:NotBlank(message = "Body is required")
    @field:Size(max = 500, message = "Body must be less than 500 characters")
    val body: String,
    val threadId: String? = null,
    val sound: String = "default",
    val category: String? = null,
    val customData: Map<String, Any>? = null,
)
