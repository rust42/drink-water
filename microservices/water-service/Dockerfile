# Multi-stage build for water-service
# Use Ubuntu JDK for builder (Alpine has JVM compatibility issues with Gradle)
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

# Runtime stage - Use Alpine JRE for smaller image (~60MB vs ~200MB)
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user (Alpine uses addgroup/adduser)
RUN addgroup -S drinkwater && adduser -S drinkwater -G drinkwater

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy jar from builder
COPY --from=builder /app/water-service/build/libs/*.jar app.jar

# Change ownership
RUN chown -R drinkwater:drinkwater /app

USER drinkwater

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
