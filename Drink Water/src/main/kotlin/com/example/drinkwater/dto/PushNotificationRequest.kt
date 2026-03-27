package com.example.drinkwater.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class PushNotificationRequest(
    @field:NotBlank(message = "Title is required")
    @field:Size(max = 100, message = "Title must not exceed 100 characters")
    val title: String,
    
    @field:Size(max = 200, message = "Subtitle must not exceed 200 characters")
    val subtitle: String? = null,
    
    @field:NotBlank(message = "Body is required")
    @field:Size(max = 500, message = "Body must not exceed 500 characters")
    val body: String,
    
    @field:Size(max = 50, message = "Thread ID must not exceed 50 characters")
    val threadId: String? = null,
    
    val sound: String = "default",
    
    @field:Size(max = 50, message = "Category must not exceed 50 characters")
    val category: String? = null,
    
    val customData: Map<String, Any>? = null
)
