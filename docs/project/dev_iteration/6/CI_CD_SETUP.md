# GitHub Actions CI/CD Setup Guide

**Versione**: 1.0  
**Data**: May 28, 2026

## Indice
1. [Overview](#overview)
2. [Create Service Principal](#create-service-principal)
3. [Configure GitHub Secrets](#configure-github-secrets)
4. [Workflow File Structure](#workflow-file-structure)
5. [Build Job Details](#build-job-details)
6. [Deploy Job Details](#deploy-job-details)
7. [Testing & Validation](#testing--validation)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### CI/CD Pipeline Architecture

```
GitHub Repository (main branch push)
        ↓
GitHub Actions Workflow Triggered
        ├─ Job 1: build-and-push
        │   ├─ Checkout code
        │   ├─ Set up Docker Buildx
        │   ├─ Login to ACR
        │   ├─ Build FilmAPI image
        │   ├─ Push FilmAPI to ACR
        │   ├─ Build CineBase.Web image
        │   ├─ Push CineBase.Web to ACR
        │   └─ Output: Image digests & tags
        ↓
        ├─ Job 2: deploy-to-aca (depends on job 1)
        │   ├─ Azure login (Service Principal)
        │   ├─ Update mariadb-server (if image changed)
        │   ├─ Update filmapi-app image reference
        │   ├─ Update cinebase-web-app image reference
        │   ├─ Health check polling loop (5 min timeout)
        │   ├─ Smoke tests (curl endpoints)
        │   └─ Output: Deployment summary
        ↓
Azure Container Apps (updated)
```

### Benefits

- Automated build & push on every main branch commit
- Centralized secrets (GitHub Secrets, not in code)
- Immutable image tags (git SHA-based)
- Health check validation before declaring success
- Audit trail (GitHub Actions logs)
- Automatic rollback on failure (if implemented)

---

## Create Service Principal

### Step 1: Create Service Principal for GitHub Actions

```bash
# Login to Azure (must be Subscription Owner or have appropriate permissions)
az login

# Create Service Principal with Contributor role for resource group
az ad sp create-for-rbac \
    --name "github-actions-cinebase" \
    --role Contributor \
    --scopes /subscriptions/<subscription-id>/resourceGroups/cinebase-rg \
    --years 2

# Output:
{
  "appId": "00000000-0000-0000-0000-000000000000",
  "displayName": "github-actions-cinebase",
  "password": "...",
  "tenant": "00000000-0000-0000-0000-000000000000"
}
```

### Step 2: Grant ACR Push Permissions

```bash
# Get Principal ID
SP_ID=$(az ad sp show --id <appId> --query id -o tsv)

# Grant ACR push role
az role assignment create \
    --assignee $SP_ID \
    --role AcrPush \
    --scope /subscriptions/<subscription-id>/resourceGroups/cinebase-rg/providers/Microsoft.ContainerRegistry/registries/cinebaseacr
```

### Step 3: Get ACR Credentials

```bash
# List ACR credentials (username & password)
az acr credential show \
    --resource-group cinebase-rg \
    --name cinebaseacr

# Output:
{
  "passwords": [
    {
      "name": "password",
      "value": "..."
    }
  ],
  "username": "cinebaseacr"
}
```

---

## Configure GitHub Secrets

### Step 1: Navigate to Repository Settings

1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"

### Step 2: Add Secrets (7 total)

1. **ACR_LOGIN_SERVER**
   - Value: `cinebaseacr.azurecr.io`
   - Used by: Build job (docker push)

2. **ACR_USERNAME**
   - Value: `cinebaseacr` (from `az acr credential show`)
   - Used by: Build job (docker login)

3. **ACR_PASSWORD**
   - Value: `<password from az acr credential show>`
   - Used by: Build job (docker login)

4. **AZURE_CREDENTIALS**
   - Value: Full JSON output from `az ad sp create-for-rbac`
   ```json
   {
     "clientId": "...",
     "clientSecret": "...",
     "subscriptionId": "...",
     "tenantId": "..."
   }
   ```
   - Used by: Deploy job (azure login)

5. **AZURE_RESOURCE_GROUP**
   - Value: `cinebase-rg`
   - Used by: Deploy job (resource group name)

6. **AZURE_CONTAINER_APPS_ENVIRONMENT**
   - Value: `cinema67-env`
   - Used by: Deploy job (ACA environment name)

7. **AZURE_SUBSCRIPTION_ID**
   - Value: `<subscription-id>`
   - Used by: Deploy job (subscription context)

### Step 3: Verify Secrets

```bash
# From GitHub CLI (if installed)
gh secret list -R <repo-owner>/<repo-name>
```

---

## Workflow File Structure

### File Location

```
.github/workflows/deploy-to-azure.yml
```

### Basic Template

```yaml
name: Deploy to Azure Container Apps

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  ACR_LOGIN_SERVER: ${{ secrets.ACR_LOGIN_SERVER }}
  ACR_USERNAME: ${{ secrets.ACR_USERNAME }}
  ACR_PASSWORD: ${{ secrets.ACR_PASSWORD }}
  REGISTRY: ${{ secrets.ACR_LOGIN_SERVER }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    outputs:
      filmapi-image: ${{ steps.image.outputs.filmapi }}
      cinebase-web-image: ${{ steps.image.outputs.cinebase-web }}

    steps:
      # Steps defined below...

  deploy-to-aca:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      # Steps defined below...
```

---

## Build Job Details

### Full Build Job Configuration

```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    outputs:
      filmapi-image: ${{ steps.image.outputs.filmapi }}
      cinebase-web-image: ${{ steps.image.outputs.cinebase-web }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to ACR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.ACR_LOGIN_SERVER }}
          username: ${{ env.ACR_USERNAME }}
          password: ${{ env.ACR_PASSWORD }}

      - name: Build and push FilmAPI image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/FilmAPI/Dockerfile
          push: true
          tags: |
            ${{ env.ACR_LOGIN_SERVER }}/filmapi:main-${{ github.sha }}
            ${{ env.ACR_LOGIN_SERVER }}/filmapi:latest
          cache-from: type=registry,ref=${{ env.ACR_LOGIN_SERVER }}/filmapi:buildcache
          cache-to: type=registry,ref=${{ env.ACR_LOGIN_SERVER }}/filmapi:buildcache,mode=max

      - name: Build and push CineBase.Web image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/CineBase.Web/Dockerfile
          push: true
          tags: |
            ${{ env.ACR_LOGIN_SERVER }}/cinebase-web:main-${{ github.sha }}
            ${{ env.ACR_LOGIN_SERVER }}/cinebase-web:latest
          cache-from: type=registry,ref=${{ env.ACR_LOGIN_SERVER }}/cinebase-web:buildcache
          cache-to: type=registry,ref=${{ env.ACR_LOGIN_SERVER }}/cinebase-web:buildcache,mode=max

      - name: Set image output for deploy job
        id: image
        run: |
          echo "filmapi=${{ env.ACR_LOGIN_SERVER }}/filmapi:main-${{ github.sha }}" >> $GITHUB_OUTPUT
          echo "cinebase-web=${{ env.ACR_LOGIN_SERVER }}/cinebase-web:main-${{ github.sha }}" >> $GITHUB_OUTPUT

      - name: Image build summary
        run: |
          echo "## Build Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**FilmAPI Image**: \`${{ steps.image.outputs.filmapi }}\`" >> $GITHUB_STEP_SUMMARY
          echo "**CineBase.Web Image**: \`${{ steps.image.outputs.cinebase-web }}\`" >> $GITHUB_STEP_SUMMARY
```

### Key Configuration

- **context**: Dockerfile context (backend/ or frontend/)
- **file**: Dockerfile path
- **push**: true = push to registry after build
- **tags**: Image tags (main-<sha> + latest)
- **cache**: Registry-based cache for faster rebuilds
- **outputs**: Pass image names to next job

---

## Deploy Job Details

### Full Deploy Job Configuration

```yaml
  deploy-to-aca:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Azure login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Update FilmAPI container app
        run: |
          az containerapp update \
            --name filmapi-app \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --image ${{ needs.build-and-push.outputs.filmapi-image }}

      - name: Update CineBase.Web container app
        run: |
          az containerapp update \
            --name cinebase-web-app \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --image ${{ needs.build-and-push.outputs.cinebase-web-image }}

      - name: Wait for deployments to be ready
        run: |
          echo "Waiting for deployments to be ready..."
          MAX_ATTEMPTS=30
          ATTEMPT=0
          
          while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
            STATUS=$(az containerapp show \
              --name filmapi-app \
              --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
              --query "properties.runningStatus" -o tsv)
            
            if [ "$STATUS" = "Running" ]; then
              echo "✓ FilmAPI is running"
              break
            fi
            
            ATTEMPT=$((ATTEMPT + 1))
            echo "Waiting... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
            sleep 10
          done
          
          if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo "❌ Deployment timeout"
            exit 1
          fi

      - name: Run smoke tests
        run: |
          echo "Running smoke tests..."
          
          # Get web app FQDN
          FQDN=$(az containerapp show \
            --name cinebase-web-app \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --query "properties.configuration.ingress.fqdn" -o tsv)
          
          echo "Testing endpoints at: https://$FQDN"
          
          # Wait for HTTPS to be ready
          sleep 30
          
          # Test frontend health
          if curl -f https://$FQDN/health; then
            echo "✓ Frontend health check passed"
          else
            echo "❌ Frontend health check failed"
            exit 1
          fi
          
          # Test API through proxy
          if curl -f https://$FQDN/api/films; then
            echo "✓ API films endpoint passed"
          else
            echo "❌ API films endpoint failed"
            exit 1
          fi

      - name: Deployment summary
        run: |
          echo "## Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          
          RESOURCE_GROUP="${{ secrets.AZURE_RESOURCE_GROUP }}"
          
          echo "### Container Apps Status" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          
          for APP in mariadb-server filmapi-app cinebase-web-app; do
            STATUS=$(az containerapp show \
              --name $APP \
              --resource-group $RESOURCE_GROUP \
              --query "properties.runningStatus" -o tsv)
            REPLICAS=$(az containerapp replica list \
              --name $APP \
              --resource-group $RESOURCE_GROUP \
              --query "length(@)" -o tsv)
            echo "- **$APP**: $STATUS ($REPLICAS replicas)" >> $GITHUB_STEP_SUMMARY
          done
          
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### Images Deployed" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "- \`${{ needs.build-and-push.outputs.filmapi-image }}\`" >> $GITHUB_STEP_SUMMARY
          echo "- \`${{ needs.build-and-push.outputs.cinebase-web-image }}\`" >> $GITHUB_STEP_SUMMARY

      - name: Notify on failure
        if: failure()
        run: |
          echo "❌ Deployment failed"
          echo "Check logs above for details"
          exit 1
```

### Key Features

- **needs: build-and-push**: Wait for images to be built
- **if: github.ref == 'refs/heads/main'**: Deploy only on main branch
- **az containerapp update**: Update image reference (triggers new deployment)
- **Health check polling**: Wait until containers are running
- **Smoke tests**: Validate endpoints are responding
- **Deployment summary**: Post results to workflow summary

---

## Testing & Validation

### Local Testing Before Merge

```bash
# 1. Build locally (test Dockerfile)
docker build -t filmapi:test ./backend/FilmAPI
docker build -t cinebase-web:test ./frontend/CineBase.Web

# 2. Test docker-compose
docker-compose up -d
docker-compose ps

# 3. Test endpoints
curl http://localhost:5000/health
curl http://localhost:5001/health

# 4. Clean up
docker-compose down
```

### Manual Workflow Trigger

```bash
# List workflows
gh workflow list -R <owner>/<repo>

# Manually trigger workflow
gh workflow run deploy-to-azure.yml -R <owner>/<repo> -r main

# Monitor run
gh run list -R <owner>/<repo> --workflow deploy-to-azure.yml --limit 5
gh run view <run-id> -R <owner>/<repo> --log
```

### Workflow Logs

```bash
# View workflow logs in GitHub UI
1. Go to Actions tab
2. Select deploy-to-azure.yml workflow
3. Click latest run
4. View logs for each step

# Or via GitHub CLI
gh run view <run-id> --log
```

---

## Troubleshooting

### Build Job Fails

**Problem**: `docker build-push-action` fails

**Solutions**:
```bash
# Check Dockerfile syntax
docker build ./backend/FilmAPI

# Check .dockerignore excludes large files
ls -la backend/FilmAPI/bin/  # Should be in .dockerignore

# Verify base images exist
docker pull mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19

# Check for hardcoded secrets
grep -r "SECRET=" backend/
grep -r "PASSWORD=" backend/
```

### Deploy Job Fails - Azure Login Error

**Problem**: `azure/login` fails with "Invalid credentials"

**Solutions**:
```bash
# Verify AZURE_CREDENTIALS secret
# Should be complete JSON from az ad sp create-for-rbac

# Test locally
AZURE_CREDENTIALS='{"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}'
az login --service-principal -u $clientId -p $clientSecret --tenant $tenantId

# Check Service Principal has correct role
az role assignment list --assignee <appId>
```

### Deploy Job Fails - Image Pull Error

**Problem**: Container app can't pull image from ACR

**Solutions**:
```bash
# Verify image exists in ACR
az acr repository list --name cinebaseacr
az acr repository show --name cinebaseacr --image filmapi:main-<sha>

# Verify ACR credentials are correct
az acr credential show --name cinebaseacr

# Check Service Principal has AcrPush role
az role assignment list \
    --assignee <appId> \
    --scope /subscriptions/<subscription-id>/resourceGroups/cinebase-rg/providers/Microsoft.ContainerRegistry/registries/cinebaseacr
```

### Deployment Timeout

**Problem**: Workflow times out waiting for containers to be ready

**Solutions**:
```bash
# Check container logs for errors
az containerapp logs show --name filmapi-app --resource-group cinebase-rg --tail 50

# Check if container is even starting
az containerapp replica list --name filmapi-app --resource-group cinebase-rg

# Verify environment variables are set
az containerapp show --name filmapi-app --resource-group cinebase-rg \
    --query "properties.template.containers[0].env"
```

### Smoke Tests Fail

**Problem**: curl tests fail after deployment

**Solutions**:
```bash
# Get FQDN
FQDN=$(az containerapp show --name cinebase-web-app --resource-group cinebase-rg \
    --query "properties.configuration.ingress.fqdn" -o tsv)

# Test manually
curl -I https://$FQDN/
curl -I https://$FQDN/health
curl -I https://$FQDN/api/films

# Check ingress is external and healthy
az containerapp show --name cinebase-web-app --resource-group cinebase-rg \
    --query "properties.configuration.ingress"

# Check DNS propagation (if using custom domain)
nslookup cinema67.it
```

### Health Probe Failing

**Problem**: `/health` endpoint returns non-200

**Solutions**:
```bash
# Check app logs
az containerapp logs show --name filmapi-app --resource-group cinebase-rg --tail 50

# Verify endpoint is implemented
# In Program.cs:
app.MapGet("/health", async context =>
{
    context.Response.StatusCode = 200;
    await context.Response.WriteAsJsonAsync(new { status = "healthy" });
});

# Test endpoint from container
az containerapp exec \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --command "/bin/bash"
$ curl http://localhost:8080/health
```

---

**Document Version**: 1.0  
**Last Updated**: May 28, 2026
