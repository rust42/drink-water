FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -S drinkwater && adduser -S drinkwater -G drinkwater

# Set permissions
RUN chown -R drinkwater:drinkwater /var/cache/nginx && \
    chown -R drinkwater:drinkwater /var/log/nginx && \
    chown -R drinkwater:drinkwater /etc/nginx/conf.d && \
    mkdir -p /tmp && chown drinkwater:drinkwater /tmp

# Switch to non-root user
USER drinkwater

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
