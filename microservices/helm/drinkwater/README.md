# Drink Water Helm Chart

A Helm chart for deploying the Drink Water microservices architecture with Kafka on Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- Docker images available in your registry

## Installation

### From Local Directory

```bash
cd /Users/sandeep/Documents/Drink\ Water/microservices/helm/drinkwater
helm install drinkwater .
```

### Upgrade

```bash
helm upgrade drinkwater .
```

### Uninstall

```bash
helm uninstall drinkwater
```

## Configuration

The following table lists the configurable parameters and their default values:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `namespace` | Namespace for deployment | `drinkwater` |
| `image.registry` | Docker registry | `docker.io` |
| `image.repository` | Image repository | `drinkwater` |
| `image.tag` | Image tag | `1.0.1` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Kafka Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `kafka.enabled` | Enable Kafka | `true` |
| `kafka.image` | Kafka image | `confluentinc/cp-kafka:7.5.0` |
| `kafka.replicas` | Kafka replicas | `1` |
| `kafka.resources.requests.memory` | Memory request | `1Gi` |
| `kafka.resources.limits.memory` | Memory limit | `2Gi` |

### Microservices Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `deviceService.enabled` | Enable device service | `true` |
| `deviceService.replicaCount` | Device service replicas | `1` |
| `deviceService.port` | Device service port | `8081` |
| `pushService.enabled` | Enable push service | `true` |
| `pushService.replicaCount` | Push service replicas | `1` |
| `pushService.port` | Push service port | `8082` |
| `waterService.enabled` | Enable water service | `true` |
| `waterService.replicaCount` | Water service replicas | `1` |
| `waterService.port` | Water service port | `8083` |

### Gateway Configuration (Single Port Access)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `gateway.enabled` | Enable NGINX gateway | `true` |
| `gateway.service.type` | Service type (NodePort/LoadBalancer) | `NodePort` |
| `gateway.service.nodePort` | NodePort for local access | `30080` |

### Kafka UI Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `kafkaUi.enabled` | Enable Kafka UI | `true` |
| `kafkaUi.service.nodePort` | NodePort for Kafka UI | `30081` |

## Custom Values

Create a `custom-values.yaml` file:

```yaml
# Use a different image tag
image:
  tag: "1.0.2"

# Increase replicas
pushService:
  replicaCount: 2
  resources:
    limits:
      memory: 1Gi

# Change namespace
namespace: production
```

Install with custom values:

```bash
helm install drinkwater . -f custom-values.yaml
```

## Testing

After deployment, access all APIs on single port **30080**:

```bash
# Register a device
curl -X POST http://localhost:30080/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{"deviceIdentifier": "test-device", "pushToken": "test-token", "storeId": "store-1"}'

# Record water intake (triggers Kafka event)
curl -X POST http://localhost:30080/api/water/intake \
  -H "Content-Type: application/json" \
  -d '{"deviceIdentifier": "test-device", "amount": 250}'

# Send hydration reminder (triggers push notification via Kafka)
curl -X POST http://localhost:30080/api/water/reminder/test-device
```

### Alternative: Individual Port Forwarding

If gateway is disabled, use individual port forwards:

```bash
kubectl port-forward -n drinkwater svc/device-service 8081:8081 &
kubectl port-forward -n drinkwater svc/push-service 8082:8082 &
kubectl port-forward -n drinkwater svc/water-service 8083:8083 &
```

## Architecture

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────────┐
│ Device Service  │────▶│  Kafka      │◄────│  Push Service   │
│   (Port 8081)   │     │  (KRaft)    │     │   (Port 8082)   │
└─────────────────┘     └─────────────┘     └─────────────────┘
         │                                              │
         │              ┌─────────────┐                 │
         └─────────────▶│ Water       │◄────────────────┘
                        │ Service     │
                        │ (Port 8083) │
                        └─────────────┘
```

### Kafka UI

Browse Kafka topics and messages at: **http://localhost:30081**

Features:
- View all Kafka topics
- Browse messages in each topic
- See consumer groups and lag
- Monitor Kafka cluster health

## Troubleshooting

Check pod status:
```bash
kubectl get pods -n drinkwater
```

View logs:
```bash
kubectl logs -n drinkwater deployment/device-service
kubectl logs -n drinkwater deployment/push-service
kubectl logs -n drinkwater deployment/water-service
kubectl logs -n drinkwater statefulset/kafka
```

## License

MIT
