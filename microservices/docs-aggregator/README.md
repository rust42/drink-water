# API Documentation Aggregator

A centralized documentation service that aggregates Swagger/OpenAPI specifications from all Drink Water microservices.

## Features

- **Unified API Documentation**: Single Swagger UI for all microservices
- **Real-time Aggregation**: Fetches OpenAPI specs from each service dynamically
- **Try-it-out Functionality**: Test APIs directly from the documentation UI
- **Multi-service Support**: Aggregates specs from:
  - Device Service (device management)
  - Push Service (push notifications)
  - Water Service (water intake tracking)

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Swagger UI with all aggregated APIs |
| `/api-docs` | Redirect to Swagger UI |
| `/api-docs/openapi.json` | Aggregated OpenAPI spec (JSON) |
| `/api-docs/{service}/openapi.json` | Individual service spec |
| `/health` | Health check endpoint |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `DEVICE_SERVICE_URL` | `http://device-service:8080` | Device service endpoint |
| `PUSH_SERVICE_URL` | `http://push-service:8080` | Push service endpoint |
| `WATER_SERVICE_URL` | `http://water-service:8080` | Water service endpoint |

## Usage

### Local Development

```bash
# Install dependencies
npm install

# Run the service
npm start

# Access Swagger UI
open http://localhost:8080
```

### Docker

```bash
# Build image
docker build -t drinkwater/docs-aggregator .

# Run container
docker run -p 8085:8080 drinkwater/docs-aggregator
```

### Kubernetes

```bash
# Deploy to cluster
kubectl apply -f k8s/04-docs-aggregator.yaml

# Access via NodePort
open http://localhost:30085

# Or via nginx gateway
open http://localhost:30080/api-docs
```

## Architecture

```
┌─────────────────┐
│  Swagger UI     │
│  (Docs Aggregator)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────┐  ┌──────┐
│Device│  │ Push │  │Water │
│Service│  │Service│  │Service│
│/v3/api│  │/v3/api│  │/v3/api│
│-docs  │  │-docs  │  │-docs  │
└──────┘  └──────┘  └──────┘
```

## How It Works

1. Each Spring Boot service exposes OpenAPI spec at `/v3/api-docs` via SpringDoc
2. Docs Aggregator fetches specs from all services on-demand
3. Specs are merged into a single OpenAPI document with service tags
4. Swagger UI displays all APIs with try-it-out functionality

## Troubleshooting

**Specs not loading:**
- Check service health: `kubectl get pods`
- Verify service URLs are correct
- Check network connectivity between pods

**Try-it-out not working:**
- Ensure nginx gateway is configured to route API requests
- Check CORS settings if accessing from different origin
