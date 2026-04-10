# Drink Water Microservices - GitHub Container Registry Deployment

This guide explains how to deploy the Drink Water microservices using GitHub Container Registry (GCR) for Docker images.

## Prerequisites

1. **Kubernetes Cluster**
   - kubectl configured to access your cluster
   - Cluster with LoadBalancer support (for external access)

2. **Docker**
   - Docker daemon running
   - Access to build Docker images

3. **GitHub Container Registry**
   - GitHub account with Container Registry enabled
   - Personal Access Token with packages permissions

4. **Required Tools**
   - kubectl
   - docker
   - gradle (for building services)

## Setup GitHub Container Registry

### 1. Create GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set the following scopes:
   - `write:packages` - Push packages
   - `read:packages` - Pull packages
4. Generate token and copy it

### 2. Set Environment Variables

```bash
export GITHUB_USERNAME="your-github-username"
export GITHUB_TOKEN="your-personal-access-token"
```

## Build and Push Images

Use the provided build script to build and push all Docker images to GitHub Container Registry:

```bash
# Make scripts executable
chmod +x build-gcr.sh deploy-gcr.sh

# Build and push all images
./build-gcr.sh $GITHUB_USERNAME
```

The script will build and push the following images:
- `ghcr.io/your-github-username/docs-aggregator:latest`
- `ghcr.io/your-github-username/device-service:latest`
- `ghcr.io/your-github-username/push-service:latest`
- `ghcr.io/your-github-username/water-service:latest`
- `ghcr.io/your-github-username/frontend:1.2.1`
- `ghcr.io/your-github-username/nginx-gateway:latest`

## Deploy to Kubernetes

Use the deployment script to deploy all services to Kubernetes:

```bash
# Deploy all services
./deploy-gcr.sh $GITHUB_USERNAME
```

The script will:
1. Create the `drinkwater` namespace
2. Apply ConfigMaps and Secrets
3. Deploy Kafka (if not already deployed)
4. Deploy all microservices with GCR images
5. Wait for all deployments to be ready
6. Verify the deployment

## Access the Application

Once deployed, you can access the application at:

- **Frontend**: http://localhost
- **API Documentation**: http://localhost/api-docs/
- **Device API**: http://localhost/api/devices
- **Water API**: http://localhost/api/water/
- **Push API**: http://localhost/api/push-notifications/
- **Kafka UI**: http://localhost:30081

## Architecture Overview

```
Internet
    |
    v
Nginx Gateway (NodePort 30080)
    |
    +-- Frontend (React App)
    |
    +-- API Gateway
        |
        +-- Device Service (Spring Boot/Kotlin)
        +-- Push Service (Spring Boot/Kotlin)
        +-- Water Service (Spring Boot/Kotlin)
        +-- Docs Aggregator (Node.js)
        |
        +-- Kafka (Event Streaming)
        +-- Kafka UI (Management)
```

## Service Details

### Frontend
- **Technology**: React + TypeScript + Vite
- **Port**: 8080
- **Features**: Device management, water tracking, real-time updates
- **Image**: `ghcr.io/your-github-username/frontend:1.2.1`

### Device Service
- **Technology**: Spring Boot + Kotlin
- **Port**: 8080
- **Features**: Device registration, management, deactivation
- **Image**: `ghcr.io/your-github-username/device-service:latest`

### Push Service
- **Technology**: Spring Boot + Kotlin
- **Port**: 8080
- **Features**: Push notifications via APNS
- **Image**: `ghcr.io/your-github-username/push-service:latest`

### Water Service
- **Technology**: Spring Boot + Kotlin
- **Port**: 8080
- **Features**: Water intake tracking, hydration reminders
- **Image**: `ghcr.io/your-github-username/water-service:latest`

### Docs Aggregator
- **Technology**: Node.js + Express + Swagger UI
- **Port**: 8080
- **Features**: Aggregated API documentation
- **Image**: `ghcr.io/your-github-username/docs-aggregator:latest`

### Nginx Gateway
- **Technology**: Nginx + Alpine Linux
- **Port**: 80 (NodePort 30080)
- **Features**: Load balancing, API routing, SSL termination
- **Image**: `ghcr.io/your-github-username/nginx-gateway:latest`

## Kubernetes Resources

### Namespaces
- `drinkwater`: Main application namespace

### ConfigMaps
- `drinkwater-config`: Application configuration
- `kafka-config`: Kafka configuration
- `nginx-config`: Nginx configuration

### Secrets
- `kafka-secrets`: Kafka credentials

### Services
- `frontend`: Frontend service (ClusterIP)
- `frontend-lb`: Frontend LoadBalancer
- `device-service`: Device API service
- `push-service`: Push notification service
- `water-service`: Water tracking service
- `docs-aggregator`: API documentation service
- `nginx-gateway`: Main gateway (NodePort 30080)
- `kafka-broker`: Kafka broker service
- `kafka-ui`: Kafka management UI

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n drinkwater
kubectl describe pod <pod-name> -n drinkwater
```

### Check Service Status
```bash
kubectl get services -n drinkwater
kubectl describe service <service-name> -n drinkwater
```

### View Logs
```bash
kubectl logs -n drinkwater <pod-name>
kubectl logs -f -n drinkwater <pod-name>  # Follow logs
```

### Port Forwarding
```bash
kubectl port-forward -n drinkwater <pod-name> 8080:8080
```

### Restart Deployments
```bash
kubectl rollout restart deployment/<deployment-name> -n drinkwater
```

### Check API Endpoints
```bash
# Test device service
curl http://localhost/api/devices

# Test water service
curl http://localhost/api/water/intake/test/today

# Test Swagger UI
curl http://localhost/api-docs/
```

## Development Workflow

### 1. Make Changes
Modify your source code in the respective service directories.

### 2. Build and Push
```bash
./build-gcr.sh $GITHUB_USERNAME
```

### 3. Deploy
```bash
./deploy-gcr.sh $GITHUB_USERNAME
```

### 4. Verify
```bash
kubectl get pods -n drinkwater
curl http://localhost/api-docs/
```

## Environment Variables

### Frontend
- `NODE_ENV`: Environment (production/development)

### Services
- `KAFKA_BOOTSTRAP_SERVERS`: Kafka broker addresses
- `DATABASE_URL`: Database connection string (if applicable)

### GitHub Container Registry
- `GITHUB_USERNAME`: Your GitHub username
- `GITHUB_TOKEN`: Personal access token

## Security Considerations

1. **GitHub Token**: Store your personal access token securely
2. **Network Policies**: Consider adding network policies for production
3. **Resource Limits**: Set appropriate resource requests/limits
4. **RBAC**: Configure role-based access control for production

## Monitoring and Logging

### Health Checks
All services include health check endpoints:
- `/health` or `/actuator/health`

### Metrics
- Spring Boot services include Spring Actuator endpoints
- Consider adding Prometheus/Grafana for production monitoring

### Logs
- Use `kubectl logs` to view service logs
- Consider centralized logging solution for production

## Scaling

### Horizontal Scaling
```bash
kubectl scale deployment/<deployment-name> --replicas=3 -n drinkwater
```

### Resource Management
Update resource requests/limits in YAML files based on your cluster capacity.

## Backup and Recovery

### Data Backup
- Backup Kafka topics if using persistent data
- Backup any external databases
- Export Kubernetes manifests for version control

### Disaster Recovery
- Store Docker images in multiple registries
- Maintain infrastructure as code
- Document recovery procedures
