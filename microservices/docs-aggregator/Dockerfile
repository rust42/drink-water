# Single-stage build for docs-aggregator (better for multi-platform)
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with platform-specific optimizations
RUN npm install --only=production --no-optional && npm cache clean --force

# Copy application code
COPY server.js ./

# Create non-root user
RUN addgroup -S drinkwater && adduser -S drinkwater -G drinkwater

# Set permissions
RUN chown -R drinkwater:drinkwater /app

USER drinkwater

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "server.js"]
