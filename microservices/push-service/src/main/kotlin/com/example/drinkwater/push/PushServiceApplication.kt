package com.example.drinkwater.push

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients
import org.springframework.kafka.annotation.EnableKafka

@SpringBootApplication(scanBasePackages = ["com.example.drinkwater"])
@EnableFeignClients
@EnableKafka
class PushServiceApplication

fun main(args: Array<String>) {
    runApplication<PushServiceApplication>(*args)
}
