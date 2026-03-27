package com.example.drinkwater.water.client

import com.example.drinkwater.push.dto.PushNotificationRequest
import com.example.drinkwater.push.service.PushNotificationResult
import org.springframework.cloud.openfeign.FeignClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody

@FeignClient(
    name = "pushServiceClient",
    url = "\${push.service.url:http://localhost:8082}",
)
interface PushServiceClient {
    @PostMapping("/api/push/device/{deviceIdentifier}")
    fun sendPushToDevice(
        @PathVariable deviceIdentifier: String,
        @RequestBody notification: PushNotificationRequest,
    ): ResponseEntity<PushNotificationResult>

    @PostMapping("/api/push/store/{storeId}")
    fun sendPushToStore(
        @PathVariable storeId: String,
        @RequestBody notification: PushNotificationRequest,
    ): ResponseEntity<List<PushNotificationResult>>
}
