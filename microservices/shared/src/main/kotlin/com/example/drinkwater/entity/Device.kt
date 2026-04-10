package com.example.drinkwater.entity

import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "devices")
class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @Column(unique = true, nullable = false)
    var deviceIdentifier: String = ""

    @Column(name = "push_token", nullable = false)
    var pushToken: String = ""

    @Column(name = "store_id", nullable = false)
    var storeId: String = ""

    @Column(name = "device_name")
    var deviceName: String? = null

    @Column(name = "platform")
    var platform: String? = null

    @Column(name = "os_version")
    var osVersion: String? = null

    @Column(name = "app_version")
    var appVersion: String? = null

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()

    @Column(name = "is_active", nullable = false)
    @JsonProperty("isActive")
    var isActive: Boolean = true

    constructor()

    constructor(
        deviceIdentifier: String,
        pushToken: String,
        storeId: String,
        deviceName: String? = null,
        platform: String? = null,
        osVersion: String? = null,
        appVersion: String? = null,
    ) {
        this.deviceIdentifier = deviceIdentifier
        this.pushToken = pushToken
        this.storeId = storeId
        this.deviceName = deviceName
        this.platform = platform
        this.osVersion = osVersion
        this.appVersion = appVersion
        this.createdAt = LocalDateTime.now()
        this.updatedAt = LocalDateTime.now()
        this.isActive = true
    }

    @PreUpdate
    fun preUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
