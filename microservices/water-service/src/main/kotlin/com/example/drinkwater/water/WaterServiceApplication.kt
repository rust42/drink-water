package com.example.drinkwater.water

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients

@SpringBootApplication(scanBasePackages = ["com.example.drinkwater"])
@EnableFeignClients
class WaterServiceApplication

fun main(args: Array<String>) {
    runApplication<WaterServiceApplication>(*args)
}
