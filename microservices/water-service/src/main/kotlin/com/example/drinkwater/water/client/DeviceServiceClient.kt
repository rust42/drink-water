package com.example.drinkwater.water.client

import com.example.drinkwater.dto.DeviceRegistrationResponse
import org.springframework.cloud.openfeign.FeignClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable

@FeignClient(
    name = "deviceServiceClient",
    url = "\${device.service.url:http://localhost:8081}",
)
interface DeviceServiceClient {
    @GetMapping("/api/devices/{deviceIdentifier}")
    fun getDevice(
        @PathVariable deviceIdentifier: String,
    ): ResponseEntity<DeviceRegistrationResponse>

    @GetMapping("/api/devices/store/{storeId}")
    fun getDevicesByStore(
        @PathVariable storeId: String,
    ): ResponseEntity<List<DeviceRegistrationResponse>>
}
