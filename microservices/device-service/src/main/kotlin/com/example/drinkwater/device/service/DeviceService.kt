package com.example.drinkwater.device.service

import com.example.drinkwater.device.repository.DeviceRepository
import com.example.drinkwater.dto.DeviceRegistrationRequest
import com.example.drinkwater.dto.DeviceRegistrationResponse
import com.example.drinkwater.entity.Device
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class DeviceService(private val deviceRepository: DeviceRepository) {
    fun registerDevice(request: DeviceRegistrationRequest): DeviceRegistrationResponse {
        if (deviceRepository.existsByDeviceIdentifier(request.deviceIdentifier)) {
            throw ResponseStatusException(
                HttpStatus.CONFLICT,
                "Device with identifier ${request.deviceIdentifier} already exists",
            )
        }

        val device =
            Device(
                deviceIdentifier = request.deviceIdentifier,
                pushToken = request.pushToken,
                storeId = request.storeId,
                deviceName = request.deviceName,
                platform = request.platform,
                osVersion = request.osVersion,
                appVersion = request.appVersion,
            )

        val savedDevice = deviceRepository.save(device)

        return DeviceRegistrationResponse(
            id = savedDevice.id!!,
            deviceIdentifier = savedDevice.deviceIdentifier,
            pushToken = savedDevice.pushToken,
            storeId = savedDevice.storeId,
            deviceName = savedDevice.deviceName,
            platform = savedDevice.platform,
            osVersion = savedDevice.osVersion,
            appVersion = savedDevice.appVersion,
            createdAt = savedDevice.createdAt,
            updatedAt = savedDevice.updatedAt,
            isActive = savedDevice.isActive,
            message = "Push device registered successfully",
        )
    }

    fun getDevice(deviceIdentifier: String): Device {
        return deviceRepository.findByDeviceIdentifierAndIsActive(deviceIdentifier, true)
            .orElseThrow { IllegalArgumentException("Device not found: $deviceIdentifier") }
    }

    fun getDevicesByStore(storeId: String): List<Device> {
        return deviceRepository.findByStoreIdAndIsActive(storeId, true)
    }

    fun deactivateDevice(deviceIdentifier: String) {
        val device =
            deviceRepository.findByDeviceIdentifier(deviceIdentifier)
                .orElseThrow { IllegalArgumentException("Device not found: $deviceIdentifier") }
        device.isActive = false
        deviceRepository.save(device)
    }

    fun getDeviceByDeviceIdentifier(deviceIdentifier: String): DeviceRegistrationResponse {
        val device =
            deviceRepository.findByDeviceIdentifierAndIsActive(deviceIdentifier, true)
                .orElseThrow {
                    ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Device with identifier $deviceIdentifier not found",
                    )
                }

        return DeviceRegistrationResponse(
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

    fun getDevicesByStoreId(storeId: String): List<DeviceRegistrationResponse> {
        return deviceRepository.findByStoreIdAndIsActive(storeId, true)
            .map { device ->
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
    }

    fun getAllActiveDevices(): List<DeviceRegistrationResponse> {
        return deviceRepository.findAll()
            .filter { it.isActive }
            .map { device ->
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
    }
}
