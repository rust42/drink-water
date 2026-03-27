package com.example.drinkwater.repository

import com.example.drinkwater.entity.Device
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface DeviceRepository : JpaRepository<Device, Long> {
    fun findByDeviceIdentifier(deviceIdentifier: String): Optional<Device>
    fun findByDeviceIdentifierAndIsActive(deviceIdentifier: String, isActive: Boolean): Optional<Device>
    fun findByStoreIdAndIsActive(storeId: String, isActive: Boolean): List<Device>
    fun findByPushTokenAndIsActive(pushToken: String, isActive: Boolean): List<Device>
    fun existsByDeviceIdentifier(deviceIdentifier: String): Boolean
}
