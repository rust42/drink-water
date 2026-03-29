package com.example.drinkwater.water

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients
import org.springframework.kafka.annotation.EnableKafka

@SpringBootApplication(scanBasePackages = ["com.example.drinkwater"])
@EnableFeignClients
@EnableKafka
class WaterServiceApplication

fun main(args: Array<String>) {
    runApplication<WaterServiceApplication>(*args)
}
