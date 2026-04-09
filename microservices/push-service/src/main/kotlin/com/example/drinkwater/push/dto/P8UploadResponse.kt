package com.example.drinkwater.push.dto

data class P8UploadResponse(
    val success: Boolean,
    val message: String,
    val keyId: String? = null,
    val teamId: String? = null,
    val bundleId: String? = null,
)
