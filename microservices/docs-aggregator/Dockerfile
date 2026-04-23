# Stage 1: Install dependencies on the host's native platform.
# --platform=$BUILDPLATFORM pins this stage to amd64 on GHA runners, avoiding the
# QEMU arm64 emulation crash (signal 4 / illegal instruction) during npm install.
# Note: node_modules copied below must be pure-JS (no native C++ addons). If a
# native addon is ever added, switch to a native arm64 runner instead.
FROM --platform=$BUILDPLATFORM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --omit=optional && npm cache clean --force

# Stage 2: Runtime image built for the actual target platform (amd64 & arm64).
FROM node:20-alpine

WORKDIR /app

# Copy installed dependencies from the native-platform build stage
COPY --from=deps /app/node_modules ./node_modules

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
