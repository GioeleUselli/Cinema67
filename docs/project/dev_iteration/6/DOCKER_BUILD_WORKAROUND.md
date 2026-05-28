# Docker Build Workaround - .NET SDK Assembly Attribute Duplication

## Problem

When building the backend (`FilmAPI`) Docker image using `dotnet publish` inside a .NET 9 SDK container, the build fails with:

```
error CS0579: Duplicate 'global::System.Runtime.Versioning.TargetFrameworkAttribute' attribute
```

This is a known issue with .NET SDK 9.0 in container environments where:
1. The SDK auto-generates `.NETCoreApp,Version=v9.0.AssemblyAttributes.cs` with assembly attributes
2. The SDK also auto-generates `FilmAPI.AssemblyInfo.cs` with duplicate attributes
3. Setting `GenerateAssemblyInfo=false` does NOT prevent the auto-generation in container builds
4. The issue does NOT occur on Windows builds (where `dotnet publish` works fine)

## Solution: Pre-Built Binaries

Instead of building inside Docker containers, we use **pre-built Release binaries** compiled on Windows:

### Build Process

1. **On Windows Host Machine** (CI/CD or local):
   ```bash
   cd backend/FilmAPI
   dotnet publish -c Release -o ../publish
   ```

2. **In Docker** (via `Dockerfile.filmapi`):
   - Copy pre-built `backend/publish` directory into the runtime image
   - No `.NET SDK` build stage required
   - Runtime-only image based on `mcr.microsoft.com/dotnet/aspnet:9.0`

### Dockerfile Structure

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0

# Install dependencies...
RUN apt-get install -y curl default-mysql-client bash

# Copy pre-built binaries
COPY publish /app/

# Copy entrypoint
COPY docker-entrypoint.sh /app/

# Run application
CMD ["dotnet", "FilmAPI.dll"]
```

### Build Context

In `docker-compose.yml`:
```yaml
filmapi:
  build:
    context: ./backend          # Context is backend/
    dockerfile: Dockerfile.filmapi
```

This means:
- `COPY publish /app/` → copies `backend/publish`
- `COPY docker-entrypoint.sh /app/` → copies `backend/docker-entrypoint.sh`

## Benefits

1. **Eliminates .NET SDK build issues** - No compilation in container
2. **Faster builds** - No NuGet restore or compilation inside Docker
3. **Consistent output** - Same binaries built on Windows
4. **Smaller image** - No SDK (~500MB+), only runtime (~200MB+)
5. **Works locally and in CI/CD** - Same approach for both

## Drawbacks

1. **Extra build step** - Must pre-compile on host before Docker build
2. **Binary synchronization** - `backend/publish` must match source code
3. **CI/CD complexity** - GitHub Actions must compile .NET before Docker build

## For GitHub Actions CI/CD

The deployment workflow should:

1. Checkout code
2. Build backend:
   ```bash
   cd backend/FilmAPI
   dotnet publish -c Release -o ../publish
   ```
3. Build frontend (already static)
4. Build Docker images with pre-built binaries
5. Push to ACR
6. Deploy to Azure Container Apps

## Reverting to Container Build (Future)

If this is fixed in future .NET versions:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS builder
# ... build and publish ...
COPY --from=builder /app/publish /app/
```

Then remove the local `backend/publish` directory from git.

## Testing Local Docker Compose

```bash
# 1. Build backend locally (if not already done)
cd backend/FilmAPI
dotnet publish -c Release -o ../publish

# 2. Build and start docker-compose
cd ../..
docker-compose build
docker-compose up -d

# 3. Wait for services to be healthy
sleep 30

# 4. Test endpoints
curl http://localhost:5001           # Frontend
curl http://localhost:5000/api/films # API
```

## Affected Files

- `backend/Dockerfile.filmapi` - Uses pre-built `publish` directory
- `backend/publish/` - Pre-built Release binaries (gitignored)
- GitHub Actions workflow (CI/CD implementation pending)
