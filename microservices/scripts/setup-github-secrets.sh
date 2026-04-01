#!/bin/bash
# Helper script to setup GitHub Actions secrets
# Usage: ./setup-github-secrets.sh <github-repo>

set -e

REPO=${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}

echo "Setting up secrets for repository: $REPO"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: kubectl is not configured or cluster is not accessible"
    exit 1
fi

# Get kubeconfig and encode it
KUBECONFIG_PATH="${KUBECONFIG:-$HOME/.kube/config}"
if [ ! -f "$KUBECONFIG_PATH" ]; then
    echo "Error: kubeconfig not found at $KUBECONFIG_PATH"
    exit 1
fi

echo "Encoding kubeconfig from $KUBECONFIG_PATH..."
KUBECONFIG_B64=$(base64 < "$KUBECONFIG_PATH")

# Set the secret
echo "Setting KUBECONFIG secret in GitHub..."
echo "$KUBECONFIG_B64" | gh secret set KUBECONFIG --repo="$REPO" --body="$KUBECONFIG_B64"

echo "✅ Secrets configured successfully!"
echo ""
echo "You can verify with:"
echo "  gh secret list --repo=$REPO"
