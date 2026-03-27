# Drink Water Microservices - API Documentation

## Overview
This document describes all available API endpoints across the three microservices:

- **Device Service** (port 8081) - Manages device registration and storage
- **Push Service** (port 8082) - Sends push notifications via APNS
- **Water Service** (port 8083) - Tracks water intake and sends reminders

---

## Device Service (Port 8081)

### Base URL: `http://localhost:8081`

#### 1. Register Device
Registers a new device for push notifications.

**Endpoint:** `POST /api/devices/register`

**Request Body:**
```json
{
  "deviceIdentifier": "real-ios-device",
  "pushToken": "your-apns-device-token",
  "storeId": "store-1",
  "deviceName": "iPhone 15",
  "platform": "iOS",
  "osVersion": "17.0",
  "appVersion": "1.0.0"
}
```

**curl:**
```bash
curl -X POST http://localhost:8081/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceIdentifier": "real-ios-device",
    "pushToken": "your-apns-device-token",
    "storeId": "store-1",
    "deviceName": "iPhone 15",
    "platform": "iOS",
    "osVersion": "17.0",
    "appVersion": "1.0.0"
  }'
```

**httpie:**
```bash
http POST http://localhost:8081/api/devices/register \
  deviceIdentifier=real-ios-device \
  pushToken=your-apns-device-token \
  storeId=store-1 \
  deviceName="iPhone 15" \
  platform=iOS \
  osVersion="17.0" \
  appVersion="1.0.0"
```

**Success Response (201):**
```json
{
  "id": 1,
  "deviceIdentifier": "real-ios-device",
  "pushToken": "your-apns-device-token",
  "storeId": "store-1",
  "deviceName": "iPhone 15",
  "platform": "iOS",
  "osVersion": "17.0",
  "appVersion": "1.0.0",
  "createdAt": "2026-03-27T12:41:58.826177",
  "updatedAt": "2026-03-27T12:41:58.826183",
  "message": "Push device registered successfully",
  "active": true
}
```

---

#### 2. Get Device by Identifier
Retrieves device information.

**Endpoint:** `GET /api/devices/{deviceIdentifier}`

**curl:**
```bash
curl http://localhost:8081/api/devices/real-ios-device
```

**httpie:**
```bash
http GET http://localhost:8081/api/devices/real-ios-device
```

**Success Response (200):**
```json
{
  "id": 1,
  "deviceIdentifier": "real-ios-device",
  "pushToken": "your-apns-device-token",
  "storeId": "store-1",
  "deviceName": "iPhone 15",
  "platform": "iOS",
  "osVersion": "17.0",
  "appVersion": "1.0.0",
  "createdAt": "2026-03-27T12:41:58.826177",
  "updatedAt": "2026-03-27T12:41:58.826183",
  "message": "Device found",
  "active": true
}
```

---

#### 3. Get Devices by Store
Retrieves all active devices for a store.

**Endpoint:** `GET /api/devices/store/{storeId}`

**curl:**
```bash
curl http://localhost:8081/api/devices/store/store-1
```

**httpie:**
```bash
http GET http://localhost:8081/api/devices/store/store-1
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "deviceIdentifier": "real-ios-device",
    "pushToken": "your-apns-device-token",
    "storeId": "store-1",
    "deviceName": "iPhone 15",
    "platform": "iOS",
    "osVersion": "17.0",
    "appVersion": "1.0.0",
    "createdAt": "2026-03-27T12:41:58.826177",
    "updatedAt": "2026-03-27T12:41:58.826183",
    "message": "Device found",
    "active": true
  }
]
```

---

#### 4. Deactivate Device
Deactivates a device (soft delete).

**Endpoint:** `PUT /api/devices/{deviceIdentifier}/deactivate`

**curl:**
```bash
curl -X PUT http://localhost:8081/api/devices/real-ios-device/deactivate
```

**httpie:**
```bash
http PUT http://localhost:8081/api/devices/real-ios-device/deactivate
```

**Success Response (200):** Empty body

---

## Push Service (Port 8082)

### Base URL: `http://localhost:8082`

#### 1. Send Hydration Reminder
Sends a pre-defined hydration reminder push notification to a device.

**Endpoint:** `POST /api/push-notifications/send/hydration-reminder/{deviceIdentifier}`

**curl:**
```bash
curl -X POST http://localhost:8082/api/push-notifications/send/hydration-reminder/real-ios-device
```

**httpie:**
```bash
http POST http://localhost:8082/api/push-notifications/send/hydration-reminder/real-ios-device
```

**Success Response (200):**
```json
{
  "deviceIdentifier": "real-ios-device",
  "success": true,
  "message": "Push sent successfully",
  "statusCode": 200
}
```

**Failure Response (400):**
```json
{
  "deviceIdentifier": "real-ios-device",
  "success": false,
  "message": "Failed to send push: [400 ] during [POST] to [https://api.sandbox.push.apple.com/3/device/token]...",
  "statusCode": null
}
```

---

#### 2. Send Custom Push to Device
Sends a custom push notification to a single device.

**Endpoint:** `POST /api/push-notifications/send/{deviceIdentifier}`

**Request Body:**
```json
{
  "title": "Custom Title",
  "body": "Custom message body",
  "subtitle": "Optional subtitle",
  "sound": "default",
  "threadId": "1234",
  "category": "DAILY_SUMMARY",
  "customData": {
    "key": "value"
  }
}
```

**curl:**
```bash
curl -X POST http://localhost:8082/api/push-notifications/send/real-ios-device \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Custom Title",
    "body": "Custom message body",
    "sound": "default"
  }'
```

**httpie:**
```bash
http POST http://localhost:8082/api/push-notifications/send/real-ios-device \
  title="Custom Title" \
  body="Custom message body" \
  sound=default
```

**Success Response (200):**
```json
{
  "deviceIdentifier": "real-ios-device",
  "success": true,
  "message": "Push sent successfully",
  "statusCode": 200
}
```

---

#### 3. Send Push to Store
Sends a push notification to all active devices in a store.

**Endpoint:** `POST /api/push-notifications/send/store/{storeId}`

**Request Body:**
```json
{
  "title": "Store Alert",
  "body": "Message to all devices in store",
  "sound": "default"
}
```

**curl:**
```bash
curl -X POST http://localhost:8082/api/push-notifications/send/store/store-1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Store Alert",
    "body": "Message to all devices in store",
    "sound": "default"
  }'
```

**httpie:**
```bash
http POST http://localhost:8082/api/push-notifications/send/store/store-1 \
  title="Store Alert" \
  body="Message to all devices in store" \
  sound=default
```

**Success Response (200):**
```json
[
  {
    "deviceIdentifier": "real-ios-device",
    "success": true,
    "message": "Push sent successfully",
    "statusCode": 200
  }
]
```

---

#### 4. Send Bulk Push
Sends push notifications to multiple devices.

**Endpoint:** `POST /api/push-notifications/send/bulk`

**Request Body:**
```json
{
  "targets": [
    {
      "deviceIdentifier": "device-1",
      "storeId": "store-1"
    },
    {
      "deviceIdentifier": "device-2",
      "storeId": "store-1"
    }
  ],
  "notification": {
    "title": "Bulk Notification",
    "body": "This goes to multiple devices",
    "sound": "default"
  }
}
```

**curl:**
```bash
curl -X POST http://localhost:8082/api/push-notifications/send/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [
      {"deviceIdentifier": "real-ios-device", "storeId": "store-1"}
    ],
    "notification": {
      "title": "Bulk Notification",
      "body": "This goes to multiple devices",
      "sound": "default"
    }
  }'
```

**httpie:**
```bash
http POST http://localhost:8082/api/push-notifications/send/bulk \
  targets:='[{"deviceIdentifier": "real-ios-device", "storeId": "store-1"}]' \
  notification:='{"title": "Bulk Notification", "body": "This goes to multiple devices", "sound": "default"}'
```

**Success Response (200):**
```json
[
  {
    "deviceIdentifier": "real-ios-device",
    "success": true,
    "message": "Push sent successfully",
    "statusCode": 200
  }
]
```

---

## Water Service (Port 8083)

### Base URL: `http://localhost:8083`

#### 1. Record Water Intake
Records a water intake entry for a device. Validates device exists via device-service.

**Endpoint:** `POST /api/water/intake`

**Request Body:**
```json
{
  "deviceIdentifier": "real-ios-device",
  "amount": 250,
  "timestamp": "2026-03-27T12:00:00"
}
```

**curl:**
```bash
curl -X POST http://localhost:8083/api/water/intake \
  -H "Content-Type: application/json" \
  -d '{
    "deviceIdentifier": "real-ios-device",
    "amount": 250
  }'
```

**httpie:**
```bash
http POST http://localhost:8083/api/water/intake \
  deviceIdentifier=real-ios-device \
  amount:=250
```

**Success Response (201):**
```json
{
  "deviceIdentifier": "real-ios-device",
  "amount": 250,
  "totalIntake": 750,
  "dailyGoal": 2000,
  "timestamp": "2026-03-27T12:54:58.322609",
  "message": "Water intake recorded successfully. Total today: 750 ml"
}
```

---

#### 2. Get Today's Intake
Retrieves today's total water intake for a device.

**Endpoint:** `GET /api/water/intake/{deviceIdentifier}/today`

**curl:**
```bash
curl http://localhost:8083/api/water/intake/real-ios-device/today
```

**httpie:**
```bash
http GET http://localhost:8083/api/water/intake/real-ios-device/today
```

**Success Response (200):**
```json
{
  "deviceIdentifier": "real-ios-device",
  "amount": null,
  "totalIntake": 750,
  "dailyGoal": 2000,
  "timestamp": null,
  "message": "Keep drinking! You need 1250 ml more to reach your goal."
}
```

---

#### 3. Get Daily Goal
Retrieves the daily water intake goal for a device.

**Endpoint:** `GET /api/water/intake/{deviceIdentifier}/goal`

**curl:**
```bash
curl http://localhost:8083/api/water/intake/real-ios-device/goal
```

**httpie:**
```bash
http GET http://localhost:8083/api/water/intake/real-ios-device/goal
```

**Success Response (200):**
```json
{
  "deviceIdentifier": "real-ios-device",
  "dailyGoal": 2000,
  "unit": "ml"
}
```

---

#### 4. Send Hydration Reminder
Sends a hydration reminder via push-service to a device.

**Endpoint:** `POST /api/water/reminder/{deviceIdentifier}`

**curl:**
```bash
curl -X POST http://localhost:8083/api/water/reminder/real-ios-device
```

**httpie:**
```bash
http POST http://localhost:8083/api/water/reminder/real-ios-device
```

**Success Response (200):**
```json
{
  "deviceIdentifier": "real-ios-device",
  "reminderSent": true,
  "timestamp": 1774634098352
}
```

**Failure Response (if APNS fails):**
```json
{
  "deviceIdentifier": "real-ios-device",
  "reminderSent": false,
  "timestamp": 1774634098352
}
```

---

## Service Dependencies

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ water-service│────▶│ push-service │────▶│    APNS     │
│   (port 8083)│     │   (port 8082)│     │  (Apple)    │
└──────┬──────┘     └──────┬──────┘     └─────────────┘
       │                   │
       │    ┌─────────────┐│
       └───▶│device-service│◀┘
          │   (port 8081) │
          │   [Database]  │
          └─────────────┘
```

---

## Configuration

### Device Service
- Port: 8081
- Database: H2 in-memory
- No external dependencies

### Push Service
- Port: 8082
- Database: H2 in-memory
- APNS Authentication: Certificate-based (p12) or Token-based (p8)
- Depends on: device-service

**APNS Certificate Configuration (p12):**
```yaml
push:
  apns:
    cert:
      path: /path/to/certificate.p12
      password: your-password
    topic: com.sk.drink-water
```

**APNS Token Configuration (p8):**
```yaml
push:
  apns:
    token:
      enabled: true
      key-id: YOUR_KEY_ID
      team-id: YOUR_TEAM_ID
      p8-path: /path/to/AuthKey_KEYID.p8
    topic: com.sk.drink-water
```

### Water Service
- Port: 8083
- Database: H2 in-memory
- Depends on: device-service, push-service

---

## Error Responses

All services return consistent error responses:

**Bad Request (400):**
```json
{
  "error": "Failed to register device: error message"
}
```

**Not Found (404):**
```json
{
  "error": "Device not found"
}
```

**Internal Server Error (500):**
```json
{
  "error": "Internal server error: error message"
}
```

---

## Health Check

All services expose Spring Boot Actuator endpoints:

**curl:**
```bash
# Device Service
curl http://localhost:8081/actuator/health

# Push Service
curl http://localhost:8082/actuator/health

# Water Service
curl http://localhost:8083/actuator/health
```

**httpie:**
```bash
# Device Service
http GET http://localhost:8081/actuator/health

# Push Service
http GET http://localhost:8082/actuator/health

# Water Service
http GET http://localhost:8083/actuator/health
```
