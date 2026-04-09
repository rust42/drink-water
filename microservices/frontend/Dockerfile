# Multi-stage build for frontend
FROM node:22-alpine AS builder

# Build arguments for environment variables
ARG VITE_API_BASE_URL

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application (env vars are baked in at build time)
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -S drinkwater && adduser -S drinkwater -G drinkwater

# Set permissions
RUN chown -R drinkwater:drinkwater /usr/share/nginx/html && \
    chown -R drinkwater:drinkwater /var/cache/nginx && \
    chown -R drinkwater:drinkwater /var/log/nginx && \
    chown -R drinkwater:drinkwater /etc/nginx/conf.d

# Update nginx to run as non-root
RUN sed -i 's/user  nginx/user  drinkwater/g' /etc/nginx/nginx.conf && \
    sed -i 's|pid .*|pid /tmp/nginx.pid;|g' /etc/nginx/nginx.conf && \
    mkdir -p /tmp && chown drinkwater:drinkwater /tmp

USER drinkwater

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
