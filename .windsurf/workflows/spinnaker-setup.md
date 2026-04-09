---
description: How to set up Spinnaker CD for local Kubernetes deployment
---

# Spinnaker Local Setup Guide

## Overview
Spinnaker is a multi-cloud continuous delivery platform. This guide sets it up for local Kubernetes (OrbStack/k3d/kind/minikube).

## Prerequisites
- Kubernetes cluster running locally
- kubectl configured
- Helm 3 installed
- At least 8GB RAM available for Spinnaker

## Option 1: Quick Setup with Helm (Recommended)

### Step 1: Add Spinnaker Helm Repository

```bash
helm repo add spinnaker https://charts.helm.sh/stable
helm repo add minio https://charts.min.io/
helm repo update
```

### Step 2: Install MinIO for Artifact Storage

Spinnaker needs S3-compatible storage for artifacts and pipeline configs.

```bash
kubectl create namespace spinnaker

helm install minio minio/minio \
  --namespace spinnaker \
  --set accessKey=spinnaker \
  --set secretKey=spinnaker123 \
  --set persistence.enabled=true \
  --set persistence.size=10Gi \
  --set resources.requests.memory=512Mi
```

Create a bucket for Spinnaker:
```bash
kubectl port-forward -n spinnaker svc/minio 9000:9000 &
sleep 3

# Install MinIO client
brew install minio-mc  # macOS

# Configure mc
mc alias set local http://localhost:9000 spinnaker spinnaker123

# Create bucket
mc mb local/spinnaker
```

### Step 3: Install Spinnaker

Create values file `spinnaker-values.yaml`:

```yaml
minio:
  enabled: false  # We installed it separately

halyard:
  spinnakerVersion: 1.32.0
  additionalServiceSettings:
    clouddriver:
      kubernetes:
        enabled: true
    deck:
      settings-local.js: |
        window.spinnakerSettings.authEnabled = false;

# Enable Kubernetes provider
kubeConfig:
  enabled: true
  context: orbstack  # or your kubectl context name

# Docker registry configuration
dockerRegistries:
  - name: ghcr
    address: ghcr.io
    username: YOUR_GITHUB_USERNAME
    password: YOUR_GITHUB_TOKEN
    email: your@email.com
  - name: local
    address: docker.io
    username: ""
    password: ""

# S3/MinIO storage
s3:
  enabled: true
  bucket: spinnaker
  endpoint: http://minio:9000
  accessKey: spinnaker
  secretKey: spinnaker123
  pathStyleAccess: true

# Resource limits for local development
spin-clouddriver:
  resources:
    requests:
      memory: 1Gi
      cpu: 500m
    limits:
      memory: 2Gi
      cpu: 1000m

spin-deck:
  resources:
    requests:
      memory: 256Mi
    limits:
      memory: 512Mi

spin-gate:
  resources:
    requests:
      memory: 256Mi
    limits:
      memory: 512Mi

spin-orca:
  resources:
    requests:
      memory: 512Mi
    limits:
      memory: 1Gi

spin-front50:
  resources:
    requests:
      memory: 256Mi
    limits:
      memory: 512Mi

spin-echo:
  resources:
    requests:
      memory: 256Mi
    limits:
      memory: 512Mi

spin-rosco:
  resources:
    requests:
      memory: 256Mi
    limits:
      memory: 512Mi
```

Install Spinnaker:
```bash
helm install spinnaker spinnaker/spinnaker \
  --namespace spinnaker \
  --values spinnaker-values.yaml \
  --timeout 10m
```

## Option 2: Armory Operator (Production-Ready)

### Step 1: Install Armory Operator

```bash
kubectl create namespace spinnaker
kubectl apply -k "https://github.com/armory/spinnaker-operator/deploy/operator/cluster?ref=v1.7.5"
```

### Step 2: Create SpinnakerService Manifest

Create `spinnaker-service.yaml`:

```yaml
apiVersion: spinnaker.armory.io/v1alpha2
kind: SpinnakerService
metadata:
  name: spinnaker
  namespace: spinnaker
spec:
  spinnakerConfig:
    config:
      version: 1.32.0
      
      persistentStorage:
        persistentStoreType: s3
        s3:
          bucket: spinnaker
          rootFolder: front50
          region: us-east-1
          endpoint: http://minio:9000
          accessKeyId: spinnaker
          secretAccessKey: spinnaker123
          pathStyleAccess: true
      
      providers:
        kubernetes:
          enabled: true
          accounts:
            - name: local-k8s
              providerVersion: V2
              kubeconfigFile: /home/spinnaker/.kube/config
              namespaces:
                - drinkwater
                - monitoring
              omitNamespaces: []
              dockerRegistries: []
              context: orbstack
              configureImagePullSecrets: true
              serviceAccount: false
              cacheThreads: 1
              liveManifestCalls: false
              oAuthScopes: []
              onlySpinnakerManaged: false
      
      artifacts:
        s3:
          enabled: true
          accounts:
            - name: minio-artifacts
              apiEndpoint: http://minio:9000
              apiRegion: us-east-1
              awsAccessKeyId: spinnaker
              awsSecretAccessKey: spinnaker123
      
      dockerRegistry:
        enabled: true
        accounts:
          - name: ghcr
            address: ghcr.io
            username: YOUR_GITHUB_USERNAME
            password: YOUR_GITHUB_TOKEN
            email: your@email.com
            cacheIntervalSecs: 300
          - name: local-dockerhub
            address: index.docker.io
            repositories:
              - library/nginx
```

Apply it:
```bash
kubectl apply -f spinnaker-service.yaml
```

## Accessing Spinnaker

### Port Forward (Local Access)

```bash
# Deck (UI)
kubectl port-forward -n spinnaker svc/spin-deck 9000:9000 &

# Gate (API)
kubectl port-forward -n spinnaker svc/spin-gate 8084:8084 &

# Open browser
echo "http://localhost:9000"
```

### Or Configure Ingress

Create `spinnaker-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: spinnaker
  namespace: spinnaker
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  rules:
    - host: spinnaker.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: spin-deck
                port:
                  number: 9000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: spinnaker-gate
  namespace: spinnaker
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  rules:
    - host: gate.spinnaker.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: spin-gate
                port:
                  number: 8084
```

Add to `/etc/hosts`:
```
192.168.139.2 spinnaker.local gate.spinnaker.local
```

## Creating Deployment Pipelines

### Example: Deploy Frontend Service

1. **Create Application**: Go to Applications → Create Application
   - Name: `drink-water`
   - Email: your@email.com
   - Repo Type: GitHub
   - Repo Project: your-org
   - Repo Name: drink-water

2. **Create Pipeline**: drinkwater-frontend-deploy

Pipeline stages:
1. **Configuration**: Trigger on Docker image tag `latest`
2. **Find Artifact**: Find image `ghcr.io/YOUR_ORG/frontend:latest`
3. **Deploy**: Deploy to Kubernetes (drinkwater namespace)

```json
{
  "application": "drink-water",
  "name": "deploy-frontend",
  "stages": [
    {
      "type": "deployManifest",
      "name": "Deploy Frontend",
      "namespace": "drinkwater",
      "manifest": {
        "apiVersion": "apps/v1",
        "kind": "Deployment",
        "metadata": {
          "name": "frontend"
        },
        "spec": {
          "template": {
            "spec": {
              "containers": [
                {
                  "name": "frontend",
                  "image": "${trigger.artifacts[0].reference}"
                }
              ]
            }
          }
        }
      }
    }
  ]
}
```

## Halyard Commands (Advanced)

If using Halyard directly:

```bash
# Enter Halyard container
kubectl exec -n spinnaker -it deploy/spinnaker-halyard -- bash

# Configure Kubernetes
hal config provider kubernetes enable
hal config provider kubernetes account add local-k8s \
  --provider-version v2 \
  --kubeconfig-file /home/spinnaker/.kube/config \
  --context orbstack

# Configure Docker registry
hal config provider docker-registry enable
hal config provider docker-registry account add ghcr \
  --address ghcr.io \
  --username YOUR_GITHUB_USERNAME \
  --password YOUR_GITHUB_TOKEN

# Configure S3/MinIO storage
hal config storage s3 edit \
  --endpoint http://minio:9000 \
  --access-key-id spinnaker \
  --secret-access-key spinnaker123 \
  --path-style-access true
hal config storage edit --type s3

# Deploy
hal deploy apply
```

## Troubleshooting

### Pods stuck in Pending
- Check resource limits: `kubectl describe pod -n spinnaker <pod-name>`
- Spinnaker needs ~8GB RAM for all services

### Clouddriver can't connect to K8s
- Verify kubeconfig is mounted: `kubectl exec -n spinnaker -it deploy/spin-clouddriver -- cat /home/spinnaker/.kube/config`
- Check context name matches: `kubectl config current-context`

### Artifacts not found
- Verify MinIO is running and bucket exists
- Check S3 credentials in Spinnaker config

### Web UI not loading
- Check deck pod logs: `kubectl logs -n spinnaker -l app=spin-deck`
- Verify gate is accessible: `curl http://localhost:8084/health`

## Next Steps

1. Set up GitHub webhooks for automatic pipeline triggers
2. Configure canary analysis with Prometheus
3. Set up Slack notifications for deployments
4. Create automated rollback pipelines
