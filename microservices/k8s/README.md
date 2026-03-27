# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Drink Water microservices.

## Architecture

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

## Files

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

For local testing with minikube/kind:

```bash
# Port forward to access from localhost
kubectl port-forward service/device-service 8081:8081 -n drinkwater &
kubectl port-forward service/push-service 8082:8082 -n drinkwater &
kubectl port-forward service/water-service 8083:8083 -n drinkwater &
```

For production with LoadBalancer:

```bash
# Change service type to LoadBalancer in YAML files or patch
kubectl patch service device-service -n drinkwater -p '{"spec":{"type":"LoadBalancer"}}'
kubectl patch service push-service -n drinkwater -p '{"spec":{"type":"LoadBalancer"}}'
kubectl patch service water-service -n drinkwater -p '{"spec":{"type":"LoadBalancer"}}'
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
