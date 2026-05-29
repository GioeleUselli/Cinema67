# Cinema67 Azure ACA Deployment

## Prerequisiti
- Azure CLI con estensione `containerapp`
- Accesso ad Azure subscription
- ACR `cinema67acr.azurecr.io` con immagini:
  - `cinema67acr.azurecr.io/filmapi:latest`
  - `cinema67acr.azurecr.io/cinema67-web:latest`

## Container Apps

| App | Ruolo | Ingress | Porta | Immagine |
|-----|-------|---------|-------|----------|
| mariadb-server | Database | Internal | 3306 | mariadb:10.11 |
| filmapi-app | Backend API | External | 8080 | cinema67acr.azurecr.io/filmapi |
| cinema67-frontend | Frontend | External | 8080 | cinema67acr.azurecr.io/cinema67-web |

## Domini

| Dominio | Target | Certificato |
|---------|--------|-------------|
| www.cinema67.it | cinema67-frontend | Managed (mc-cinema67-rg-www-cinema67-it-6324) |
| api.cinema67.it | filmapi-app | Managed (mc-cinema67-rg-api-cinema67-it-3010) |

## Comandi di Deploy

```bash
# Frontend
az containerapp create --name cinema67-frontend --resource-group cinema67-rg \
  --environment cinema67-env --image cinema67acr.azurecr.io/cinema67-web:latest \
  --ingress external --target-port 8080 --registry-server cinema67acr.azurecr.io \
  --registry-username <ACR_USER> --registry-password <ACR_PASS> \
  --cpu 1.0 --memory 2.0Gi --min-replicas 1 --max-replicas 3 \
  --env-vars "API_BASE_URL=https://api.cinema67.it" "MEDIA_BASE_URL=https://api.cinema67.it"

# Backend
az containerapp create --name filmapi-app --resource-group cinema67-rg \
  --environment cinema67-env --image cinema67acr.azurecr.io/filmapi:latest \
  --ingress external --target-port 8080 --registry-server cinema67acr.azurecr.io \
  --registry-username <ACR_USER> --registry-password <ACR_PASS> \
  --cpu 2.0 --memory 4.0Gi --min-replicas 1 --max-replicas 3 \
  --env-vars "DB_HOST=<MDB_FQDN>" "DB_PORT=3306" ...

# Hostname bind
az containerapp hostname bind -n filmapi-app -g cinema67-rg \
  --hostname api.cinema67.it -e cinema67-env --validation-method CNAME
az containerapp hostname bind -n cinema67-frontend -g cinema67-rg \
  --hostname www.cinema67.it -e cinema67-env --validation-method CNAME
```

## YAML Manifests (alternativa)

- `azure/aca/10-mariadb.containerapp.yaml`
- `azure/aca/20-filmapi.containerapp.yaml`
- `azure/aca/40-cinema67-web.containerapp.yaml`
