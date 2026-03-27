package com.example.drinkwater.dto

import java.time.LocalDateTime

data class DeviceRegistrationResponse(
    val id: Long,
    val deviceIdentifier: String,
    val pushToken: String,
    val storeId: String,
    val deviceName: String?,
    val platform: String?,
    val osVersion: String?,
    val appVersion: String?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val isActive: Boolean,
    val message: String,
)
