# Azure Container Apps Deployment Guide

**Versione**: 1.0  
**Data**: May 28, 2026

## Indice
1. [Pre-Requisiti](#pre-requisiti)
2. [Azure Setup Script](#azure-setup-script)
3. [Manual Deployment Steps](#manual-deployment-steps)
4. [Image Tagging Strategy](#image-tagging-strategy)
5. [Environment Variables](#environment-variables)
6. [Volume Mounting](#volume-mounting)
7. [Networking & Ingress](#networking--ingress)
8. [Health Probes](#health-probes)
9. [Scaling & Autoscaling](#scaling--autoscaling)
10. [Monitoring & Logs](#monitoring--logs)

---

## Pre-Requisiti

### Local Environment

```bash
# 1. Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# 2. Login to Azure
az login
az account list  # List subscriptions

# 3. Set default subscription
az account set --subscription <subscription-id-or-name>

# 4. Verify access
az account show
az group list  # Should see existing resource groups
```

### Azure Subscription

- Active subscription with sufficient quota
- Region: italynorth (EU data residency)
- Quotas: ACR (basic), ACA environment, storage account
- Role: Contributor or higher for resource group

### Local Credentials

```bash
# Azure CLI auto-caches login
# Location: ~/.azure/

# For CI/CD (GitHub Actions), create Service Principal:
az ad sp create-for-rbac \
    --name "github-actions-cinebase" \
    --role Contributor \
    --scopes /subscriptions/<subscription-id>/resourceGroups/cinebase-rg

# Output JSON (save securely):
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "...",
  "resourceManagerEndpointUrl": "https://management.azure.com/"
}
# → Store as AZURE_CREDENTIALS in GitHub Secrets
```

---

## Azure Setup Script

### AZURE_SETUP.sh (Complete)

```bash
#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== CineBase Azure Infrastructure Setup ===${NC}"

# Configuration
RESOURCE_GROUP="cinebase-rg"
LOCATION="italynorth"
ACR_NAME="cinebaseacr"
ACA_ENVIRONMENT="cinema67-env"
STORAGE_ACCOUNT="cinebasestg"
LOG_ANALYTICS_WORKSPACE="cinema67-logs"

# Verify logged in
echo -e "${YELLOW}Verifying Azure CLI login...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}Not logged in. Run 'az login' first.${NC}"
    exit 1
fi

SUBSCRIPTION=$(az account show --query "id" -o tsv)
echo -e "${GREEN}✓ Logged in. Subscription: $SUBSCRIPTION${NC}"

# 1. Create Resource Group
echo -e "${YELLOW}Step 1: Creating Resource Group...${NC}"
if az group exists --name $RESOURCE_GROUP --query value -o tsv | grep -q "true"; then
    echo -e "${GREEN}✓ Resource Group '$RESOURCE_GROUP' already exists${NC}"
else
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo -e "${GREEN}✓ Resource Group created${NC}"
fi

# 2. Create Log Analytics Workspace
echo -e "${YELLOW}Step 2: Creating Log Analytics Workspace...${NC}"
LOG_WORKSPACE_ID=$(az monitor log-analytics workspace show \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_ANALYTICS_WORKSPACE \
    --query "id" -o tsv 2>/dev/null || echo "")

if [ -z "$LOG_WORKSPACE_ID" ]; then
    echo "Creating new Log Analytics workspace..."
    az monitor log-analytics workspace create \
        --resource-group $RESOURCE_GROUP \
        --workspace-name $LOG_ANALYTICS_WORKSPACE
    LOG_WORKSPACE_ID=$(az monitor log-analytics workspace show \
        --resource-group $RESOURCE_GROUP \
        --workspace-name $LOG_ANALYTICS_WORKSPACE \
        --query "id" -o tsv)
    echo -e "${GREEN}✓ Log Analytics workspace created${NC}"
else
    echo -e "${GREEN}✓ Log Analytics workspace already exists${NC}"
fi

# 3. Create Azure Container Registry
echo -e "${YELLOW}Step 3: Creating Azure Container Registry...${NC}"
if az acr show --resource-group $RESOURCE_GROUP --name $ACR_NAME &> /dev/null; then
    echo -e "${GREEN}✓ ACR '$ACR_NAME' already exists${NC}"
else
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic
    echo -e "${GREEN}✓ ACR created${NC}"
fi

ACR_LOGIN_SERVER=$(az acr show \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --query "loginServer" -o tsv)
echo "ACR Login Server: $ACR_LOGIN_SERVER"

# 4. Create Container Apps Environment
echo -e "${YELLOW}Step 4: Creating Container Apps Environment...${NC}"
if az containerapp env show \
    --resource-group $RESOURCE_GROUP \
    --name $ACA_ENVIRONMENT &> /dev/null; then
    echo -e "${GREEN}✓ ACA Environment '$ACA_ENVIRONMENT' already exists${NC}"
else
    az containerapp env create \
        --resource-group $RESOURCE_GROUP \
        --name $ACA_ENVIRONMENT \
        --location $LOCATION \
        --logs-workspace-id $LOG_WORKSPACE_ID
    echo -e "${GREEN}✓ ACA Environment created${NC}"
fi

# 5. Create Storage Account
echo -e "${YELLOW}Step 5: Creating Storage Account...${NC}"
if az storage account show --resource-group $RESOURCE_GROUP --name $STORAGE_ACCOUNT &> /dev/null; then
    echo -e "${GREEN}✓ Storage Account '$STORAGE_ACCOUNT' already exists${NC}"
else
    az storage account create \
        --resource-group $RESOURCE_GROUP \
        --name $STORAGE_ACCOUNT \
        --location $LOCATION \
        --sku Standard_LRS
    echo -e "${GREEN}✓ Storage Account created${NC}"
fi

# Get storage key
STORAGE_KEY=$(az storage account keys list \
    --resource-group $RESOURCE_GROUP \
    --account-name $STORAGE_ACCOUNT \
    --query "[0].value" -o tsv)
echo "Storage Account Key: ${STORAGE_KEY:0:10}..."

# 6. Create File Shares
echo -e "${YELLOW}Step 6: Creating File Shares...${NC}"

# MariaDB Data Share
if az storage share exists \
    --account-name $STORAGE_ACCOUNT \
    --account-key $STORAGE_KEY \
    --name mariadb-data \
    --query exists -o tsv | grep -q "true"; then
    echo -e "${GREEN}✓ File Share 'mariadb-data' already exists${NC}"
else
    az storage share create \
        --account-name $STORAGE_ACCOUNT \
        --account-key $STORAGE_KEY \
        --name mariadb-data \
        --quota 5120  # 5GB
    echo -e "${GREEN}✓ File Share 'mariadb-data' created (5GB)${NC}"
fi

# Data Protection Keys Share
if az storage share exists \
    --account-name $STORAGE_ACCOUNT \
    --account-key $STORAGE_KEY \
    --name filmapi-dataprotection \
    --query exists -o tsv | grep -q "true"; then
    echo -e "${GREEN}✓ File Share 'filmapi-dataprotection' already exists${NC}"
else
    az storage share create \
        --account-name $STORAGE_ACCOUNT \
        --account-key $STORAGE_KEY \
        --name filmapi-dataprotection \
        --quota 1024  # 1GB
    echo -e "${GREEN}✓ File Share 'filmapi-dataprotection' created (1GB)${NC}"
fi

# 7. Summary
echo -e "${GREEN}"
echo "=========================================="
echo "✓ Azure Setup Complete!"
echo "=========================================="
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "ACR: $ACR_LOGIN_SERVER"
echo "ACA Environment: $ACA_ENVIRONMENT"
echo "Storage Account: $STORAGE_ACCOUNT"
echo "Log Analytics: $LOG_ANALYTICS_WORKSPACE"
echo ""
echo "Next Steps:"
echo "1. Configure GitHub Secrets:"
echo "   - ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER"
echo "   - ACR_USERNAME=<from 'az acr credential show'>"
echo "   - ACR_PASSWORD=<from 'az acr credential show'>"
echo "   - AZURE_RESOURCE_GROUP=$RESOURCE_GROUP"
echo "   - AZURE_CONTAINER_APPS_ENVIRONMENT=$ACA_ENVIRONMENT"
echo "   - AZURE_CREDENTIALS=<Service Principal JSON>"
echo ""
echo "2. Push images to ACR:"
echo "   docker push $ACR_LOGIN_SERVER/filmapi:main-<sha>"
echo "   docker push $ACR_LOGIN_SERVER/cinebase-web:main-<sha>"
echo ""
echo "3. Deploy container apps (see CI/CD workflow)"
echo "=========================================="
echo -e "${NC}"
```

### Run Setup Script

```bash
chmod +x AZURE_SETUP.sh
./AZURE_SETUP.sh

# Output should show:
# ✓ Logged in
# ✓ Resource Group created
# ✓ Log Analytics workspace created
# ✓ ACR created
# ✓ ACA Environment created
# ✓ Storage Account created
# ✓ File Shares created
# ✓ Azure Setup Complete!
```

---

## Manual Deployment Steps

### Step 1: Get ACR Credentials

```bash
# Push images to ACR
az acr credential show \
    --resource-group cinebase-rg \
    --name cinebaseacr

# Output:
# {
#   "passwords": [
#     {
#       "name": "password",
#       "value": "..."
#     },
#     {
#       "name": "password2",
#       "value": "..."
#     }
#   ],
#   "username": "cinebaseacr"
# }
```

### Step 2: Deploy MariaDB

```bash
az containerapp create \
    --name mariadb-server \
    --resource-group cinebase-rg \
    --environment cinema67-env \
    --image mariadb:11.4 \
    --cpu 1 --memory 2Gi \
    --ingress internal \
    --target-port 3306 \
    --transport tcp \
    --env-vars \
        MARIADB_ROOT_PASSWORD='YourRootPassword!' \
        MARIADB_DATABASE=cinebase \
        MARIADB_USER=cinebase_user \
        MARIADB_PASSWORD='YourDbPassword!' \
    --volume-mounts mariadb-data:/var/lib/mysql \
    --storage-mounts mariadb-data \
    --environment-storage \
        name=mariadb-data \
        storage-type=AzureFile \
        storage-name=cinebasestg \
        access-mode=ReadWrite \
    --health-probe-type tcp \
    --health-probe-port 3306 \
    --health-probe-interval 10 \
    --health-probe-failure-count 3

# Verify
az containerapp show \
    --name mariadb-server \
    --resource-group cinebase-rg \
    --query "properties.provisioningState"
# Should output: "Succeeded"
```

### Step 3: Deploy FilmAPI

```bash
az containerapp create \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --environment cinema67-env \
    --image cinebaseacr.azurecr.io/filmapi:main-abc1234 \
    --cpu 1 --memory 1Gi \
    --min-replicas 1 \
    --max-replicas 3 \
    --ingress internal \
    --target-port 8080 \
    --registry-server cinebaseacr.azurecr.io \
    --registry-username cinebaseacr \
    --registry-password '<ACR_PASSWORD>' \
    --env-vars \
        DB_HOST=mariadb-server \
        DB_PORT=3306 \
        DB_NAME=cinebase \
        DB_USER=cinebase_user \
        DB_PASSWORD='YourDbPassword!' \
        ASPNETCORE_ENVIRONMENT=Production \
        ASPNETCORE_URLS='http://+:8080' \
        JWT_SECRET='YourJwtSecret123!' \
        ADMIN_SEED_EMAIL=admin@cinema67.it \
        ADMIN_SEED_PASSWORD='AdminPassword123!' \
        OAUTH_GOOGLE_CLIENT_ID='...' \
        OAUTH_GOOGLE_CLIENT_SECRET='...' \
        DATA_PROTECTION_KEYS_PATH=/app/dataprotection \
    --storage-mounts filmapi-dataprotection \
    --environment-storage \
        name=filmapi-dataprotection \
        storage-type=AzureFile \
        storage-name=cinebasestg \
        access-mode=ReadWrite \
    --health-probe-type http \
    --health-probe-path /health \
    --health-probe-port 8080 \
    --health-probe-interval 10 \
    --health-probe-failure-count 3

# Verify
az containerapp logs show \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --tail 50
# Should show migration logs + seeder output
```

### Step 4: Deploy CineBase Web

```bash
az containerapp create \
    --name cinebase-web-app \
    --resource-group cinebase-rg \
    --environment cinema67-env \
    --image cinebaseacr.azurecr.io/cinebase-web:main-xyz5678 \
    --cpu 0.5 --memory 512Mi \
    --min-replicas 1 \
    --max-replicas 3 \
    --ingress external \
    --target-port 80 \
    --registry-server cinebaseacr.azurecr.io \
    --registry-username cinebaseacr \
    --registry-password '<ACR_PASSWORD>' \
    --env-vars \
        FILMAPI_UPSTREAM='filmapi-app.internal.cinema67.azurecontainer.io:8080' \
        ASPNETCORE_ENVIRONMENT=Production \
    --session-affinity sticky \
    --health-probe-type http \
    --health-probe-path / \
    --health-probe-port 80 \
    --health-probe-interval 10 \
    --health-probe-failure-count 3

# Get FQDN
FQDN=$(az containerapp show \
    --name cinebase-web-app \
    --resource-group cinebase-rg \
    --query "properties.configuration.ingress.fqdn" -o tsv)
echo "FQDN: $FQDN"
```

### Step 5: Update Ingress to HTTPS

```bash
# Bind custom domain
az containerapp hostname bind \
    --name cinebase-web-app \
    --resource-group cinebase-rg \
    --hostname cinema67.it \
    --certificate-binding-type azure-managed

# Set ingress to HTTPS-only
az containerapp ingress update \
    --name cinebase-web-app \
    --resource-group cinebase-rg \
    --mode secure
```

---

## Image Tagging Strategy

### Naming Convention

```
<registry>/<image>:<tag>

Examples:
- cinebaseacr.azurecr.io/filmapi:main-a1b2c3d
- cinebaseacr.azurecr.io/filmapi:v1.0.0
- cinebaseacr.azurecr.io/cinebase-web:main-x9y8z7w

Format: <branch>-<git-sha> (GitHub Actions generates)
```

### Local Tagging

```bash
# Build locally
docker build -t filmapi:latest ./backend/FilmAPI

# Tag for ACR
docker tag filmapi:latest cinebaseacr.azurecr.io/filmapi:main-$(git rev-parse --short HEAD)

# Push
docker push cinebaseacr.azurecr.io/filmapi:main-$(git rev-parse --short HEAD)
```

### GitHub Actions Tagging

```yaml
- name: Build and push filmapi
  uses: docker/build-push-action@v4
  with:
    context: ./backend
    file: ./backend/FilmAPI/Dockerfile
    push: true
    tags: |
      ${{ env.ACR_LOGIN_SERVER }}/filmapi:main-${{ github.sha }}
      ${{ env.ACR_LOGIN_SERVER }}/filmapi:latest
```

---

## Environment Variables

### ACA vs docker-compose Differences

| Variable | docker-compose | ACA |
|----------|----------------|-----|
| DB_HOST | mariadb | mariadb-server |
| DB_PORT | 3306 | 3306 |
| ASPNETCORE_URLS | (default) | http://+:8080 |
| ASPNETCORE_ENVIRONMENT | Development | Production |
| FRONTEND_BASE_URL | http://localhost:5001 | https://cinema67.it |
| FILMAPI_UPSTREAM | filmapi:5000 | filmapi-app.internal.cinema67.azurecontainer.io:8080 |
| DATA_PROTECTION_KEYS_PATH | /app/dataprotection | /app/dataprotection |

### Setting Env Vars in ACA

```bash
# Create container app with env vars
az containerapp create \
    --env-vars \
        VAR1=value1 \
        VAR2=value2 \
        VAR3='multi word value' \
        VAR4='password!@#$%'

# Update existing app
az containerapp update \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --set-env-vars \
        JWT_SECRET='NewSecret123!' \
        DB_PASSWORD='NewPassword!'

# Remove env var
az containerapp update \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --remove-env-vars JWT_SECRET
```

---

## Volume Mounting

### Azure Files Share Configuration

```bash
# List file shares
az storage share list \
    --account-name cinebasestg \
    --account-key '<storage-key>'

# Create share (if not exists)
az storage share create \
    --account-name cinebasestg \
    --account-key '<storage-key>' \
    --name filmapi-media \
    --quota 1024  # 1GB
```

### Mount in Container App

```bash
az containerapp create \
    --storage-mounts mariadb-data \
    --environment-storage \
        name=mariadb-data \
        storage-type=AzureFile \
        storage-name=cinebasestg \
        storage-key='<storage-key>' \
        access-mode=ReadWrite \
        share-name=mariadb-data \
        mount-path=/var/lib/mysql
```

### Verify Mount

```bash
# Connect to container
az containerapp exec \
    --name mariadb-server \
    --resource-group cinebase-rg

# Inside container
$ ls -la /var/lib/mysql
# Should show files from Azure Files share
```

---

## Networking & Ingress

### Internal Ingress (docker network)

```bash
# MariaDB and FilmAPI: internal only
az containerapp create \
    --name mariadb-server \
    --ingress internal \
    --target-port 3306

# Internal DNS (ACA auto-creates)
# mariadb-server.internal.cinema67.azurecontainer.io:3306
# filmapi-app.internal.cinema67.azurecontainer.io:8080

# Test from another container:
curl http://mariadb-server:3306  # Internal DNS
curl http://filmapi-app:8080/health
```

### External Ingress (internet-facing)

```bash
az containerapp create \
    --name cinebase-web-app \
    --ingress external \
    --target-port 80

# Public FQDN
# cinebase-web-app.XXXX.azurecontainer.io
# (map cinema67.it CNAME to this)
```

### CORS & Proxying

**nginx.conf** (in cinebase-web):
```nginx
upstream filmapi {
    server filmapi-app.internal.cinema67.azurecontainer.io:8080;
}

location /api/ {
    proxy_pass http://filmapi;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## Health Probes

### HTTP Probe (FilmAPI)

```bash
az containerapp create \
    --health-probe-type http \
    --health-probe-path /health \
    --health-probe-port 8080 \
    --health-probe-interval 10s \
    --health-probe-timeout 3s \
    --health-probe-failure-count 3

# Behavior:
# - Every 10s, GET http://localhost:8080/health
# - If fails 3 consecutive times, mark unhealthy
# - Unhealthy replica removed from load balancing
# - If all replicas unhealthy, container restarts
```

### TCP Probe (MariaDB)

```bash
az containerapp create \
    --health-probe-type tcp \
    --health-probe-port 3306 \
    --health-probe-interval 10s \
    --health-probe-failure-count 3

# Behavior:
# - Every 10s, TCP connect to port 3306
# - If succeeds, probe passes
# - Useful for databases
```

### Startup Probe

```bash
az containerapp create \
    --health-probe-type http \
    --health-probe-path /health \
    --startup-probe true

# Behavior:
# - Don't route traffic until healthy
# - Useful for long startup times
# - Once healthy, switches to regular health probe
```

---

## Scaling & Autoscaling

### Manual Scaling

```bash
# Set fixed replicas
az containerapp update \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --min-replicas 1 \
    --max-replicas 1

# Or update to 2 replicas
az containerapp update \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --min-replicas 2 --max-replicas 2
```

### Autoscaling Rules

```bash
# CPU-based (80% CPU = scale up)
az containerapp create \
    --name filmapi-app \
    --min-replicas 1 \
    --max-replicas 3 \
    --scale \
        rule=cpu-rule \
        trigger-type=cpu \
        trigger-metadata='type=Utilization value=80' \
        scale-rule-type=PercentageChange \
        scale-rule-metadata='ScaleUpPercentage=50 ScaleDownPercentage=25'

# HTTP request-based
az containerapp create \
    --name cinebase-web-app \
    --min-replicas 1 \
    --max-replicas 3 \
    --scale \
        rule=http-rule \
        trigger-type=http \
        trigger-metadata='concurrentRequests=100'
```

---

## Monitoring & Logs

### View Container Logs

```bash
# Live logs (last 50 lines)
az containerapp logs show \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --tail 50

# Follow logs
az containerapp logs show \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --follow

# Specific time range
az containerapp logs show \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --since 30m  # Last 30 minutes
```

### App Insights / Log Analytics

```bash
# Query logs from Log Analytics
az monitor log-analytics query \
    --workspace cinema67-logs \
    --analytics-query \
    "ContainerAppSystemLogs_CL | where ContainerName_s == 'filmapi-app' | order by TimeGenerated desc | limit 10"

# Check container replicas
az containerapp replica list \
    --name filmapi-app \
    --resource-group cinebase-rg

# Output:
# Name            Status      Restarts    CPU    Memory    CreateTime
# filmapi-app-xx  Running     0           0.45   850Mi     2026-05-28T10:00:00
```

### Health Status

```bash
# Check app status
az containerapp show \
    --name filmapi-app \
    --resource-group cinebase-rg \
    --query "properties"

# Key fields:
# - provisioningState: Succeeded/Failed/InProgress
# - runningStatus: Running/Terminated/Waiting
# - replicas: [list of replica status]
```

---

**Document Version**: 1.0  
**Last Updated**: May 28, 2026
