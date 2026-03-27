# Environment Variables and Deployment Guide

## Overview

This document provides a comprehensive list of all environment variables and deployment commands for running the Drink Water microservices with Docker and Kubernetes.

---

## Environment Variables Reference

### Common Variables (All Services)

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `SERVER_PORT` | 8081/8082/8083 | HTTP server port | No |
| `SPRING_APPLICATION_NAME` | device-service/push-service/water-service | Spring app name | No |
| `SPRING_DATASOURCE_URL` | jdbc:h2:mem:... | Database JDBC URL | No |
| `SPRING_DATASOURCE_DRIVER` | org.h2.Driver | JDBC driver class | No |
| `SPRING_DATASOURCE_USERNAME` | sa | Database username | No |
| `SPRING_DATASOURCE_PASSWORD` | password | Database password | No |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | create-drop | Hibernate DDL mode | No |
| `SPRING_JPA_SHOW_SQL` | true | Show SQL queries | No |
| `SPRING_JPA_FORMAT_SQL` | true | Format SQL output | No |
| `SPRING_H2_CONSOLE_ENABLED` | true | Enable H2 console | No |
| `SPRING_PROFILES_ACTIVE` | default | Active Spring profiles | No |
| `LOGGING_LEVEL_COM_EXAMPLE_DRINKWATER` | DEBUG | App logging level | No |
| `LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_CLOUD_OPENFEIGN` | DEBUG | Feign logging level | No |
| `EUREKA_CLIENT_ENABLED` | false | Enable Eureka client | No |
| `EUREKA_CLIENT_SERVICE_URL` | http://localhost:8761/eureka/ | Eureka server URL | No |
| `EUREKA_INSTANCE_PREFER_IP_ADDRESS` | true | Prefer IP over hostname | No |

### Device Service Specific

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `SERVER_PORT` | 8081 | Service HTTP port | No |

### Push Service Specific

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `SERVER_PORT` | 8082 | Service HTTP port | No |
| `DEVICE_SERVICE_URL` | http://localhost:8081 | URL to device-service | Yes (Docker/K8s) |
| `PUSH_APNS_CERT_PATH` | /Users/sandeep/Documents/CSR/PushNotification.p12 | Path to APNS .p12 certificate | Yes (for cert auth) |
| `PUSH_APNS_CERT_PASSWORD` | sandycorolla | Password for APNS certificate | Yes (for cert auth) |
| `PUSH_APNS_TOKEN_ENABLED` | false | Enable token-based (p8) auth | No |
| `PUSH_APNS_TOKEN_KEY_ID` | (empty) | APNS Key ID for token auth | Yes (if token enabled) |
| `PUSH_APNS_TOKEN_TEAM_ID` | (empty) | Apple Team ID for token auth | Yes (if token enabled) |
| `PUSH_APNS_TOKEN_P8_PATH` | (empty) | Path to AuthKey .p8 file | Yes (if token enabled) |
| `PUSH_APNS_TOPIC` | com.sk.drink-water | APNS topic/bundle ID | No |
| `PUSH_APNS_SANDBOX_URL` | https://api.sandbox.push.apple.com/3/device | APNS sandbox URL | No |
| `PUSH_APNS_SANDBOX_ENABLED` | true | Use sandbox environment | No |
| `PUSH_APNS_PRODUCTION_URL` | https://api.push.apple.com/3/device | APNS production URL | No |

### Water Service Specific

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `SERVER_PORT` | 8083 | Service HTTP port | No |
| `DEVICE_SERVICE_URL` | http://localhost:8081 | URL to device-service | Yes (Docker/K8s) |
| `PUSH_SERVICE_URL` | http://localhost:8082 | URL to push-service | Yes (Docker/K8s) |

---

## Docker Deployment

### 1. Build Images

```bash
# Build all service images
docker build -t drinkwater/device-service:1.0.0 -f device-service/Dockerfile .
docker build -t drinkwater/push-service:1.0.0 -f push-service/Dockerfile .
docker build -t drinkwater/water-service:1.0.0 -f water-service/Dockerfile .

# Or use Docker Compose to build
docker-compose build
```

### 2. Run with Docker Compose (Recommended)

Using `docker-compose.yml` in the project root:

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 3. Run Individual Containers

#### Device Service

```bash
docker run -d \
  --name device-service \
  -p 8081:8081 \
  -e SERVER_PORT=8081 \
  -e SPRING_DATASOURCE_URL=jdbc:h2:mem:device-db;DB_CLOSE_DELAY=-1 \
  -e SPRING_H2_CONSOLE_ENABLED=true \
  -e LOGGING_LEVEL_COM_EXAMPLE_DRINKWATER=INFO \
  drinkwater/device-service:1.0.0
```

#### Push Service (with Certificate)

```bash
docker run -d \
  --name push-service \
  -p 8082:8082 \
  -e SERVER_PORT=8082 \
  -e DEVICE_SERVICE_URL=http://device-service:8081 \
  -e SPRING_DATASOURCE_URL=jdbc:h2:mem:push-db;DB_CLOSE_DELAY=-1 \
  -e PUSH_APNS_CERT_PATH=/app/certs/PushNotification.p12 \
  -e PUSH_APNS_CERT_PASSWORD=sandycorolla \
  -e PUSH_APNS_TOPIC=com.sk.drink-water \
  -e PUSH_APNS_SANDBOX_ENABLED=true \
  -e LOGGING_LEVEL_COM_EXAMPLE_DRINKWATER=INFO \
  -v /path/to/your/PushNotification.p12:/app/certs/PushNotification.p12:ro \
  --link device-service:device-service \
  drinkwater/push-service:1.0.0
```

#### Push Service (with Token-based Auth - p8 file)

```bash
docker run -d \
  --name push-service \
  -p 8082:8082 \
  -e SERVER_PORT=8082 \
  -e DEVICE_SERVICE_URL=http://device-service:8081 \
  -e SPRING_DATASOURCE_URL=jdbc:h2:mem:push-db;DB_CLOSE_DELAY=-1 \
  -e PUSH_APNS_TOKEN_ENABLED=true \
  -e PUSH_APNS_TOKEN_KEY_ID=YOUR_KEY_ID \
  -e PUSH_APNS_TOKEN_TEAM_ID=YOUR_TEAM_ID \
  -e PUSH_APNS_TOKEN_P8_PATH=/app/certs/AuthKey.p8 \
  -e PUSH_APNS_TOPIC=com.sk.drink-water \
  -e PUSH_APNS_SANDBOX_ENABLED=true \
  -e LOGGING_LEVEL_COM_EXAMPLE_DRINKWATER=INFO \
  -v /path/to/your/AuthKey.p8:/app/certs/AuthKey.p8:ro \
  --link device-service:device-service \
  drinkwater/push-service:1.0.0
```

#### Water Service

```bash
docker run -d \
  --name water-service \
  -p 8083:8083 \
  -e SERVER_PORT=8083 \
  -e DEVICE_SERVICE_URL=http://device-service:8081 \
  -e PUSH_SERVICE_URL=http://push-service:8082 \
  -e SPRING_DATASOURCE_URL=jdbc:h2:mem:water-db;DB_CLOSE_DELAY=-1 \
  -e LOGGING_LEVEL_COM_EXAMPLE_DRINKWATER=INFO \
  --link device-service:device-service \
  --link push-service:push-service \
  drinkwater/water-service:1.0.0
```

### 4. Create a Docker Network (for manual container linking)

```bash
# Create network
docker network create drinkwater-network

# Run containers on the network
docker run -d \
  --name device-service \
  --network drinkwater-network \
  -p 8081:8081 \
  -e SPRING_PROFILES_ACTIVE=docker \
  drinkwater/device-service:1.0.0

docker run -d \
  --name push-service \
  --network drinkwater-network \
  -p 8082:8082 \
  -e DEVICE_SERVICE_URL=http://device-service:8081 \
  -e SPRING_PROFILES_ACTIVE=docker \
  -v /path/to/PushNotification.p12:/app/certs/PushNotification.p12:ro \
  drinkwater/push-service:1.0.0

docker run -d \
  --name water-service \
  --network drinkwater-network \
  -p 8083:8083 \
  -e DEVICE_SERVICE_URL=http://device-service:8081 \
  -e PUSH_SERVICE_URL=http://push-service:8082 \
  -e SPRING_PROFILES_ACTIVE=docker \
  drinkwater/water-service:1.0.0
```

---

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl apply -f k8s/00-namespace.yaml

# Or create manually
kubectl create namespace drinkwater
```

### 2. Create ConfigMap

Using the file `k8s/01-configmap.yaml`:

```bash
kubectl apply -f k8s/01-configmap.yaml
```

Or create manually:

```bash
kubectl create configmap drinkwater-config \
  --from-literal=SERVER_PORT=8081 \
  --from-literal=DEVICE_SERVICE_URL=http://device-service:8081 \
  --from-literal=PUSH_SERVICE_URL=http://push-service:8082 \
  --from-literal=SPRING_DATASOURCE_URL=jdbc:h2:mem:device-db;DB_CLOSE_DELAY=-1 \
  --from-literal=SPRING_PROFILES_ACTIVE=kubernetes \
  --from-literal=LOGGING_LEVEL_COM_EXAMPLE_DRINKWATER=INFO \
  --from-literal=PUSH_APNS_TOPIC=com.sk.drink-water \
  --from-literal=PUSH_APNS_SANDBOX_ENABLED=true \
  --from-literal=PUSH_APNS_TOKEN_ENABLED=false \
  -n drinkwater
```

### 3. Create Secrets

#### For Certificate-based APNS Auth (p12 file)

```bash
# Create secret with certificate file and password
kubectl create secret generic apns-cert-secret \
  --from-file=PushNotification.p12=/path/to/PushNotification.p12 \
  --from-literal=cert-password=sandycorolla \
  -n drinkwater
```

#### For Token-based APNS Auth (p8 file)

```bash
# Create secret with p8 file
kubectl create secret generic apns-p8-secret \
  --from-file=AuthKey.p8=/path/to/AuthKey_KEYID.p8 \
  --from-literal=key-id=YOUR_KEY_ID \
  --from-literal=team-id=YOUR_TEAM_ID \
  -n drinkwater

# Update ConfigMap to enable token auth
kubectl patch configmap drinkwater-config \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/PUSH_APNS_TOKEN_ENABLED", "value": "true"}]' \
  -n drinkwater
```

### 4. Deploy Services

```bash
# Deploy all services
kubectl apply -f k8s/10-device-service.yaml
kubectl apply -f k8s/20-push-service.yaml
kubectl apply -f k8s/30-water-service.yaml

# Or deploy all at once
kubectl apply -f k8s/
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n drinkwater

# Check services
kubectl get services -n drinkwater

# Check endpoints
kubectl get endpoints -n drinkwater

# View pod logs
kubectl logs -f deployment/device-service -n drinkwater
kubectl logs -f deployment/push-service -n drinkwater
kubectl logs -f deployment/water-service -n drinkwater

# Describe pod for debugging
kubectl describe pod -l app=device-service -n drinkwater
```

### 6. Access Services Locally (Port Forwarding)

```bash
# Forward device-service
kubectl port-forward service/device-service 8081:8081 -n drinkwater &

# Forward push-service
kubectl port-forward service/push-service 8082:8082 -n drinkwater &

# Forward water-service
kubectl port-forward service/water-service 8083:8083 -n drinkwater &

# Now test APIs
 curl http://localhost:8081/actuator/health
```

### 7. Expose Services (LoadBalancer/NodePort)

```bash
# Patch services to use LoadBalancer (cloud environments)
kubectl patch service device-service -n drinkwater \
  -p '{"spec":{"type":"LoadBalancer"}}'

kubectl patch service push-service -n drinkwater \
  -p '{"spec":{"type":"LoadBalancer"}}'

kubectl patch service water-service -n drinkwater \
  -p '{"spec":{"type":"LoadBalancer"}}'

# For local clusters (minikube/kind), use NodePort
kubectl patch service device-service -n drinkwater \
  -p '{"spec":{"type":"NodePort"}}'
```

### 8. Scaling

```bash
# Scale to 3 replicas
kubectl scale deployment device-service --replicas=3 -n drinkwater
kubectl scale deployment push-service --replicas=3 -n drinkwater
kubectl scale deployment water-service --replicas=3 -n drinkwater
```

### 9. Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/

# Or delete namespace (removes everything)
kubectl delete namespace drinkwater

# Delete Docker containers
docker-compose down
```

---

## Testing the Deployment

After deployment, verify all services are working:

### 1. Health Checks

```bash
# Docker
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:8083/actuator/health

# Kubernetes (with port-forward)
curl http://localhost:8081/actuator/health
```

### 2. Register a Device

```bash
curl -X POST http://localhost:8081/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceIdentifier": "test-device",
    "pushToken": "test-token",
    "storeId": "store-1",
    "deviceName": "iPhone",
    "platform": "iOS"
  }'
```

### 3. Test Inter-Service Communication

```bash
# Test water-service -> device-service
curl -X POST http://localhost:8083/api/water/intake \
  -H "Content-Type: application/json" \
  -d '{
    "deviceIdentifier": "test-device",
    "amount": 250
  }'
```

---

## Troubleshooting

### Docker Issues

```bash
# View container logs
docker logs device-service
docker logs push-service
docker logs water-service

# Exec into container
docker exec -it device-service /bin/sh
docker exec -it push-service /bin/sh

# Check if APNS cert is mounted correctly
docker exec -it push-service ls -la /app/certs/

# Restart container
docker restart device-service
```

### Kubernetes Issues

```bash
# Check pod status
kubectl get pods -n drinkwater -o wide

# Describe pod for events
kubectl describe pod -l app=device-service -n drinkwater

# Check ConfigMap
kubectl get configmap drinkwater-config -n drinkwater -o yaml

# Check Secrets (values are base64 encoded)
kubectl get secret apns-cert-secret -n drinkwater -o yaml

# View events
kubectl get events -n drinkwater --sort-by='.lastTimestamp'

# Check logs
kubectl logs -f deployment/push-service -n drinkwater
```

---

## Summary

| Environment | File/Command | Purpose |
|-------------|--------------|---------|
| Docker | `docker-compose.yml` | Local multi-container orchestration |
| Docker | `docker run` with `-e` flags | Run individual containers |
| Kubernetes | `k8s/00-namespace.yaml` | Namespace definition |
| Kubernetes | `k8s/01-configmap.yaml` | Environment variables |
| Kubernetes | `k8s/02-secrets.yaml` | Sensitive data (certs, passwords) |
| Kubernetes | `k8s/10-device-service.yaml` | Device service deployment |
| Kubernetes | `k8s/20-push-service.yaml` | Push service deployment |
| Kubernetes | `k8s/30-water-service.yaml` | Water service deployment |
| Kubernetes | `kubectl apply -f k8s/` | Deploy everything |


kubectl create secret generic apns-cert-secret \
--from-file=PushNotification.p12=/Users/sandeep/Documents/CSR/PushNotification.p12 \
--from-literal=cert-password=sandycorolla \
-n drinkwater

# Restart the push-service pod
kubectl rollout restart deployment/push-service -n drinkwater

# Wait and check status
kubectl get pods -n drinkwater -w
