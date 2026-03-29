package com.example.drinkwater.device.service

import com.example.drinkwater.device.repository.DeviceRepository
import com.example.drinkwater.dto.DeviceRegistrationRequest
import com.example.drinkwater.dto.DeviceRegistrationResponse
import com.example.drinkwater.entity.Device
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class DeviceService(private val deviceRepository: DeviceRepository) {
    private val logger = LoggerFactory.getLogger(DeviceService::class.java)

    fun registerDevice(request: DeviceRegistrationRequest): DeviceRegistrationResponse {
        logger.info("[SERVICE] registerDevice called with deviceIdentifier=${request.deviceIdentifier}, storeId=${request.storeId}")
        logger.debug("[SERVICE REQUEST BODY] deviceIdentifier=${request.deviceIdentifier}, pushToken=${request.pushToken.take(10)}..., storeId=${request.storeId}, deviceName=${request.deviceName}, platform=${request.platform}, osVersion=${request.osVersion}, appVersion=${request.appVersion}")
        
        if (deviceRepository.existsByDeviceIdentifier(request.deviceIdentifier)) {
            logger.warn("[SERVICE ERROR] Device with identifier ${request.deviceIdentifier} already exists")
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
        logger.info("[SERVICE RESPONSE] Device saved successfully: id=${savedDevice.id}, deviceIdentifier=${savedDevice.deviceIdentifier}")

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
        logger.info("[SERVICE] getDevice called with deviceIdentifier=$deviceIdentifier")
        return deviceRepository.findByDeviceIdentifierAndIsActive(deviceIdentifier, true)
            .orElseThrow { 
                logger.warn("[SERVICE ERROR] Device not found: $deviceIdentifier")
                IllegalArgumentException("Device not found: $deviceIdentifier") 
            }
    }

    fun getDevicesByStore(storeId: String): List<Device> {
        logger.info("[SERVICE] getDevicesByStore called with storeId=$storeId")
        val devices = deviceRepository.findByStoreIdAndIsActive(storeId, true)
        logger.info("[SERVICE RESPONSE] Found ${devices.size} devices for storeId=$storeId")
        return devices
    }

    fun deactivateDevice(deviceIdentifier: String) {
        logger.info("[SERVICE] deactivateDevice called with deviceIdentifier=$deviceIdentifier")
        val device =
            deviceRepository.findByDeviceIdentifier(deviceIdentifier)
                .orElseThrow { 
                    logger.warn("[SERVICE ERROR] Device not found for deactivation: $deviceIdentifier")
                    IllegalArgumentException("Device not found: $deviceIdentifier") 
                }
        device.isActive = false
        deviceRepository.save(device)
        logger.info("[SERVICE RESPONSE] Device deactivated successfully: deviceIdentifier=$deviceIdentifier")
    }

    fun getDeviceByDeviceIdentifier(deviceIdentifier: String): DeviceRegistrationResponse {
        logger.info("[SERVICE] getDeviceByDeviceIdentifier called with deviceIdentifier=$deviceIdentifier")
        val device =
            deviceRepository.findByDeviceIdentifierAndIsActive(deviceIdentifier, true)
                .orElseThrow {
                    logger.warn("[SERVICE ERROR] Device not found: $deviceIdentifier")
                    ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Device with identifier $deviceIdentifier not found",
                    )
                }

        logger.info("[SERVICE RESPONSE] Device found: id=${device.id}, deviceIdentifier=${device.deviceIdentifier}")
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
        logger.info("[SERVICE] getDevicesByStoreId called with storeId=$storeId")
        val devices = deviceRepository.findByStoreIdAndIsActive(storeId, true)
        logger.info("[SERVICE RESPONSE] Found ${devices.size} devices for storeId=$storeId")
        return devices
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
        logger.info("[SERVICE] getAllActiveDevices called")
        val devices = deviceRepository.findAll()
            .filter { it.isActive }
        logger.info("[SERVICE RESPONSE] Found ${devices.size} active devices")
        return devices
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
