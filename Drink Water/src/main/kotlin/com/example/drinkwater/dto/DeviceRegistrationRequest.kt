package com.example.drinkwater.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class DeviceRegistrationRequest(
    @field:NotBlank(message = "Device identifier is required")
    @field:Size(min = 3, max = 100, message = "Device identifier must be between 3 and 100 characters")
    val deviceIdentifier: String,
    
    @field:NotBlank(message = "Push token is required")
    @field:Size(min = 10, max = 500, message = "Push token must be between 10 and 500 characters")
    val pushToken: String,
    
    @field:NotBlank(message = "Store ID is required")
    @field:Size(min = 1, max = 50, message = "Store ID must be between 1 and 50 characters")
    val storeId: String,
    
    @field:Size(max = 100, message = "Device name must not exceed 100 characters")
    val deviceName: String? = null,
    
    @field:Size(max = 50, message = "Platform must not exceed 50 characters")
    val platform: String? = null,
    
    @field:Size(max = 50, message = "OS version must not exceed 50 characters")
    val osVersion: String? = null,
    
    @field:Size(max = 20, message = "App version must not exceed 20 characters")
    val appVersion: String? = null
)
