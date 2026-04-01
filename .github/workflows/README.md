# GitHub Actions CI/CD Setup

This directory contains GitHub Actions workflows for automated build, test, and deployment of all microservices.

## Workflows

### Frontend CI/CD (`frontend.yml`)

**Service:** React + TypeScript frontend application  
**Port:** 8080 (container), 30090/30091 (NodePort)

**Jobs:**
1. **build-and-test** - ESLint, TypeScript check, build
2. **build-docker** - Multi-platform Docker image to GHCR
3. **deploy-staging** - Auto-deploy to staging on main branch
4. **deploy-production** - Manual production deployment

---

### Backend Services CI/CD

All backend services follow the same pattern:

| Workflow | Service | Port | Description |
|----------|---------|------|-------------|
| `device-service.yml` | Device Service | 8081 | Device registration & management |
| `push-service.yml` | Push Service | 8082 | APNS push notifications |
| `water-service.yml` | Water Service | 8083 | Water intake tracking |

**Triggers:**
- Push to `main`/`master` (when service files change)
- Pull requests to `main`/`master`
- Manual workflow dispatch (staging/production choice)

**Jobs:**
1. **build-and-test**
   - Runs ktlint for code style
   - Runs unit tests
   - Builds JAR with Gradle
   - Uploads artifacts

2. **build-docker**
   - Downloads build artifacts
   - Multi-platform Docker build (linux/amd64, linux/arm64)
   - Pushes to GitHub Container Registry (`ghcr.io`)
   - Tags: branch, PR, SHA, latest, environment

3. **deploy-staging**
   - Runs on pushes to main/master
   - Updates image tag in K8s manifests using Kustomize
   - Deploys to `drinkwater` namespace
   - Waits for rollout
   - Verifies deployment

4. **deploy-production**
   - Manual trigger only
   - Requires staging deployment first
   - Deploys to `drinkwater-prod` namespace

---

## Required Secrets

Configure these in your GitHub repository (Settings > Secrets and variables > Actions):

| Secret | Description | How to obtain |
|--------|-------------|---------------|
| `KUBECONFIG` | Base64-encoded kubeconfig | `cat ~/.kube/config \| base64` |
| `GITHUB_TOKEN` | Auto-provided by GitHub | No action needed |

## Setup Script

Use the helper script to configure secrets:

```bash
./scripts/setup-github-secrets.sh owner/repo
```

## Service URLs

| Service | Staging | Production |
|---------|---------|--------------|
| Frontend | http://localhost:30090 | http://localhost:30091 |
| Device Service | http://localhost:30081 | http://localhost:30081 |
| Push Service | http://localhost:30082 | http://localhost:30082 |
| Water Service | http://localhost:30083 | http://localhost:30083 |

## Local Testing

### Build all services locally:

```bash
# Backend services
./gradlew :device-service:bootJar
./gradlew :push-service:bootJar
./gradlew :water-service:bootJar

# Frontend
cd frontend && npm run build
```

### Build Docker images locally:

```bash
docker build -t drinkwater/device-service:local ./device-service
docker build -t drinkwater/push-service:local ./push-service
docker build -t drinkwater/water-service:local ./water-service
docker build -t drinkwater/frontend:local ./frontend
```

### Test Kustomize build:

```bash
cd k8s
kustomize build . | kubectl apply --dry-run=client -f -
```

## Manual Deployment

```bash
# Update all image tags
cd k8s
kustomize edit set image device-service=ghcr.io/owner/repo/device-service:sha-abc1234
kustomize edit set image push-service=ghcr.io/owner/repo/push-service:sha-abc1234
kustomize edit set image water-service=ghcr.io/owner/repo/water-service:sha-abc1234
kustomize edit set image frontend=ghcr.io/owner/repo/frontend:sha-abc1234

# Apply to cluster
kubectl apply -k . -n drinkwater
```

## Troubleshooting

### Check workflow status
```bash
gh run list --workflow=device-service.yml
gh run watch <run-id>
```

### Pod not starting
```bash
kubectl describe pod -l app=<service-name> -n drinkwater
kubectl logs -l app=<service-name> -n drinkwater --tail=50
```

### Image pull errors
- Verify GHCR package visibility (Settings > Packages)
- Check `imagePullPolicy: Always` is set in manifests
- Ensure `secrets.KUBECONFIG` has correct permissions

### Rollout failures
```bash
kubectl rollout status deployment/<service-name> -n drinkwater
kubectl get events -n drinkwater --field-selector type=Warning
```
