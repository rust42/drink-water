package com.example.drinkwater.controller

import com.example.drinkwater.dto.DeviceRegistrationRequest
import com.example.drinkwater.dto.DeviceRegistrationResponse
import com.example.drinkwater.service.DeviceService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/push-devices")
class DeviceController(private val deviceService: DeviceService) {

    @PostMapping("/register")
    fun registerDevice(@Valid @RequestBody request: DeviceRegistrationRequest): ResponseEntity<DeviceRegistrationResponse> {
        val response = deviceService.registerDevice(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping("/{deviceIdentifier}")
    fun getDevice(@PathVariable deviceIdentifier: String): ResponseEntity<DeviceRegistrationResponse> {
        val response = deviceService.getDeviceByDeviceIdentifier(deviceIdentifier)
        return ResponseEntity.ok(response)
    }

    @GetMapping
    fun getAllDevices(): ResponseEntity<List<DeviceRegistrationResponse>> {
        val devices = deviceService.getAllActiveDevices()
        return ResponseEntity.ok(devices)
    }

    @GetMapping("/store/{storeId}")
    fun getDevicesByStore(@PathVariable storeId: String): ResponseEntity<List<DeviceRegistrationResponse>> {
        val devices = deviceService.getDevicesByStoreId(storeId)
        return ResponseEntity.ok(devices)
    }
}
