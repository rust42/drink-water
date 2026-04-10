package com.example.drinkwater.push.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.servers.Server
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    @Value("\${server.port:8080}")
    private lateinit var serverPort: String

    @Bean
    fun pushServiceOpenAPI(): OpenAPI {
        return OpenAPI()
            .info(
                Info()
                    .title("Push Service API")
                    .description("API for sending push notifications to iOS devices via APNS (Apple Push Notification Service)")
                    .version("1.0.0")
                    .contact(
                        Contact()
                            .name("Drink Water Team")
                            .email("support@drinkwater.app")
                    )
                    .license(
                        License()
                            .name("MIT License")
                            .url("https://opensource.org/licenses/MIT")
                    )
            )
            .addServersItem(
                Server()
                    .url("http://localhost:$serverPort")
                    .description("Local Development")
            )
            .addServersItem(
                Server()
                    .url("http://push-service:$serverPort")
                    .description("Kubernetes Cluster")
            )
    }
}
