package com.example.drinkwater.device

import com.example.drinkwater.device.service.DeviceEventProducer
import com.example.drinkwater.device.service.DeviceService
import com.example.drinkwater.dto.DeviceRegistrationRequest
import com.example.drinkwater.dto.DeviceRegistrationResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/devices")
class DeviceController(
    private val deviceService: DeviceService,
    private val deviceEventProducer: DeviceEventProducer
) {
    @PostMapping("/register")
    fun registerDevice(
        @Valid @RequestBody request: DeviceRegistrationRequest,
    ): ResponseEntity<Any> {
        return try {
            val response = deviceService.registerDevice(request)
            // Publish event to Kafka for async processing
            deviceEventProducer.publishDeviceRegisteredEvent(response)
            ResponseEntity.status(HttpStatus.CREATED).body(response)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(mapOf("error" to "Failed to register device: ${e.message}"))
        }
    }

    @GetMapping("/{deviceIdentifier}")
    fun getDevice(
        @PathVariable deviceIdentifier: String,
    ): ResponseEntity<DeviceRegistrationResponse> {
        return try {
            val device = deviceService.getDevice(deviceIdentifier)
            val response =
                DeviceRegistrationResponse(
                    id = device.id!!,
                    deviceIdentifier = device.deviceIdentifier,
                    pushToken = device.pushToken,
                    storeId = device.storeId,
                    deviceName = device.deviceName,
                    platform = device.platform,
                    osVersion = device.osVersion,
                    appVersion = device.appVersion,
                    createdAt = device.createdAt,
                    updatedAt = device.updatedAt,
                    isActive = device.isActive,
                    message = "Device found",
                )
            ResponseEntity.ok(response)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
    }

    @GetMapping("/store/{storeId}")
    fun getDevicesByStore(
        @PathVariable storeId: String,
    ): ResponseEntity<List<DeviceRegistrationResponse>> {
        val devices = deviceService.getDevicesByStore(storeId)
        val responses =
            devices.map { device ->
                DeviceRegistrationResponse(
                    id = device.id!!,
                    deviceIdentifier = device.deviceIdentifier,
                    pushToken = device.pushToken,
                    storeId = device.storeId,
                    deviceName = device.deviceName,
                    platform = device.platform,
                    osVersion = device.osVersion,
                    appVersion = device.appVersion,
                    createdAt = device.createdAt,
                    updatedAt = device.updatedAt,
                    isActive = device.isActive,
                    message = "Device found",
                )
            }
        return ResponseEntity.ok(responses)
    }

    @PutMapping("/{deviceIdentifier}/deactivate")
    fun deactivateDevice(
        @PathVariable deviceIdentifier: String,
    ): ResponseEntity<Void> {
        deviceService.deactivateDevice(deviceIdentifier)
        return ResponseEntity.ok().build()
    }
}
