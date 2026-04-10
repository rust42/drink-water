#!/bin/bash

# Drink Water Microservices Deployment Script
# Uses GitHub Container Registry for Docker images
# Usage: ./deploy-gcr.sh [github-username]

set -e

# Configuration
GITHUB_USERNAME="${1:-your-github-username}"
NAMESPACE="drinkwater"
REGISTRY="ghcr.io"
DOCKER_REGISTRY="${REGISTRY}/${GITHUB_USERNAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Kubernetes cluster is accessible"
}

# Check if docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Cannot connect to Docker daemon"
        exit 1
    fi
    
    log_success "Docker daemon is accessible"
}

# Create namespace if it doesn't exist
create_namespace() {
    log_info "Creating namespace: ${NAMESPACE}"
    
    if kubectl get namespace ${NAMESPACE} &> /dev/null; then
        log_warning "Namespace ${NAMESPACE} already exists"
    else
        kubectl create namespace ${NAMESPACE}
        log_success "Namespace ${NAMESPACE} created"
    fi
}

# Apply ConfigMaps and Secrets
apply_configmaps() {
    log_info "Applying ConfigMaps and Secrets"
    
    # Apply ConfigMaps
    kubectl apply -f k8s/00-configmap.yaml -n ${NAMESPACE}
    kubectl apply -f k8s/01-configmap.yaml -n ${NAMESPACE}
    kubectl apply -f k8s/01-secret.yaml -n ${NAMESPACE}
    
    log_success "ConfigMaps and Secrets applied"
}

# Deploy Kafka (if needed)
deploy_kafka() {
    log_info "Deploying Kafka services"
    
    # Check if Kafka is already deployed
    if kubectl get statefulset kafka -n ${NAMESPACE} &> /dev/null; then
        log_warning "Kafka is already deployed"
    else
        kubectl apply -f k8s/10-kafka.yaml -n ${NAMESPACE}
        kubectl apply -f k8s/11-kafka-ui.yaml -n ${NAMESPACE}
        
        log_info "Waiting for Kafka to be ready..."
        kubectl wait --for=condition=ready pod -l app=kafka -n ${NAMESPACE} --timeout=300s
        log_success "Kafka deployed and ready"
    fi
}

# Deploy microservices with GitHub Container Registry images
deploy_microservices() {
    log_info "Deploying microservices with GitHub Container Registry images"
    
    # Update image references in YAML files to use GitHub Container Registry
    log_info "Updating image references to use ${DOCKER_REGISTRY}"
    
    # Deploy docs-aggregator
    log_info "Deploying docs-aggregator"
    sed "s|drinkwater/docs-aggregator:latest|${DOCKER_REGISTRY}/docs-aggregator:latest|g" k8s/04-docs-aggregator.yaml | kubectl apply -f - -n ${NAMESPACE}
    
    # Deploy device-service
    log_info "Deploying device-service"
    sed "s|drinkwater/device-service:latest|${DOCKER_REGISTRY}/device-service:latest|g" k8s/02-device-service.yaml | kubectl apply -f - -n ${NAMESPACE}
    
    # Deploy push-service
    log_info "Deploying push-service"
    sed "s|drinkwater/push-service:latest|${DOCKER_REGISTRY}/push-service:latest|g" k8s/03-push-service.yaml | kubectl apply -f - -n ${NAMESPACE}
    
    # Deploy water-service
    log_info "Deploying water-service"
    sed "s|drinkwater/water-service:latest|${DOCKER_REGISTRY}/water-service:latest|g" k8s/06-water-service.yaml | kubectl apply -f - -n ${NAMESPACE}
    
    # Deploy frontend
    log_info "Deploying frontend"
    sed "s|drinkwater/frontend:1.2.1|${DOCKER_REGISTRY}/frontend:1.2.1|g" k8s/05-frontend.yaml | kubectl apply -f - -n ${NAMESPACE}
    
    # Deploy nginx-gateway
    log_info "Deploying nginx-gateway"
    sed "s|nginx:alpine|${DOCKER_REGISTRY}/nginx-gateway:latest|g" k8s/50-nginx-gateway.yaml | kubectl apply -f - -n ${NAMESPACE}
    
    log_success "All microservices deployed"
}

# Wait for deployments to be ready
wait_for_deployments() {
    log_info "Waiting for all deployments to be ready..."
    
    # List of deployments to wait for
    deployments=("docs-aggregator" "device-service" "push-service" "water-service" "frontend" "nginx-gateway")
    
    for deployment in "${deployments[@]}"; do
        log_info "Waiting for ${deployment} to be ready..."
        kubectl rollout status deployment/${deployment} -n ${NAMESPACE} --timeout=300s
    done
    
    # Wait for Kafka StatefulSet
    if kubectl get statefulset kafka -n ${NAMESPACE} &> /dev/null; then
        log_info "Waiting for Kafka to be ready..."
        kubectl wait --for=condition=ready pod -l app=kafka -n ${NAMESPACE} --timeout=300s
    fi
    
    log_success "All deployments are ready"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check pods
    log_info "Checking pod status:"
    kubectl get pods -n ${NAMESPACE}
    
    # Check services
    log_info "Checking services:"
    kubectl get services -n ${NAMESPACE}
    
    # Test API endpoints
    log_info "Testing API endpoints..."
    
    # Wait a bit for services to be fully ready
    sleep 10
    
    # Test device service
    if curl -f -s http://localhost/api/devices &> /dev/null; then
        log_success "Device service API is accessible"
    else
        log_warning "Device service API not yet accessible"
    fi
    
    # Test water service
    if curl -f -s http://localhost/api/water/intake/test/today &> /dev/null; then
        log_success "Water service API is accessible"
    else
        log_warning "Water service API not yet accessible"
    fi
    
    # Test Swagger UI
    if curl -f -s http://localhost/api-docs/ &> /dev/null; then
        log_success "Swagger UI is accessible"
    else
        log_warning "Swagger UI not yet accessible"
    fi
    
    # Test frontend
    if curl -f -s http://localhost/ &> /dev/null; then
        log_success "Frontend is accessible"
    else
        log_warning "Frontend not yet accessible"
    fi
}

# Show access information
show_access_info() {
    log_success "Deployment completed successfully!"
    echo
    echo "=== Access Information ==="
    echo "Frontend: http://localhost"
    echo "API Documentation: http://localhost/api-docs/"
    echo "Device API: http://localhost/api/devices"
    echo "Water API: http://localhost/api/water/"
    echo "Push API: http://localhost/api/push-notifications/"
    echo "Kafka UI: http://localhost:30081"
    echo
    echo "=== Kubernetes Commands ==="
    echo "View pods: kubectl get pods -n ${NAMESPACE}"
    echo "View services: kubectl get services -n ${NAMESPACE}"
    echo "View logs: kubectl logs -n ${NAMESPACE} <pod-name>"
    echo "Port forward: kubectl port-forward -n ${NAMESPACE} <pod-name> 8080:8080"
    echo
    echo "=== GitHub Container Registry Images Used ==="
    echo "${DOCKER_REGISTRY}/docs-aggregator:latest"
    echo "${DOCKER_REGISTRY}/device-service:latest"
    echo "${DOCKER_REGISTRY}/push-service:latest"
    echo "${DOCKER_REGISTRY}/water-service:latest"
    echo "${DOCKER_REGISTRY}/frontend:1.2.1"
    echo "${DOCKER_REGISTRY}/nginx-gateway:latest"
}

# Main deployment function
main() {
    echo "=== Drink Water Microservices Deployment ==="
    echo "Using GitHub Container Registry: ${DOCKER_REGISTRY}"
    echo "Namespace: ${NAMESPACE}"
    echo
    
    # Check prerequisites
    check_kubectl
    check_docker
    
    # Deploy components
    create_namespace
    apply_configmaps
    deploy_kafka
    deploy_microservices
    wait_for_deployments
    verify_deployment
    show_access_info
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [github-username]"
        echo "Example: $0 mygithubuser"
        echo
        echo "This script deploys the Drink Water microservices using GitHub Container Registry images."
        echo "Make sure you have:"
        echo "1. kubectl configured to access your Kubernetes cluster"
        echo "2. Docker daemon running"
        echo "3. GitHub Container Registry with the required images"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
