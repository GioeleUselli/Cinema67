# ============================================================================
# CineBase.Web Dockerfile - Multistage Build with Nginx
# ============================================================================
# Build Stage: SDK - compile and publish static files
# Runtime Stage: nginx alpine - serve static files + reverse proxy
#
# Target Image Size: < 50MB
# User: nginx (non-root, default nginx user in alpine)
# ============================================================================

# ============================================================================
# STAGE 1: BUILDER
# ============================================================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS builder

WORKDIR /src

# Copy project file
COPY CineBase.Web/*.csproj ./

# Restore NuGet dependencies
RUN dotnet restore

# Copy source code
COPY CineBase.Web .

# Build and publish Release configuration (static files only)
RUN dotnet publish -c Release -o /app/publish --no-restore

# ============================================================================
# STAGE 2: RUNTIME
# ============================================================================
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy published static files from builder
COPY --from=builder /app/publish/wwwroot /var/www/cinebase

# Create nginx cache directory
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/www/cinebase

# nginx runs as 'nginx' user by default (non-root)
# No need to explicitly switch user

EXPOSE 80

# Health check configuration
# Verifies nginx is responding to requests
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
