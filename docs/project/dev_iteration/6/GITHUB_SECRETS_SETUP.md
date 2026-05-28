# GitHub Secrets for Iterazione 6 Deployment

## Required Secrets for CI/CD

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

### Azure Container Registry (ACR)

- **`ACR_LOGIN_SERVER`**: URL della registry (es. `myregistry.azurecr.io`)
- **`ACR_USERNAME`**: Nome utente ACR (admin account)
- **`ACR_PASSWORD`**: Password ACR (admin account)

How to find:
```bash
az acr show --name <registry-name> --query loginServer
az acr credential show --name <registry-name>
```

### Azure Credentials (Service Principal)

- **`AZURE_CREDENTIALS`**: JSON blob con credenziali Service Principal

How to create:
```bash
az ad sp create-for-rbac --name "film-app-ci" --role "Contributor" --scopes "/subscriptions/<SUBSCRIPTION_ID>"
```

Output JSON:
```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "..."
}
```

This goes into `AZURE_CREDENTIALS` secret.

### Azure Resource Details

- **`AZURE_RESOURCE_GROUP`**: Nome resource group (es. `film-app-rg`)
- **`AZURE_SUBSCRIPTION_ID`**: ID subscription Azure

## Workflow Execution

The workflow triggers on:
- ✅ Push to `main` branch → Builds + Deploys
- ✅ Pull Request to `main` → Builds only (no deploy)

## Steps in Workflow

### Build & Push Job
1. Checkout code
2. Setup .NET 9 SDK
3. Restore NuGet packages
4. Publish FilmAPI (`dotnet publish -c Release -o backend/publish`)
5. Login to ACR
6. Build FilmAPI Docker image (uses `backend/publish`)
7. Build CineBase.Web Docker image
8. Push both images to ACR with tags:
   - `main-<SHA>` (specific commit)
   - `latest` (most recent)

### Deploy Job (only on main push)
1. Azure login
2. Update `filmapi-app` container with new image
3. Update `cinebase-web-app` container with new image
4. Wait for deployments ready (max 5 minutes)
5. Run smoke tests (optional, continues on error)
6. Report deployment summary

## Environment Variables in Workflow

Images are tagged with:
- `<ACR>/filmapi:main-<COMMIT_SHA>`
- `<ACR>/cinebase-web:main-<COMMIT_SHA>`
- `<ACR>/filmapi:latest`
- `<ACR>/cinebase-web:latest`

## Testing Locally

To test workflow locally (optional):
```bash
# 1. Build backend
cd backend/FilmAPI
dotnet publish -c Release -o ../publish

# 2. Build images
cd ../..
docker-compose build

# 3. Simulate deploy
docker-compose up -d
```

## Troubleshooting

**Build fails on dotnet restore**:
- Check .NET 9 is installed
- Verify NuGet credentials if using private feeds

**Image push fails**:
- Verify ACR credentials are correct
- Check `ACR_LOGIN_SERVER` format (must match output of `az acr show`)

**Deployment fails**:
- Verify container apps exist in Azure
- Check AZURE_CREDENTIALS are valid
- Verify resource group name matches

**Smoke tests fail**:
- Normal for first deploy (apps still initializing)
- Check Azure Portal for container app status
- Test manually: `curl https://<FQDN>/health`
