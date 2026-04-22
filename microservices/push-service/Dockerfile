# Runtime-only image — JAR is pre-built by CI (Gradle runs on the host, not inside Docker)
# This avoids Gradle wrapper download failures in QEMU-emulated multi-arch builds
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user (Alpine uses addgroup/adduser)
RUN addgroup -S drinkwater && adduser -S drinkwater -G drinkwater

# Install required packages for certificates
RUN apk add --no-cache ca-certificates wget

# Copy pre-built jar from CI (context: ./microservices)
COPY push-service/build/libs/*.jar app.jar

# Create directories for certificates (mount secrets here)
RUN mkdir -p /app/certs && chown -R drinkwater:drinkwater /app

USER drinkwater

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
