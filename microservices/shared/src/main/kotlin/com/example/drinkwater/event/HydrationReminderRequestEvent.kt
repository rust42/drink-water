package com.example.drinkwater.event

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import java.time.LocalDateTime

/**
 * Event published to request a hydration reminder notification
 */
data class HydrationReminderRequestEvent @JsonCreator constructor(
    @JsonProperty("deviceIdentifier") val deviceIdentifier: String,
    @JsonProperty("title") val title: String = "Hydration Alert",
    @JsonProperty("subtitle") val subtitle: String = "Drink more water today",
    @JsonProperty("body") val body: String = "Drink more water to get hydrate and quench your thirst",
    @JsonProperty("requestedAt") val requestedAt: LocalDateTime = LocalDateTime.now()
)
