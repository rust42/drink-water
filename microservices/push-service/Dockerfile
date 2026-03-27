# Multi-stage build for push-service
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copy gradle files
COPY gradle gradle
COPY gradlew gradlew.bat build.gradle.kts settings.gradle.kts gradle.properties ./

# Copy source code
COPY shared shared
COPY push-service push-service

# Build the application
RUN ./gradlew :push-service:bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:21-jre

WORKDIR /app

# Create non-root user
RUN groupadd -r drinkwater && useradd -r -g drinkwater drinkwater

# Install required packages for certificates
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates wget && rm -rf /var/lib/apt/lists/*

# Copy jar from builder
COPY --from=builder /app/push-service/build/libs/*.jar app.jar

# Create directories for certificates (mount secrets here)
RUN mkdir -p /app/certs && chown -R drinkwater:drinkwater /app

USER drinkwater

EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8082/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
