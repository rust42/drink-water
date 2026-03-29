# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Drink Water microservices.

## Quick Start Options

- **Option 1: Helm (Recommended)** - Easiest way to deploy with customizable values
- **Option 2: kubectl** - Manual deployment with raw YAML files

---

## Option 1: Helm Deployment (Recommended)

### Prerequisites

1. Helm 3.2+ installed
2. Kubernetes cluster (v1.24+)
3. kubectl configured

### Deploy with Helm

```bash
# Navigate to helm chart
cd ../helm/drinkwater

# Install the chart
helm install drinkwater .

# Or with custom values
helm install drinkwater . -f custom-values.yaml

# Upgrade
helm upgrade drinkwater .

# Uninstall
helm uninstall drinkwater
```

### Helm Configuration

Key configurable values (see `../helm/drinkwater/values.yaml`):

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.tag` | Image version | `1.0.1` |
| `namespace` | Deployment namespace | `drinkwater` |
| `kafka.enabled` | Enable Kafka | `true` |
| `deviceService.replicaCount` | Device service replicas | `1` |
| `pushService.replicaCount` | Push service replicas | `1` |
| `pushService.secret.certPassword` | APNS cert password | `sandycorolla` |

### Custom Values Example

Create `custom-values.yaml`:

```yaml
image:
  tag: "1.0.2"
  registry: "ghcr.io/your-org"

namespace: production

pushService:
  replicaCount: 2
  secret:
    certPassword: "your-secure-password"
```

---

## Option 2: kubectl Deployment (Manual)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         drinkwater namespace                     │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│  │   device    │────▶│    push     │────▶│    APNS     │     │
│  │  -service   │     │  -service   │     │   (Apple)   │     │
│  │   :8081     │     │   :8082     │     │             │     │
│  └──────┬──────┘     └──────┬──────┘     └─────────────┘     │
│         │                   │                                    │
│         │    ┌─────────────┐│                                    │
│         └───▶│   water     │◀┘                                    │
│            │  -service     │                                       │
│            │   :8083      │                                       │
│            └──────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Files

| File | Description |
|------|-------------|
| `00-namespace.yaml` | Creates the `drinkwater` namespace |
| `01-configmap.yaml` | Common configuration (service URLs, APNS settings) |
| `02-secrets.yaml` | APNS certificate password and token auth secrets |
| `10-device-service.yaml` | Deployment and Service for device-service |
| `20-push-service.yaml` | Deployment and Service for push-service |
| `30-water-service.yaml` | Deployment and Service for water-service |

## Prerequisites

1. Kubernetes cluster (v1.24+)
2. kubectl configured
3. Docker images built and available

## Quick Start

### 1. Build Docker Images

```bash
# From project root
docker build -t drinkwater/device-service:1.0.0 -f device-service/Dockerfile .
docker build -t drinkwater/push-service:1.0.0 -f push-service/Dockerfile .
docker build -t drinkwater/water-service:1.0.0 -f water-service/Dockerfile .
```

### 2. Push to Registry (if using remote cluster)

```bash
docker push drinkwater/device-service:1.0.0
docker push drinkwater/push-service:1.0.0
docker push drinkwater/water-service:1.0.0
```

### 3. Deploy to Kubernetes

```bash
# Create namespace and ConfigMap
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml

# Create secrets
kubectl apply -f k8s/02-secrets.yaml

# Add APNS certificate (required for push-service)
kubectl create secret generic apns-cert-secret \
  --from-file=PushNotification.p12=/path/to/PushNotification.p12 \
  --from-literal=cert-password=sandycorolla \
  -n drinkwater

# Deploy services
kubectl apply -f k8s/10-device-service.yaml
kubectl apply -f k8s/20-push-service.yaml
kubectl apply -f k8s/30-water-service.yaml
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n drinkwater

# Check services
kubectl get services -n drinkwater

# Check logs
kubectl logs -f deployment/device-service -n drinkwater
kubectl logs -f deployment/push-service -n drinkwater
kubectl logs -f deployment/water-service -n drinkwater
```

### 5. Access Services

#### Option A: Single Port (Recommended) - Using NGINX Gateway

All APIs exposed on single port **30080** with path-based routing:

```bash
# Deploy the nginx gateway (included in k8s directory)
kubectl apply -f k8s/50-nginx-gateway.yaml

# Access all services on localhost:30080
# Device Service:   http://localhost:30080/api/devices/*
# Push Service:     http://localhost:30080/api/push-notifications/*
# Water Service:    http://localhost:30080/api/water/*

# Test examples:
curl http://localhost:30080/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{"deviceIdentifier":"test","pushToken":"token","storeId":"s1"}'

curl http://localhost:30080/api/water/intake \
  -H "Content-Type: application/json" \
  -d '{"deviceIdentifier":"test","amount":250}'

curl http://localhost:30080/api/water/reminder/test
```

#### Option B: Multiple Ports - Individual Port Forwarding

```bash
# Port forward each service to different localhost ports
kubectl port-forward service/device-service 8081:8081 -n drinkwater &
kubectl port-forward service/push-service 8082:8082 -n drinkwater &
kubectl port-forward service/water-service 8083:8083 -n drinkwater &
```

#### Option C: Cloud Deployment with LoadBalancer

```bash
# Change nginx-gateway to LoadBalancer for cloud deployments
kubectl patch service nginx-gateway -n drinkwater -p '{"spec":{"type":"LoadBalancer"}}'
```

## Configuration

### APNS Certificate (Required)

The push-service requires an APNS certificate for sending push notifications.

**Option 1: Using p12 file (Certificate-based)**

```bash
# Create secret with p12 file
kubectl create secret generic apns-cert-secret \
  --from-file=PushNotification.p12=/path/to/PushNotification.p12 \
  --from-literal=cert-password=your-password \
  -n drinkwater

# Update ConfigMap to use certificate auth
kubectl set env configmap/drinkwater-config PUSH_APNS_TOKEN_ENABLED="false" -n drinkwater
```

**Option 2: Using p8 file (Token-based)**

```bash
# Create secret with p8 file
kubectl create secret generic apns-p8-secret \
  --from-file=AuthKey.p8=/path/to/AuthKey.p8 \
  -n drinkwater

# Update ConfigMap to use token auth
kubectl set env configmap/drinkwater-config PUSH_APNS_TOKEN_ENABLED="true" -n drinkwater

# Update secret with key-id and team-id
kubectl patch secret apns-p8-secret -n drinkwater --type='json' -p='[
  {"op": "add", "path": "/stringData/key-id", "value": "YOUR_KEY_ID"},
  {"op": "add", "path": "/stringData/team-id", "value": "YOUR_TEAM_ID"}
]'
```

## Inter-Service Communication

Services communicate using Kubernetes DNS names:

- **device-service**: `http://device-service:8081`
- **push-service**: `http://push-service:8082`
- **water-service**: `http://water-service:8083`

These URLs are configured in the `drinkwater-config` ConfigMap.

## Scaling

```bash
# Scale device-service to 3 replicas
kubectl scale deployment device-service --replicas=3 -n drinkwater

# Scale push-service to 3 replicas
kubectl scale deployment push-service --replicas=3 -n drinkwater

# Scale water-service to 3 replicas
kubectl scale deployment water-service --replicas=3 -n drinkwater
```

## Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/

# Or delete namespace (removes everything)
kubectl delete namespace drinkwater
```

## Troubleshooting

### Pod not starting

```bash
# Check pod status
kubectl describe pod -l app=device-service -n drinkwater

# Check logs
kubectl logs -l app=device-service -n drinkwater --tail=50
```

### Service not accessible

```bash
# Check endpoints
kubectl get endpoints device-service -n drinkwater

# Check service
kubectl describe service device-service -n drinkwater
```

### APNS connection issues

Check that the certificate secret is mounted correctly:

```bash
# Exec into push-service pod
kubectl exec -it deployment/push-service -n drinkwater -- /bin/sh

# Check certificate exists
ls -la /app/certs/
```

## Kafka UI

Deploy Kafka UI to browse topics and messages:

```bash
# Deploy Kafka UI
kubectl apply -f k8s/65-kafka-ui.yaml

# Access Kafka UI at http://localhost:30081
```

Features:
- View all Kafka topics (`device-registered`, `water-intake-recorded`, `hydration-reminder`)
- Browse messages in real-time
- See consumer groups and lag
- Monitor Kafka cluster health
