package com.example.drinkwater.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class DeviceRegistrationRequest(
    @field:NotBlank(message = "Device identifier is required")
    @field:Size(max = 100, message = "Device identifier must be less than 100 characters")
    val deviceIdentifier: String,
    @field:NotBlank(message = "Push token is required")
    val pushToken: String,
    @field:NotBlank(message = "Store ID is required")
    val storeId: String,
    @field:Size(max = 100, message = "Device name must be less than 100 characters")
    val deviceName: String? = null,
    val platform: String? = null,
    val osVersion: String? = null,
    val appVersion: String? = null,
)
