package com.example.drinkwater.push

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients

@SpringBootApplication(scanBasePackages = ["com.example.drinkwater"])
@EnableFeignClients
class PushServiceApplication

fun main(args: Array<String>) {
    runApplication<PushServiceApplication>(*args)
}
