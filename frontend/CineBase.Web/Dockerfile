# ============================================================================
# Cinema67.Web Dockerfile - Multistage Build with Nginx
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

# Clear NuGet config to remove Windows-specific paths
RUN rm -rf ~/.nuget/NuGet/NuGet.Config 2>/dev/null || true && \
    rm -rf ~/.nuget ~/.dotnet 2>/dev/null || true

# Copy project file
COPY CineBase.Web/*.csproj ./

# Clear NuGet cache to avoid Windows path issues
RUN dotnet nuget locals all --clear

# Restore NuGet dependencies
RUN dotnet restore

# Copy source code
COPY CineBase.Web .

# Build and publish Release configuration (static files only)
RUN dotnet publish -c Release -o /app/publish /p:GenerateAssemblyInfo=false

# ============================================================================
# STAGE 2: RUNTIME
# ============================================================================
FROM nginx:alpine

# Install curl for health checks (apk is available in alpine)
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY CineBase.Web/nginx.conf /etc/nginx/nginx.conf

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

# Start nginx with envsubst for FILMAPI_UPSTREAM variable
# Using explicit envsubst CMD since nginx's built-in template mechanism
# only processes files in /etc/nginx/conf.d/, not the main nginx.conf
CMD envsubst '${FILMAPI_UPSTREAM}' < /etc/nginx/nginx.conf > /tmp/nginx.conf && \
    cp /tmp/nginx.conf /etc/nginx/nginx.conf && \
    nginx -g "daemon off;"
