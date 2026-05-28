#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CineBase Azure Container Apps Deploy${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Configuration from environment or defaults
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-cinebase-rg}"
LOCATION="${AZURE_LOCATION:-italynorth}"
ACA_ENVIRONMENT="${AZURE_CONTAINER_APPS_ENVIRONMENT:-cinema67-env}"
ACR_LOGIN_SERVER="${ACR_LOGIN_SERVER:-cinebaseacr.azurecr.io}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-cinebasestg}"

# Image versions
FILMAPI_IMAGE="${ACR_LOGIN_SERVER}/filmapi:${FILMAPI_TAG:-main-latest}"
CINEBASE_WEB_IMAGE="${ACR_LOGIN_SERVER}/cinebase-web:${CINEBASE_TAG:-main-latest}"
MARIADB_IMAGE="mariadb:11.4-alpine"

# Get storage account key
echo -e "${YELLOW}Retrieving storage account key...${NC}"
STORAGE_KEY=$(az storage account keys list \
    --resource-group "$RESOURCE_GROUP" \
    --account-name "$STORAGE_ACCOUNT" \
    --query "[0].value" -o tsv)

if [ -z "$STORAGE_KEY" ]; then
    echo -e "${RED}✗ Failed to retrieve storage account key${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Storage key retrieved${NC}"

# Get storage account connection string
STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=${STORAGE_ACCOUNT};AccountKey=${STORAGE_KEY};EndpointSuffix=core.windows.net"

# ══════════════════════════════════════════════════════════════════════
# Deploy MariaDB Container App
# ══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}=== Deploying MariaDB Server ===${NC}"

# Check if mariadb-server app already exists
if az containerapp show \
    --name mariadb-server \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ACA_ENVIRONMENT" &>/dev/null; then
    echo -e "${GREEN}✓ MariaDB container app already exists, updating...${NC}"
    
    az containerapp update \
        --name mariadb-server \
        --resource-group "$RESOURCE_GROUP" \
        --image "$MARIADB_IMAGE"
else
    echo -e "${YELLOW}Creating MariaDB container app...${NC}"
    
    az containerapp create \
        --name mariadb-server \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$ACA_ENVIRONMENT" \
        --image "$MARIADB_IMAGE" \
        --cpu 1.0 \
        --memory 2.0Gi \
        --ingress internal \
        --target-port 3306 \
        --environment-variables \
            "MARIADB_ROOT_PASSWORD=${DB_PASSWORD:-root}" \
            "MARIADB_DATABASE=${DB_NAME:-film-api-db}" \
            "MARIADB_USER=${DB_USER:-root}" \
            "MARIADB_PASSWORD=${DB_PASSWORD:-root}" \
        --volume-mounts "mariadb-data:/var/lib/mysql" \
        --volumes "mariadb-data:azureFile:mariadb-data" \
        --registry-server "$ACR_LOGIN_SERVER" \
        --registry-username "$(az acr credential show -n "${ACR_LOGIN_SERVER%%.*}" --query "username" -o tsv)" \
        --registry-password "$(az acr credential show -n "${ACR_LOGIN_SERVER%%.*}" --query "passwords[0].value" -o tsv)" \
        --min-replicas 1 \
        --max-replicas 1 \
        --health-probe-path "" \
        --health-probe-protocol tcp \
        --health-probe-port 3306 \
        --health-probe-initial-delay 30 \
        --health-probe-interval 10
    
    echo -e "${GREEN}✓ MariaDB container app created${NC}"
fi

# Get MariaDB internal FQDN for connection
MARIADB_FQDN=$(az containerapp show \
    --name mariadb-server \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ACA_ENVIRONMENT" \
    --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null || echo "mariadb-server.internal.${LOCATION}.azurecontainerapps.io")

echo "MariaDB FQDN: $MARIADB_FQDN"

# ══════════════════════════════════════════════════════════════════════
# Deploy FilmAPI Backend Container App
# ══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}=== Deploying FilmAPI Backend ===${NC}"

# Read environment variables from .env if available
if [ -f "./.env" ]; then
    # Source .env but be safe about it (don't export all)
    set -a
    source ./.env
    set +a
fi

if az containerapp show \
    --name filmapi-app \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ACA_ENVIRONMENT" &>/dev/null; then
    echo -e "${GREEN}✓ FilmAPI container app already exists, updating...${NC}"
    
    az containerapp update \
        --name filmapi-app \
        --resource-group "$RESOURCE_GROUP" \
        --image "$FILMAPI_IMAGE"
else
    echo -e "${YELLOW}Creating FilmAPI container app...${NC}"
    
    # Build environment variables string
    ENV_VARS=(
        "ASPNETCORE_ENVIRONMENT=Production"
        "DB_HOST=mariadb-server.internal.${LOCATION}.azurecontainerapps.io"
        "DB_PORT=3306"
        "DB_NAME=${DB_NAME:-film-api-db}"
        "DB_USER=${DB_USER:-root}"
        "DB_PASSWORD=${DB_PASSWORD:-root}"
        "DB_USE_AUTODETECT=true"
        "JWT_SECRET=${JWT_SECRET:-SuperSecretKeyForCinema67JWTAuth2026!}"
        "JWT_ISSUER=${JWT_ISSUER:-Cinema67API}"
        "JWT_AUDIENCE=${JWT_AUDIENCE:-Cinema67Web}"
        "DATA_PROTECTION_KEYS_PATH=/var/lib/dataprotection"
        "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}"
        "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}"
        "MICROSOFT_CLIENT_ID=${MICROSOFT_CLIENT_ID:-}"
        "MICROSOFT_CLIENT_SECRET=${MICROSOFT_CLIENT_SECRET:-}"
        "TMDB_BEARER_TOKEN=${TMDB_BEARER_TOKEN:-}"
        "STRIPE_SECRET_API_KEY=${STRIPE_SECRET_API_KEY:-}"
        "STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY:-}"
        "PAYPAL_MODE=${PAYPAL_MODE:-sandbox}"
        "PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID:-}"
        "PAYPAL_SECRET=${PAYPAL_SECRET:-}"
        "SMTP_HOST=${SMTP_HOST:-}"
        "SMTP_PORT=${SMTP_PORT:-587}"
        "SMTP_USER=${SMTP_USER:-}"
        "SMTP_PASSWORD=${SMTP_PASSWORD:-}"
        "SMTP_FROM=${SMTP_FROM:-}"
    )
    
    az containerapp create \
        --name filmapi-app \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$ACA_ENVIRONMENT" \
        --image "$FILMAPI_IMAGE" \
        --cpu 2.0 \
        --memory 4.0Gi \
        --ingress internal \
        --target-port 5000 \
        --environment-variables "${ENV_VARS[@]}" \
        --volume-mounts "filmapi-dataprotection:/var/lib/dataprotection" \
        --volumes "filmapi-dataprotection:azureFile:filmapi-dataprotection" \
        --registry-server "$ACR_LOGIN_SERVER" \
        --registry-username "$(az acr credential show -n "${ACR_LOGIN_SERVER%%.*}" --query "username" -o tsv)" \
        --registry-password "$(az acr credential show -n "${ACR_LOGIN_SERVER%%.*}" --query "passwords[0].value" -o tsv)" \
        --min-replicas 1 \
        --max-replicas 3 \
        --health-probe-path "/health" \
        --health-probe-protocol http \
        --health-probe-port 5000 \
        --health-probe-initial-delay 30 \
        --health-probe-interval 10
    
    echo -e "${GREEN}✓ FilmAPI container app created${NC}"
fi

# Get FilmAPI internal FQDN
FILMAPI_FQDN=$(az containerapp show \
    --name filmapi-app \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ACA_ENVIRONMENT" \
    --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null || echo "filmapi-app.internal.${LOCATION}.azurecontainerapps.io")

echo "FilmAPI FQDN: $FILMAPI_FQDN"

# ══════════════════════════════════════════════════════════════════════
# Deploy CineBase Frontend Container App
# ══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}=== Deploying CineBase Frontend ===${NC}"

if az containerapp show \
    --name cinebase-web-app \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ACA_ENVIRONMENT" &>/dev/null; then
    echo -e "${GREEN}✓ CineBase Web container app already exists, updating...${NC}"
    
    az containerapp update \
        --name cinebase-web-app \
        --resource-group "$RESOURCE_GROUP" \
        --image "$CINEBASE_WEB_IMAGE"
else
    echo -e "${YELLOW}Creating CineBase Web container app...${NC}"
    
    # Frontend environment variables
    FRONTEND_ENV_VARS=(
        "ASPNETCORE_ENVIRONMENT=Production"
        "FILMAPI_UPSTREAM=http://filmapi-app.internal.${LOCATION}.azurecontainerapps.io:5000"
        "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}"
        "MICROSOFT_CLIENT_ID=${MICROSOFT_CLIENT_ID:-}"
    )
    
    az containerapp create \
        --name cinebase-web-app \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$ACA_ENVIRONMENT" \
        --image "$CINEBASE_WEB_IMAGE" \
        --cpu 1.0 \
        --memory 2.0Gi \
        --ingress external \
        --target-port 80 \
        --environment-variables "${FRONTEND_ENV_VARS[@]}" \
        --registry-server "$ACR_LOGIN_SERVER" \
        --registry-username "$(az acr credential show -n "${ACR_LOGIN_SERVER%%.*}" --query "username" -o tsv)" \
        --registry-password "$(az acr credential show -n "${ACR_LOGIN_SERVER%%.*}" --query "passwords[0].value" -o tsv)" \
        --min-replicas 1 \
        --max-replicas 3 \
        --health-probe-path "/health" \
        --health-probe-protocol http \
        --health-probe-port 80 \
        --health-probe-initial-delay 30 \
        --health-probe-interval 10
    
    echo -e "${GREEN}✓ CineBase Web container app created${NC}"
fi

# Get CineBase Web external FQDN
WEB_FQDN=$(az containerapp show \
    --name cinebase-web-app \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ACA_ENVIRONMENT" \
    --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null || echo "cinebase-web-app.${LOCATION}.azurecontainerapps.io")

echo "CineBase Web FQDN: $WEB_FQDN"

# ══════════════════════════════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Container Apps Status:${NC}"
for APP in mariadb-server filmapi-app cinebase-web-app; do
    STATUS=$(az containerapp show \
        --name "$APP" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$ACA_ENVIRONMENT" \
        --query "properties.runningStatus" -o tsv 2>/dev/null || echo "Unknown")
    echo "  • $APP: $STATUS"
done

echo ""
echo -e "${YELLOW}FQDNs:${NC}"
echo "  • MariaDB (internal): mariadb-server.internal.${LOCATION}.azurecontainerapps.io"
echo "  • FilmAPI (internal): filmapi-app.internal.${LOCATION}.azurecontainerapps.io"
echo "  • CineBase Web (external): https://$WEB_FQDN"

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Update DNS CNAME for cinema67.it → $WEB_FQDN"
echo "  2. Configure Azure managed SSL certificate for cinema67.it"
echo "  3. Update OAuth redirect URIs:"
echo "     - Google: https://cinema67.it/callback"
echo "     - Microsoft: https://cinema67.it/callback"
echo "  4. Run smoke tests from GitHub Actions or local environment"
echo "  5. Monitor logs: az containerapp logs show -n cinebase-web-app"
echo ""
