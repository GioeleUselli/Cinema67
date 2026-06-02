# ============================================================================
# Cinema67.Web Dockerfile - Multistage Build
# ============================================================================
# Build Stage: SDK - compile and publish static files
# Runtime Stage: aspnet - serve static files with dynamic runtime config
#
# Port: 8080
# User: non-root (APP_UID)
# Healthcheck: GET /healthz
# ============================================================================

# ============================================================================
# STAGE 1: BUILDER
# ============================================================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS builder

WORKDIR /src

# Copy project file for dependency caching
COPY CineBase.Web/CineBase.Web.csproj ./

# Restore NuGet dependencies
RUN dotnet restore

# Copy all source files
COPY CineBase.Web .

# Build and publish Release configuration
RUN dotnet publish -c Release -o /app/publish -p:UseAppHost=false

# ============================================================================
# STAGE 2: RUNTIME
# ============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (Debian-compatible)
RUN groupadd --gid 1654 app || true && \
    useradd --uid 1654 --gid app --create-home app || true

WORKDIR /app

# Copy published application from builder stage
COPY --from=builder --chown=app:app /app/publish .

# Set environment
ENV ASPNETCORE_URLS=http://+:8080

# Switch to non-root user
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

# Entrypoint
ENTRYPOINT ["dotnet", "CineBase.Web.dll"]
