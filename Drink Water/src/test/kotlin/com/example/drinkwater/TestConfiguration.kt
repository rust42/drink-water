package com.example.drinkwater

import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.context.annotation.Profile

@TestConfiguration
@Profile("test")
class TestConfig {

    @Bean
    @Primary
    fun mockApnsClientConfiguration() = object {
        // Mock configuration for tests
    }
}
