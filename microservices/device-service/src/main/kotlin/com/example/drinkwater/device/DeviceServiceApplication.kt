package com.example.drinkwater.device

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients

@SpringBootApplication(scanBasePackages = ["com.example.drinkwater"])
@EntityScan(basePackages = ["com.example.drinkwater.entity"])
@EnableFeignClients
class DeviceServiceApplication

fun main(args: Array<String>) {
    runApplication<DeviceServiceApplication>(*args)
}
