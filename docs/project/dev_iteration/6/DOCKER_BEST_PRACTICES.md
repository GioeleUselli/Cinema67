# Docker Best Practices per CineBase

**Versione**: 1.0  
**Data**: May 28, 2026

## Indice
1. [Dockerfile Optimization](#dockerfile-optimization)
2. [Image Security](#image-security)
3. [Layer Caching](#layer-caching)
4. [Multi-Stage Builds](#multi-stage-builds)
5. [Health Checks](#health-checks)
6. [Non-Root User](#non-root-user)
7. [Volume Management](#volume-management)
8. [Network Best Practices](#network-best-practices)

---

## Dockerfile Optimization

### Size Reduction

**Alpine Base Images**
- ✅ mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19 (SDK ~900MB)
- ✅ mcr.microsoft.com/dotnet/aspnet:9.0-alpine3.19 (Runtime ~150MB)
- ✅ nginx:alpine (~50MB)
- ✅ mariadb:11.4 (official, ~400MB)

**vs Full Image**
- ❌ mcr.microsoft.com/dotnet/sdk:9.0 (~2GB)
- ❌ mcr.microsoft.com/dotnet/aspnet:9.0 (~500MB)
- ❌ nginx:latest (~180MB)

**Result**: ~60% size reduction

### Layer Ordering

```dockerfile
# ❌ BAD: Build dependencies before restore
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19
RUN apk add --no-cache curl wget openssl  # Layer 1
RUN dotnet restore  # Layer 2 (cache miss on any RUN)
COPY . .  # Layer 3 (invalidates cache)

# ✅ GOOD: Dependencies, then restore, then source
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19
RUN apk add --no-cache curl wget openssl  # Layer 1
COPY *.csproj .  # Layer 2 (small, caches well)
RUN dotnet restore  # Layer 3 (cached if csproj unchanged)
COPY . .  # Layer 4 (source changes don't bust restore cache)
RUN dotnet publish  # Layer 5
```

### RUN Commands Consolidation

```dockerfile
# ❌ BAD: Multiple RUN = multiple layers
RUN apk add --no-cache curl
RUN apk add --no-cache bash
RUN apk add --no-cache openssl
# Result: 3 extra layers, 3x size overhead

# ✅ GOOD: Single RUN with && chain
RUN apk add --no-cache curl bash openssl
# Result: 1 layer, clean cache

# ✅ GOOD: apk cleanup
RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/* && \
    rm -rf /tmp/*
```

---

## Image Security

### No Root User

```dockerfile
# ❌ BAD: Running as root
# (default if not specified)
EXPOSE 5000
CMD ["dotnet", "FilmAPI.dll"]

# ✅ GOOD: Create non-root user
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app
USER app
EXPOSE 5000
CMD ["dotnet", "FilmAPI.dll"]

# Benefits:
# - Limits container escape damage
# - Prevents privilege escalation
# - Complies with security policies (pod security standards)
```

### File Permissions

```dockerfile
# ✅ Set correct ownership
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app
COPY --chown=app:app ./app .
USER app

# ✅ Make entrypoint executable
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# ✅ Remove write from group/others
RUN chmod 755 /app/docker-entrypoint.sh
```

### Secret Handling

```dockerfile
# ❌ BAD: Secrets in ENV (persisted in image)
ENV JWT_SECRET="very-secret-key"
ENV DB_PASSWORD="database-password"

# ✅ GOOD: Secrets via build args or at runtime
# Build time:
ARG JWT_SECRET
ENV JWT_SECRET=${JWT_SECRET}
# Pass: docker build --build-arg JWT_SECRET=key

# Runtime: (PREFERRED)
# Pass via docker run -e JWT_SECRET=key
# or environment variables from host

# ✅ BEST: Use secret files (Docker/Kubernetes)
RUN --mount=type=secret,id=jwt_secret \
    export JWT_SECRET=$(cat /run/secrets/jwt_secret)
```

---

## Layer Caching

### Maximize Cache Hits

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19

# Layer 1: Dependencies (changes rarely)
RUN apk add --no-cache curl bash openssl

# Layer 2: Project files (changes rarely)
COPY backend/FilmAPI/*.csproj .
COPY backend/FilmAPI.Domain/*.csproj FilmAPI.Domain/
COPY backend/FilmAPI.Infrastructure/*.csproj FilmAPI.Infrastructure/

# Layer 3: Restore (cached until .csproj changes)
RUN dotnet restore

# Layer 4: Source code (changes frequently)
COPY backend/ .

# Layer 5: Publish (rerun only if source changed)
RUN dotnet publish -c Release -o /app/publish
```

**Cache Hit Rate**: ~80% (only layer 4+ rerun on code changes)

### Build Context Optimization

```dockerfile
# .dockerignore
bin/
obj/
.git/
.env
.env.local
.vs/
.rider/
.idea/
*.log
*.tmp
node_modules/
dist/
*.pdf
*.doc

# Result: ~50MB context vs 200MB with everything
```

---

## Multi-Stage Builds

### Backend Example

```dockerfile
# ===== STAGE 1: BUILDER =====
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19 AS builder
WORKDIR /src

# Copy project files
COPY backend/FilmAPI/*.csproj FilmAPI/
COPY backend/FilmAPI.Domain/*.csproj FilmAPI.Domain/
COPY backend/FilmAPI.Infrastructure/*.csproj FilmAPI.Infrastructure/
COPY backend/scripts/FilmApiSeeder/*.csproj FilmApiSeeder/

# Restore dependencies
RUN dotnet restore FilmAPI/FilmAPI.csproj

# Copy source
COPY backend/ .

# Publish
RUN dotnet publish FilmAPI/FilmAPI.csproj -c Release -o /app/publish --no-restore
RUN dotnet publish FilmApiSeeder/FilmApiSeeder.csproj -c Release -o /app/publish --no-restore

# ===== STAGE 2: RUNTIME =====
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine3.19

# Install runtime dependencies only
RUN apk add --no-cache curl mysql-client bash

# Create non-root user
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app
WORKDIR /app
COPY --from=builder --chown=app:app /app/publish .

# Copy entrypoint
COPY backend/docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

USER app
EXPOSE 5000 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]
```

**Size Analysis**:
- Builder stage: ~2GB (SDK, NuGet packages, compiled binaries)
- Runtime stage: ~180MB (only runtime + published DLLs)
- **Final image**: ~285MB (DLLs + runtime + curl/bash/mysql-client)

### Frontend Example

```dockerfile
# ===== STAGE 1: BUILDER =====
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19 AS builder
WORKDIR /src

COPY frontend/CineBase.Web/*.csproj .
RUN dotnet restore

COPY frontend/CineBase.Web/ .
RUN dotnet publish -c Release -o /app/publish --no-restore

# ===== STAGE 2: RUNTIME =====
FROM nginx:alpine

RUN apk add --no-cache curl

# Copy nginx config
COPY frontend/CineBase.Web/nginx.conf /etc/nginx/nginx.conf

# Copy static files
COPY --from=builder /app/publish/wwwroot /var/www/cinebase

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Size Analysis**:
- Builder stage: ~2GB
- Runtime stage: ~50MB
- **Final image**: ~45MB (nginx + static files only)

---

## Health Checks

### Backend Health Endpoint

```csharp
// Program.cs
app.MapGet("/health", async context =>
{
    var services = context.RequestServices;
    var dbContext = services.GetRequiredService<CineBaseContext>();
    
    try
    {
        // Check DB connection
        await dbContext.Database.ExecuteSqlRawAsync("SELECT 1");
        
        context.Response.StatusCode = 200;
        await context.Response.WriteAsJsonAsync(new 
        { 
            status = "healthy",
            timestamp = DateTime.UtcNow,
            version = "1.0.0"
        });
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 503;
        await context.Response.WriteAsJsonAsync(new 
        { 
            status = "unhealthy",
            error = ex.Message
        });
    }
});
```

### Health Check Configuration

```dockerfile
# Docker Compose
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 10s
  timeout: 3s
  retries: 3
  start_period: 30s

# Docker Compose interpretation:
# - Every 10s, run curl
# - If fails, wait 3s for response
# - After 3 consecutive failures, mark unhealthy
# - Don't check until 30s after container start (grace period)
```

### ACA Health Probe

```bash
# HTTP GET probe
az containerapp create \
    --health-probe-type http \
    --health-probe-path /health \
    --health-probe-port 5000 \
    --health-probe-interval 10s \
    --health-probe-timeout 3s \
    --health-probe-failure-count 3

# TCP probe (MariaDB)
az containerapp create \
    --health-probe-type tcp \
    --health-probe-port 3306 \
    --health-probe-interval 10s

# Startup probe (app takes time to start)
az containerapp create \
    --health-probe-type http \
    --health-probe-path /health \
    --startup-probe true  # Wait until healthy before taking traffic
```

---

## Non-Root User

### Creation Best Practice

```dockerfile
# Alpine (musl, not glibc)
RUN addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app

# Debian/Ubuntu (glibc)
RUN useradd -m -u 1000 -g 1000 app

# Check:
# $ docker run <image> id
# uid=1000(app) gid=1000(app) groups=1000(app)
```

### Directory Ownership

```dockerfile
WORKDIR /app

# ✅ Good: Set ownership before copying
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app
COPY --chown=app:app . .

# Or: Create directory with correct owner
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app && \
    mkdir -p /app/media && \
    chown -R app:app /app

USER app

# Verify:
# $ docker run <image> ls -la /app
# drwxr-xr-x app app ...
```

### Volume Permissions

```bash
# Create volume before use
docker volume create filmapi-media

# Inspect
docker volume inspect filmapi-media

# In docker-compose.yml
volumes:
  - filmapi-media:/app/media

# Inside container: /app/media owned by app:app
# (Docker handles permission mapping)
```

---

## Volume Management

### Named Volumes (Persistence)

```yaml
# docker-compose.yml
volumes:
  mariadb-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ${PWD}/data/mariadb  # Optional: bind to host path
  
  filmapi-media:
    driver: local
  
  filmapi-dataprotection:
    driver: local

services:
  mariadb:
    volumes:
      - mariadb-data:/var/lib/mysql

  filmapi:
    volumes:
      - filmapi-media:/app/media
      - filmapi-dataprotection:/app/dataprotection
```

### Data Protection Keys Sharing

```dockerfile
# Backend Dockerfile
COPY --chown=app:app . .

# Program.cs
var dataProtectionPath = Environment.GetEnvironmentVariable("DATA_PROTECTION_KEYS_PATH");
if (!string.IsNullOrEmpty(dataProtectionPath))
{
    services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath));
}
```

```yaml
# docker-compose.yml
services:
  filmapi:
    environment:
      DATA_PROTECTION_KEYS_PATH: /app/dataprotection
    volumes:
      - filmapi-dataprotection:/app/dataprotection
  
  # If web app needs same keys (multi-app sessions):
  cinebase-web:
    volumes:
      - filmapi-dataprotection:/app/dataprotection
```

**Result**: All app instances can decrypt cookies from each other

---

## Network Best Practices

### Bridge Network (docker-compose)

```yaml
networks:
  cinema67-network:
    driver: bridge

services:
  mariadb:
    networks:
      - cinema67-network
    # DNS: mariadb (container name auto-resolves)

  filmapi:
    networks:
      - cinema67-network
    depends_on:
      mariadb:
        condition: service_healthy
    # Can reach: http://mariadb:3306
```

### Port Publishing

```yaml
# ✅ Publish only necessary ports
services:
  mariadb:
    ports:
      - "3306:3306"  # Only for local development
    # Remove for production (no external access)

  filmapi:
    ports:
      - "5000:5000"  # Internal API (via docker network)
    # ACA: no ports published, internal ingress only

  cinebase-web:
    ports:
      - "5001:80"  # External access via Nginx
```

### Internal vs External Ingress

**Local (docker-compose)**:
- cinebase-web: port 5001 (external) → public internet
- filmapi: port 5000 (internal) → cinebase-web only
- mariadb: port 3306 (optional, for debugging)

**Azure (ACA)**:
- cinebase-web-app: External ingress (public, HTTPS)
- filmapi-app: Internal ingress (docker network only)
- mariadb-server: Internal ingress (docker network only)

---

## Summary Checklist

- ✅ Use alpine base images
- ✅ Multi-stage builds (builder → runtime)
- ✅ Non-root user (uid 1000)
- ✅ .dockerignore configured
- ✅ Health check endpoint
- ✅ No hardcoded secrets
- ✅ Named volumes for persistence
- ✅ Proper layer caching (dependencies first, source last)
- ✅ Final image size < 300MB (backend) / < 50MB (frontend)
- ✅ Bridge network with container name DNS

---

**Document Version**: 1.0  
**Last Updated**: May 28, 2026
