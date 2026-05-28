# Fase 10: Domain & SSL Certificate Configuration

## Overview
This guide configures cinema67.it domain with Azure managed SSL certificate and container app ingress.

## Prerequisites
- Azure Container Apps deployed (Fase 9 completed)
- cinema67.it domain registered and accessible via DNS
- Azure subscription with permissions to manage DNS and managed certificates

## Configuration Steps

### 1. Get Cinema67 Web App FQDN

```bash
RESOURCE_GROUP="cinema67-rg"
WEB_FQDN=$(az containerapp show \
    --name cinema67-web-app \
    --resource-group "$RESOURCE_GROUP" \
    --environment "cinema67-env" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

echo "Cinema67 Web FQDN: $WEB_FQDN"
```

### 2. Configure DNS CNAME (Manual via Registrar)

Log in to your domain registrar and create a DNS CNAME record:

| Field | Value |
|-------|-------|
| Name | cinema67.it |
| Type | CNAME |
| Target | `<WEB_FQDN from step 1>` |
| TTL | 300 (or default) |

**Example:**
```
cinema67.it  CNAME  cinema67-web-app.italynorth.azurecontainerapps.io
```

**Wait:** Allow 5-15 minutes for DNS propagation.

**Verify DNS:**
```bash
nslookup cinema67.it
# or
dig cinema67.it +short
```

### 3. Create Azure Managed Certificate

Create an Azure managed certificate for cinema67.it:

```bash
RESOURCE_GROUP="cinema67-rg"
LOCATION="italynorth"

az containerapp hostname bind \
    --resource-group "$RESOURCE_GROUP" \
    --container-app-name "cinema67-web-app" \
    --hostname "cinema67.it" \
    --environment "cinema67-env"
```

**Expected output:**
- Certificate automatically created and validated
- Certificate auto-renewal enabled
- No manual validation required (Azure auto-validates CNAME ownership)

### 4. Enable HTTPS Ingress

Update ingress to use HTTPS and enable certificate binding:

```bash
RESOURCE_GROUP="cinema67-rg"

az containerapp ingress update \
    --name cinema67-web-app \
    --resource-group "$RESOURCE_GROUP" \
    --type external \
    --allow-insecure false \
    --target-port 80
```

### 5. Verify HTTPS Configuration

Test HTTPS endpoint:

```bash
# Should return HTTP 200
curl -I https://cinema67.it/

# Check certificate details
openssl s_client -connect cinema67.it:443 -showcerts < /dev/null | \
    grep "subject="
```

### 6. Update OAuth Redirect URIs

Update Google and Microsoft OAuth applications with new redirect URI:

**Google Cloud Console:**
1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials)
2. Edit OAuth app → Authorized redirect URIs
3. Add: `https://cinema67.it/callback`
4. Save

**Microsoft Entra Portal:**
1. Go to [App registrations](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps)
2. Select app → Redirect URIs
3. Add: `https://cinema67.it/callback` (Web platform)
4. Save

### 7. Update Environment Variables

Update backend container app with production OAuth credentials:

```bash
RESOURCE_GROUP="cinema67-rg"

az containerapp update \
    --name filmapi-app \
    --resource-group "$RESOURCE_GROUP" \
    --set-env-vars \
        "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" \
        "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}" \
        "MICROSOFT_CLIENT_ID=${MICROSOFT_CLIENT_ID}" \
        "MICROSOFT_CLIENT_SECRET=${MICROSOFT_CLIENT_SECRET}"
```

### 8. Update Frontend Configuration

Update frontend environment variable (FILMAPI_UPSTREAM already internal):

```bash
# Already set during deployment, but verify:
RESOURCE_GROUP="cinema67-rg"

az containerapp show \
    --name cinema67-web-app \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.template.containers[0].env" -o jsonc | \
    grep -A2 "FILMAPI_UPSTREAM"
```

### 9. Verify End-to-End HTTPS

Test full chain:

```bash
# 1. Test frontend is accessible
curl -I https://cinema67.it/

# 2. Test API through reverse proxy
curl -I https://cinema67.it/api/films

# 3. Test /health endpoints
curl -s https://cinema67.it/health | jq .
curl -s https://cinema67.it/api/health | jq .

# 4. Test OAuth login redirect
# Open https://cinema67.it in browser → login should work
```

## Certificate Management

### Auto-Renewal
- Azure automatically renews managed certificates 30 days before expiration
- No manual action required
- Renewal history in Azure Portal → Container Apps → Certificates

### Monitor Certificate Status

```bash
RESOURCE_GROUP="cinema67-rg"

# Get certificate details
az containerapp hostname list \
    --name cinema67-web-app \
    --resource-group "$RESOURCE_GROUP" \
    --environment "cinema67-env" -o jsonc
```

### Troubleshooting Certificates

**Certificate binding fails:**
```bash
# Check DNS CNAME exists and resolves
nslookup cinema67.it

# Verify container app is healthy
az containerapp show \
    --name cinema67-web-app \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.runningStatus" -o tsv
```

**HTTPS returns 404:**
- Frontend nginx.conf must have server_name configured
- Update frontend ingress hostname binding with `--hostname cinema67.it`

**Mixed content warnings in browser:**
- Ensure all frontend resources (JS, CSS, images) load over HTTPS
- Update API calls to use https:// in production builds

## Security Checklist

- [ ] DNS CNAME points to Cinema67 FQDN
- [ ] Azure managed certificate created and validated
- [ ] HTTPS ingress enabled (allow-insecure false)
- [ ] OAuth redirect URIs updated (Google + Microsoft)
- [ ] Environment variables updated with production credentials
- [ ] /health endpoints respond with 200 OK
- [ ] Certificate auto-renewal verified in Azure Portal
- [ ] Security headers present in nginx response
- [ ] HSTS enabled in nginx.conf (if not already)
- [ ] Rate limiting active on /login and /api endpoints

## Rollback Plan

If SSL certificate binding fails:

```bash
RESOURCE_GROUP="cinema67-rg"

# Remove hostname binding (revert to auto-generated FQDN)
az containerapp hostname unbind \
    --resource-group "$RESOURCE_GROUP" \
    --container-app-name "cinema67-web-app" \
    --hostname "cinema67.it" \
    --environment "cinema67-env"

# Verify ingress reverts to FQDN
az containerapp show \
    --name cinema67-web-app \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv
```

---

**Related Documents:**
- [AZURE_SETUP.sh](../../AZURE_SETUP.sh) - Infrastructure provisioning
- [DEPLOY_ACA.sh](../../DEPLOY_ACA.sh) - Container app deployment
- [docker-compose.yml](../../docker-compose.yml) - Local development
- [nginx.conf](../../frontend/Cinema67.Web/nginx.conf) - Reverse proxy config
