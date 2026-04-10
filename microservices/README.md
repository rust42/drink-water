# Drink Water Microservices

A microservices-based architecture for the Drink Water application with separate services for device management, push notifications, and water intake tracking.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Eureka Server │    │  Device Service │    │  Push Service   │
│   (Port: 8761) │    │   (Port: 8080) │    │   (Port: 8080) │
│                 │    │                 │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Water Service  │
                    │ (Port: 8080) │
                    └─────────────────┘
```

## 📦 Services

### 1. **Eureka Server** (Service Discovery)
- **Port**: 8761
- **Purpose**: Service registration and discovery
- **URL**: http://localhost:8761
- **Health**: http://localhost:8761/actuator/health

### 2. **Device Service** (Device Management)
- **Port**: 8080
- **Purpose**: iOS device registration and management
- **Database**: In-memory H2
- **Endpoints**:
  - `POST /api/devices/register` - Register new device
  - `GET /api/devices/{deviceIdentifier}` - Get device details
  - `GET /api/devices/store/{storeId}` - Get devices by store
  - `PUT /api/devices/{deviceIdentifier}/deactivate` - Deactivate device

### 3. **Push Service** (Push Notifications)
- **Port**: 8080
- **Purpose**: Send push notifications to iOS devices
- **Features**:
  - HTTP/2 support for APNS
  - SSL certificate authentication
  - Integration with Device Service via Feign
- **Endpoints**:
  - `POST /api/push-notifications/send/{deviceIdentifier}` - Send to device
  - `POST /api/push-notifications/send/store/{storeId}` - Send to store
  - `POST /api/push-notifications/send/bulk` - Bulk notifications
  - `POST /api/push-notifications/send/hydration-reminder/{deviceIdentifier}` - Hydration reminder

### 4. **Water Service** (Water Intake Tracking)
- **Port**: 8080
- **Purpose**: Track water intake and goals
- **Database**: In-memory H2
- **Features**:
  - Daily goal tracking
  - Progress calculation
  - Integration with Push Service for reminders
- **Endpoints**:
  - `POST /api/water/intake` - Record water intake
  - `GET /api/water/intake/{deviceIdentifier}/today` - Get today's intake
  - `GET /api/water/intake/{deviceIdentifier}/goal` - Get daily goal
  - `POST /api/water/reminder/{deviceIdentifier}` - Send hydration reminder

## 🔧 Technology Stack

- **Language**: Kotlin
- **Framework**: Spring Boot 3.2.0
- **Service Discovery**: Eureka (Spring Cloud Netflix)
- **Database**: H2 (In-memory)
- **HTTP Client**: OkHttp + Feign
- **Push Notifications**: Java 11+ HTTP/2 Client with APNS
- **Build Tool**: Gradle with Kotlin DSL

## 🚀 Getting Started

### Prerequisites
- Java 21+
- Gradle 8+
- APNS push certificate (.p12 file)

### Running Services

1. **Start Eureka Server**:
   ```bash
   cd microservices
   ./gradlew :eureka-server:bootRun
   ```

2. **Start Device Service**:
   ```bash
   cd microservices
   ./gradlew :device-service:bootRun
   ```

3. **Start Push Service**:
   ```bash
   cd microservices
   ./gradlew :push-service:bootRun
   ```

4. **Start Water Service**:
   ```bash
   cd microservices
   ./gradlew :water-service:bootRun
   ```

### Or run all services (for development):
```bash
cd microservices
./gradlew bootRun
```

## 📱 API Usage Examples

### Register a Device
```bash
curl -X POST http://localhost:8081/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceIdentifier": "iphone-123",
    "pushToken": "device-token-here",
    "storeId": "store-456",
    "deviceName": "John iPhone",
    "platform": "iOS",
    "osVersion": "17.0",
    "appVersion": "1.0.0"
  }'
```

### Send Push Notification
```bash
curl -X POST http://localhost:8082/api/push-notifications/send/iphone-123 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hydration Reminder",
    "subtitle": "Time to drink water",
    "body": "Stay hydrated throughout the day",
    "sound": "default",
    "category": "HYDRATION"
  }'
```

### Record Water Intake
```bash
curl -X POST http://localhost:8083/api/water/intake \
  -H "Content-Type: application/json" \
  -d '{
    "deviceIdentifier": "iphone-123",
    "amount": 250,
    "unit": "ml",
    "notes": "Morning water"
  }'
```

## 🔧 Configuration

### Service Discovery
All services register with Eureka at `http://localhost:8761/eureka/`

### Inter-Service Communication
- **Device Service** → **Push Service**: Feign HTTP client
- **Water Service** → **Push Service**: Feign HTTP client
- **Water Service** → **Device Service**: Feign HTTP client

## 📊 Monitoring

### Health Endpoints
- Eureka Server: http://localhost:8761/actuator/health
- Device Service: http://localhost:8081/actuator/health
- Push Service: http://localhost:8082/actuator/health
- Water Service: http://localhost:8083/actuator/health

### Eureka Dashboard
- URL: http://localhost:8761
- View all registered services and their status

## 🛠️ Development Notes

### Database Schema
Each service uses its own in-memory H2 database for isolation.

### Configuration Files
- Each service has its own `application.yml` in `src/main/resources/`
- Shared configuration in parent `build.gradle.kts`

### Testing
- Each service can be tested independently
- Use H2 console for database inspection: http://localhost:808X/h2-console

## 🚀 Production Deployment

### Environment Variables
- `SPRING_PROFILES_ACTIVE=prod` - Use production configuration
- Database: Replace H2 with PostgreSQL/MySQL
- APNS: Update certificate paths for production

### Docker Support
Each service can be containerized separately:
```dockerfile
FROM openjdk:21-jre-slim
COPY build/libs/*.jar app.jar
EXPOSE 808X
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## 🔄 Scaling

### Horizontal Scaling
- Multiple instances of each service can run on different ports
- Load balancer can distribute requests
- Eureka maintains service registry

### Database Scaling
- Replace in-memory H2 with external databases
- Add connection pooling
- Implement read replicas for water service

## 📝 Next Steps

1. **Add API Gateway** - Single entry point for all services
2. **Add Authentication** - JWT-based security
3. **Add Monitoring** - Prometheus + Grafana
4. **Add CI/CD** - Jenkins/GitHub Actions
5. **Container Orchestration** - Docker Compose/Kubernetes
