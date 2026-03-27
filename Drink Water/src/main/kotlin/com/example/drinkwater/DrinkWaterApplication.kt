package com.example.drinkwater

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients

@SpringBootApplication
@EnableFeignClients
class DrinkWaterApplication

fun main(args: Array<String>) {
    runApplication<DrinkWaterApplication>(*args)
}
