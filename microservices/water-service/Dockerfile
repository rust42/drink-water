# Multi-stage build for water-service
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copy gradle files
COPY gradle gradle
COPY gradlew gradlew.bat build.gradle.kts settings.gradle.kts gradle.properties ./

# Copy source code
COPY shared shared
COPY water-service water-service

# Build the application
RUN ./gradlew :water-service:bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:21-jre

WORKDIR /app

# Create non-root user
RUN groupadd -r drinkwater && useradd -r -g drinkwater drinkwater

# Install wget for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

# Copy jar from builder
COPY --from=builder /app/water-service/build/libs/*.jar app.jar

# Change ownership
RUN chown -R drinkwater:drinkwater /app

USER drinkwater

EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8083/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
