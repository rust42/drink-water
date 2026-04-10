#!/bin/bash

# Drink Water Microservices Docker Build Script
# Builds and pushes all Docker images to GitHub Container Registry
# Usage: ./build-gcr.sh [github-username]

set -e

# Configuration
GITHUB_USERNAME="${1:-your-github-username}"
REGISTRY="ghcr.io"
DOCKER_REGISTRY="${REGISTRY}/${GITHUB_USERNAME}"
VERSION="latest"

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

# Login to GitHub Container Registry
login_to_registry() {
    log_info "Logging in to GitHub Container Registry..."
    
    if echo "${GITHUB_TOKEN}" | docker login ${REGISTRY} --username ${GITHUB_USERNAME} --password-stdin 2>/dev/null; then
        log_success "Successfully logged in to GitHub Container Registry"
    else
        log_error "Failed to login to GitHub Container Registry"
        log_info "Please set GITHUB_TOKEN environment variable with a GitHub personal access token"
        log_info "Create a token at: https://github.com/settings/tokens"
        log_info "Required scopes: write:packages, read:packages"
        exit 1
    fi
}

# Build and push docs-aggregator
build_docs_aggregator() {
    log_info "Building docs-aggregator..."
    
    cd docs-aggregator
    docker build -t ${DOCKER_REGISTRY}/docs-aggregator:${VERSION} .
    docker push ${DOCKER_REGISTRY}/docs-aggregator:${VERSION}
    cd ..
    
    log_success "docs-aggregator built and pushed"
}

# Build and push device-service
build_device_service() {
    log_info "Building device-service..."
    
    # Build the JAR first
    ./gradlew :shared:jar :device-service:jar -x ktlintCheck
    
    # Build Docker image
    docker build -t ${DOCKER_REGISTRY}/device-service:${VERSION} -f device-service/Dockerfile .
    docker push ${DOCKER_REGISTRY}/device-service:${VERSION}
    
    log_success "device-service built and pushed"
}

# Build and push push-service
build_push_service() {
    log_info "Building push-service..."
    
    # Build the JAR first
    ./gradlew :shared:jar :push-service:jar -x ktlintCheck
    
    # Build Docker image
    docker build -t ${DOCKER_REGISTRY}/push-service:${VERSION} -f push-service/Dockerfile .
    docker push ${DOCKER_REGISTRY}/push-service:${VERSION}
    
    log_success "push-service built and pushed"
}

# Build and push water-service
build_water_service() {
    log_info "Building water-service..."
    
    # Build the JAR first
    ./gradlew :shared:jar :water-service:jar -x ktlintCheck
    
    # Build Docker image
    docker build -t ${DOCKER_REGISTRY}/water-service:${VERSION} -f water-service/Dockerfile .
    docker push ${DOCKER_REGISTRY}/water-service:${VERSION}
    
    log_success "water-service built and pushed"
}

# Build and push frontend
build_frontend() {
    log_info "Building frontend..."
    
    cd frontend
    docker build -t ${DOCKER_REGISTRY}/frontend:1.2.1 .
    docker push ${DOCKER_REGISTRY}/frontend:1.2.1
    cd ..
    
    log_success "frontend built and pushed"
}

# Build and push nginx-gateway
build_nginx_gateway() {
    log_info "Building nginx-gateway..."
    
    docker build -t ${DOCKER_REGISTRY}/nginx-gateway:${VERSION} -f nginx-gateway/Dockerfile .
    docker push ${DOCKER_REGISTRY}/nginx-gateway:${VERSION}
    
    log_success "nginx-gateway built and pushed"
}

# Show built images
show_images() {
    log_success "All images built and pushed successfully!"
    echo
    echo "=== Built Images ==="
    echo "${DOCKER_REGISTRY}/docs-aggregator:${VERSION}"
    echo "${DOCKER_REGISTRY}/device-service:${VERSION}"
    echo "${DOCKER_REGISTRY}/push-service:${VERSION}"
    echo "${DOCKER_REGISTRY}/water-service:${VERSION}"
    echo "${DOCKER_REGISTRY}/frontend:1.2.1"
    echo "${DOCKER_REGISTRY}/nginx-gateway:${VERSION}"
    echo
    echo "=== Next Steps ==="
    echo "1. Deploy to Kubernetes: ./deploy-gcr.sh ${GITHUB_USERNAME}"
    echo "2. Access the application at: http://localhost"
    echo "3. API Documentation: http://localhost/api-docs/"
}

# Main build function
main() {
    echo "=== Drink Water Microservices Build ==="
    echo "Building for GitHub Container Registry: ${DOCKER_REGISTRY}"
    echo "Version: ${VERSION}"
    echo
    
    # Check prerequisites
    check_docker
    
    # Login to registry
    if [ -z "${GITHUB_TOKEN}" ]; then
        log_error "GITHUB_TOKEN environment variable is not set"
        log_info "Please set GITHUB_TOKEN with a GitHub personal access token"
        log_info "Create a token at: https://github.com/settings/tokens"
        log_info "Required scopes: write:packages, read:packages"
        exit 1
    fi
    
    login_to_registry
    
    # Build all images
    build_docs_aggregator
    build_device_service
    build_push_service
    build_water_service
    build_frontend
    build_nginx_gateway
    
    show_images
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [github-username]"
        echo "Example: $0 mygithubuser"
        echo
        echo "This script builds and pushes all Docker images to GitHub Container Registry."
        echo "Make sure you have:"
        echo "1. Docker daemon running"
        echo "2. GITHUB_TOKEN environment variable set with GitHub personal access token"
        echo "3. Token scopes: write:packages, read:packages"
        echo
        echo "Environment Variables:"
        echo "  GITHUB_TOKEN: GitHub personal access token"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
