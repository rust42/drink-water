package com.example.drinkwater.event

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import java.time.LocalDateTime

/**
 * Event published when a new device is registered
 */
data class DeviceRegisteredEvent @JsonCreator constructor(
    @JsonProperty("deviceIdentifier") val deviceIdentifier: String,
    @JsonProperty("pushToken") val pushToken: String,
    @JsonProperty("storeId") val storeId: String,
    @JsonProperty("deviceName") val deviceName: String,
    @JsonProperty("platform") val platform: String,
    @JsonProperty("osVersion") val osVersion: String,
    @JsonProperty("appVersion") val appVersion: String,
    @JsonProperty("registeredAt") val registeredAt: LocalDateTime = LocalDateTime.now()
)
