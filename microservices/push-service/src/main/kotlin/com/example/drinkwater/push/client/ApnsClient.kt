package com.example.drinkwater.push.client

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.cloud.openfeign.FeignClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader

@ConditionalOnProperty(name = ["push.apns.token.enabled"], havingValue = "false", matchIfMissing = true)
@FeignClient(
    name = "apnsClient",
    url = "\${push.apns.sandbox.url:https://api.sandbox.push.apple.com/3/device}",
    configuration = [ApnsClientConfiguration::class],
)
interface ApnsClient {
    @PostMapping("/{deviceToken}")
    fun sendPushNotification(
        @PathVariable deviceToken: String,
        @RequestBody payload: String,
        @RequestHeader("apns-topic") apnsTopic: String,
        @RequestHeader("apns-push-type") apnsPushType: String,
    ): ResponseEntity<String>
}
