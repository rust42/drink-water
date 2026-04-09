package com.example.drinkwater.device

import com.example.drinkwater.device.service.DeviceEventProducer
import com.example.drinkwater.device.service.DeviceService
import com.example.drinkwater.dto.DeviceRegistrationRequest
import com.example.drinkwater.dto.DeviceRegistrationResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/devices")
class DeviceController(
    private val deviceService: DeviceService,
    private val deviceEventProducer: DeviceEventProducer,
) {
    private val logger = LoggerFactory.getLogger(DeviceController::class.java)

    @PostMapping("/register")
    fun registerDevice(
        @Valid @RequestBody request: DeviceRegistrationRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<Any> {
        logger.info("[API REQUEST] POST ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug(
            "[REQUEST BODY] DeviceRegistrationRequest: deviceIdentifier=${request.deviceIdentifier}, storeId=${request.storeId}, platform=${request.platform}, deviceName=${request.deviceName}",
        )

        return try {
            val response = deviceService.registerDevice(request)
            logger.info(
                "[API RESPONSE] Device registered successfully: id=${response.id}, deviceIdentifier=${response.deviceIdentifier}",
            )

            // Publish event to Kafka for async processing
            deviceEventProducer.publishDeviceRegisteredEvent(response)
            ResponseEntity.status(HttpStatus.CREATED).body(response)
        } catch (e: Exception) {
            logger.error("[API ERROR] Failed to register device: ${e.message}", e)
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(mapOf("error" to "Failed to register device: ${e.message}"))
        }
    }

    @GetMapping("/{deviceIdentifier}")
    fun getDevice(
        @PathVariable deviceIdentifier: String,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<DeviceRegistrationResponse> {
        logger.info("[API REQUEST] GET ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[PATH VARIABLE] deviceIdentifier=$deviceIdentifier")

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
            logger.info("[API RESPONSE] Device found: id=${response.id}, deviceIdentifier=${response.deviceIdentifier}")
            ResponseEntity.ok(response)
        } catch (e: IllegalArgumentException) {
            logger.warn("[API ERROR] Device not found: deviceIdentifier=$deviceIdentifier")
            ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
    }

    @GetMapping
    fun getAllDevices(httpRequest: HttpServletRequest): ResponseEntity<List<DeviceRegistrationResponse>> {
        logger.info("[API REQUEST] GET ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")

        val devices = deviceService.getAllDevices()
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
        logger.info("[API RESPONSE] Found ${responses.size} devices total")
        return ResponseEntity.ok(responses)
    }

    @GetMapping("/store/{storeId}")
    fun getDevicesByStore(
        @PathVariable storeId: String,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<List<DeviceRegistrationResponse>> {
        logger.info("[API REQUEST] GET ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[PATH VARIABLE] storeId=$storeId")

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
        logger.info("[API RESPONSE] Found ${responses.size} devices for storeId=$storeId")
        return ResponseEntity.ok(responses)
    }

    @PutMapping("/{deviceIdentifier}/deactivate")
    fun deactivateDevice(
        @PathVariable deviceIdentifier: String,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<Void> {
        logger.info("[API REQUEST] PUT ${httpRequest.requestURI} from ${httpRequest.remoteAddr}")
        logger.debug("[PATH VARIABLE] deviceIdentifier=$deviceIdentifier")

        deviceService.deactivateDevice(deviceIdentifier)
        logger.info("[API RESPONSE] Device deactivated: deviceIdentifier=$deviceIdentifier")
        return ResponseEntity.ok().build()
    }
}
