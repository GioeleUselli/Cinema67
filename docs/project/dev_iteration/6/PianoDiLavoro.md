# Iterazione 6: Containerizzazione e Deployment su Azure
## Piano di Lavoro Dettagliato

**Versione**: 1.0  
**Data**: May 28, 2026  
**Status**: DRAFT → IMPLEMENTATION  
**Autore**: OpenCode  
**Durata Stimata**: ~24 ore (full-time ~3 giorni lavorativi)

---

## Indice
1. [Executive Summary](#executive-summary)
2. [Vincoli Vincolanti](#vincoli-vincolanti)
3. [Architettura Globale](#architettura-globale)
4. [Specifica Tecnica](#specifica-tecnica)
5. [11 Fasi di Implementazione](#11-fasi-di-implementazione)
6. [Checklist Dettagliata](#checklist-dettagliata)
7. [Strategia di Testing](#strategia-di-testing)
8. [Troubleshooting Guida](#troubleshooting-guida)
9. [Acceptance Criteria](#acceptance-criteria)
10. [Appendice: Code Snippets](#appendice-code-snippets)

---

## Executive Summary

**Obiettivo Iterazione 6**:
Implementare containerizzazione completa di CineBase con deployment locale (docker-compose) e su Azure Container Apps (ACA) con CI/CD via GitHub Actions, mantenendo data persistence, configurazione centralizzata via environment variables, e HTTPS per cinema67.it.

**Deliverables Principali**:
- ✅ Dockerfile multistage (backend + frontend) con alpine runtime, non-root user, healthcheck
- ✅ docker-compose.yml per startup locale con `docker-compose up` singolo comando
- ✅ Nginx reverse proxy (frontend → backend proxy + static files + SPA routing)
- ✅ docker-entrypoint.sh con wait loop, EF migrations, idempotent seeding
- ✅ GitHub Actions CI/CD (build → ACR → ACA deployment)
- ✅ Azure Infrastructure: resource group, ACR, ACA environment, Log Analytics, Azure Files
- ✅ .env centralizzato con documentazione Development/Docker/Production sections
- ✅ Seeder idempotente (skip duplicates, admin account auto-creation)
- ✅ Domain setup (cinema67.it → ACA FQDN, SSL managed certificate)
- ✅ Testing strategy locale + Azure end-to-end

**Scope OUT**:
- Non sostituisce Iterazione 5 (auth/security), ma la abilita al deployment
- Non include Helm, Terraform, o GitOps
- Non include Azure Database for MySQL (usa MariaDB container con Azure Files)
- Non include HA/failover avanzato (1 replica per MariaDB, 1-3 per app containers)

---

## Vincoli Vincolanti

1. **Segretezza**: Nessun secret hardcodato in Dockerfile/docker-compose; usare environment variables + Azure Key Vault/GitHub Secrets
2. **Startup Singolo Comando**: `docker-compose up` avvia tutto (DB + backend + frontend) con health checks e dependency ordering
3. **Data Persistence**: Named volumes locali (docker-compose) + Azure Files (ACA); survive container restart/redeploy
4. **Database Initialization**: EF migrations auto-run su primo startup; idempotent seeding con skip se admin/films già esistono
5. **Seeder Idempotente**: Admin creato da env vars (ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD); skip se email già presente
6. **Configurazione Centralizzata**: .env.example documenta Development/Docker/Azure sections; una sola fonte di verità
7. **Image Size**: Backend < 300MB, Frontend < 50MB (alpine base, multistage builds)
8. **Non-Root User**: Backend (app:app), Frontend (nginx:nginx); no privilege escalation
9. **Health Checks**: HTTP /health endpoint (backend); curl check (docker-compose); ACA health probe config
10. **SSL/TLS Managed**: Azure managed certificate (auto-renewal) per cinema67.it; no self-signed
11. **Session Affinity**: Multi-instance backend (1-3 replicas) con Data Protection keys shared via Azure Files

---

## Architettura Globale

### Architettura Locale (docker-compose)

```
┌─────────────────────────────────────────────────────────────┐
│ Docker Compose (Local Development)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  cinema67-network (bridge)                                  │
│  ├── cinebase-web (Port 5001)                              │
│  │   └── Nginx (reverse proxy) → localhost:5000/api       │
│  │   └── Static files (/var/www/cinebase)                 │
│  │   └── Volume: filmapi-dataprotection (for cookies)      │
│  │                                                          │
│  ├── filmapi (Port 5000)                                   │
│  │   └── .NET 9 ASP.NET Core                              │
│  │   └── Health check: curl http://localhost:5000/health  │
│  │   └── Volumes: filmapi-media, filmapi-dataprotection   │
│  │   └── Depends on: mariadb (healthy)                    │
│  │                                                          │
│  └── mariadb (Port 3306)                                   │
│      └── MariaDB 11.4                                      │
│      └── Health check: mariadb-admin ping                 │
│      └── Volume: mariadb-data (persist /var/lib/mysql)    │
│      └── Init: DB_NAME=cinebase, root password, app user │
│                                                              │
│  Named Volumes (persist between down/up):                  │
│  ├── mariadb-data (5GB)                                    │
│  ├── filmapi-media (1GB, user uploads)                     │
│  └── filmapi-dataprotection (shared keys for multi-app)    │
│                                                              │
│  Environment: .env (sourced by docker-compose.yml)         │
│  ├── DB_HOST=mariadb, DB_PORT=3306, DB_NAME=cinebase     │
│  ├── ASPNETCORE_ENVIRONMENT=Development                   │
│  ├── JWT_SECRET, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD   │
│  └── SMTP, Stripe, TMDB tokens                            │
└─────────────────────────────────────────────────────────────┘
```

### Architettura Azure (ACA)

```
┌─────────────────────────────────────────────────────────────┐
│ Azure Container Apps (Production)                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Resource Group: cinebase-rg (italynorth)                  │
│  ├── ACR: cinebase-acr.azurecr.io                          │
│  │   ├── cinebase-acr/filmapi:main-sha1234567 (285MB)     │
│  │   ├── cinebase-acr/cinebase-web:main-sha7890abc (45MB) │
│  │   └── Source: GitHub Actions CI/CD (on main push)      │
│  │                                                          │
│  ├── ACA Environment: cinema67-env (italynorth)            │
│  │   ├── Log Analytics Workspace (monitoring, diagnostics) │
│  │   ├── Vnet Integration (internal DNS cinema67.internal) │
│  │   └── Image pull secret (ACR credentials)              │
│  │                                                          │
│  ├── Container App #1: mariadb-server                      │
│  │   ├── Image: mariadb:11.4                              │
│  │   ├── Replicas: 1 (no HA; data via Azure Files)        │
│  │   ├── Memory: 2Gi, CPU: 1                              │
│  │   ├── Ingress: Internal (port 3306)                    │
│  │   ├── FQDN: mariadb-server.internal.cinema67.aca...    │
│  │   ├── Health Probe: TCP 3306                           │
│  │   ├── Volumes: mariadb-data (Azure Files, 5GB)         │
│  │   └── Env Vars: MARIADB_ROOT_PASSWORD, MARIADB_DATABASE│
│  │                                                          │
│  ├── Container App #2: filmapi-app                         │
│  │   ├── Image: cinebase-acr/filmapi:main-shaXXX         │
│  │   ├── Replicas: 1-3 (autoscale)                        │
│  │   ├── Memory: 1Gi, CPU: 0.5-1                          │
│  │   ├── Ingress: Internal (port 8080)                    │
│  │   ├── FQDN: filmapi-app.internal.cinema67.aca...       │
│  │   ├── Health Probe: HTTP GET /health (200)             │
│  │   ├── Volumes: filmapi-dataprotection (Azure Files)    │
│  │   ├── Env Vars: DB_HOST=mariadb-server, JWT_SECRET,... │
│  │   └── Data Protection: /app/dataprotection (shared)    │
│  │                                                          │
│  ├── Container App #3: cinebase-web-app                    │
│  │   ├── Image: cinebase-acr/cinebase-web:main-shaYYY    │
│  │   ├── Replicas: 1-3 (autoscale)                        │
│  │   ├── Memory: 512Mi, CPU: 0.25-0.5                     │
│  │   ├── Ingress: External (port 80/443)                  │
│  │   ├── FQDN: cinema67.azurecontainer.io → cinema67.it   │
│  │   ├── Health Probe: HTTP GET / (302 redirect OK)       │
│  │   ├── Session Affinity: Sticky (TCP affinity)          │
│  │   ├── nginx.conf: upstream filmapi-app:8080            │
│  │   └── Env Vars: FRONTEND_BASE_URL=https://cinema67.it  │
│  │                                                          │
│  ├── Azure Files (Storage Account):                        │
│  │   ├── File Share mariadb-data (5GB, RW)               │
│  │   │   └── Mounted as /var/lib/mysql in mariadb-server  │
│  │   └── File Share filmapi-dataprotection (1GB, RW)      │
│  │       └── Mounted as /app/dataprotection in filmapi    │
│  │                                                          │
│  └── DNS + SSL:                                            │
│      ├── CNAME cinema67.it → cinema67.azurecontainer.io   │
│      └── Azure Managed Certificate (auto-renewal)         │
│                                                              │
│  GitHub Actions CI/CD Pipeline:                           │
│  ├── Trigger: push to main branch                         │
│  ├── Job 1 (build-and-push):                              │
│  │   ├── Docker Buildx (multistage)                       │
│  │   ├── ACR login + image push (tag: main-<git-sha>)    │
│  │   └── Output: image digests                            │
│  ├── Job 2 (deploy-to-aca):                               │
│  │   ├── Azure login (Service Principal)                  │
│  │   ├── az containerapp update (3 apps)                  │
│  │   ├── Health check polling (5 min timeout)             │
│  │   ├── Smoke tests (curl /health, /api/films)           │
│  │   └── Output: deployment summary                       │
│  └── Secrets: ACR_LOGIN_SERVER, ACR_USERNAME, ACR_PASSWORD│
│      AZURE_CREDENTIALS (SP JSON), RESOURCE_GROUP, etc.    │
└─────────────────────────────────────────────────────────────┘
```

### Data Protection Keys Strategy

**Problema**: ASP.NET Core cookie encryption (Data Protection API). Multi-instance backend in ACA necessita condivisione delle chiavi.

**Soluzione**:
- **Locale** (docker-compose): Named volume `filmapi-dataprotection` condiviso
- **Azure**: Azure Files file share `filmapi-dataprotection` montato in `/app/dataprotection`
- **Configurazione** (Program.cs):
  ```csharp
  var dataProtectionPath = Environment.GetEnvironmentVariable("DATA_PROTECTION_KEYS_PATH");
  if (!string.IsNullOrEmpty(dataProtectionPath))
  {
      services.AddDataProtection()
          .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath));
  }
  ```

---

## Specifica Tecnica

### 1. Dockerfile Backend (FilmAPI)

**Percorso**: `backend/FilmAPI/Dockerfile`

**Requisiti**:
- Multistage: SDK alpine (build) → runtime alpine (runtime)
- Base images: mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19 (build), mcr.microsoft.com/dotnet/aspnet:9.0-alpine3.19 (runtime)
- Non-root user: `app:app` (uid 1000)
- Health check: `curl http://localhost:5000/health`
- Expose: 5000 (interno docker-compose), 8080 (interno ACA)
- Entrypoint: docker-entrypoint.sh (wait loop, migrations, seeder)
- Working dir: `/app`
- Image size target: < 300MB

**Fasi Build**:
1. **Builder Stage**: FROM dotnet/sdk:9.0-alpine3.19
   - WORKDIR /src
   - COPY backend/FilmAPI/*.csproj .
   - RUN dotnet restore
   - COPY backend/ .
   - RUN dotnet publish -c Release -o /app/publish --no-restore
   - RUN dotnet tool install --global dotnet-ef (per migrations)

2. **Runtime Stage**: FROM dotnet/aspnet:9.0-alpine3.19
   - Install curl per health check
   - Create non-root user `app:app`
   - WORKDIR /app
   - COPY --from=builder /app/publish .
   - Copy docker-entrypoint.sh + chmod +x
   - ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]
   - HEALTHCHECK: curl http://localhost:5000/health

### 2. Dockerfile Frontend (CineBase.Web)

**Percorso**: `frontend/CineBase.Web/Dockerfile`

**Requisiti**:
- Multistage: SDK alpine (build) → nginx alpine (runtime)
- Base images: mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19 (build), nginx:alpine
- Non-root user: nginx:nginx (default nginx user)
- Health check: `curl http://localhost/health` (nginx returns 200)
- Expose: 80 (HTTP, reverse proxy)
- Runtime: nginx con nginx.conf custom
- Image size target: < 50MB

**Fasi Build**:
1. **Builder Stage**: FROM dotnet/sdk:9.0-alpine3.19
   - WORKDIR /src
   - COPY frontend/CineBase.Web/*.csproj .
   - RUN dotnet restore
   - COPY frontend/CineBase.Web/ .
   - RUN dotnet publish -c Release -o /app/publish --no-restore

2. **Runtime Stage**: FROM nginx:alpine
   - Remove default nginx.conf
   - COPY frontend/CineBase.Web/nginx.conf /etc/nginx/nginx.conf
   - COPY --from=builder /app/publish/wwwroot /var/www/cinebase
   - EXPOSE 80
   - healthcheck: curl http://localhost/health
   - CMD ["nginx", "-g", "daemon off;"]

### 3. Nginx Configuration (nginx.conf)

**Percorso**: `frontend/CineBase.Web/nginx.conf`

**Comportamento**:
- Upstream `filmapi` (docker-compose) o `filmapi-app.internal.cinema67.azurecontainer.io` (ACA)
- Reverse proxy per `/api/*` → upstream backend
- Static files caching (Cache-Control: public, max-age=31536000 per /dist/*)
- SPA routing: try_files $uri /index.html (catch 404 → index.html per Angular routing)
- Security headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Strict-Transport-Security
- Rate limiting: 10r/s general, 5r/m per /api/auth/login
- Gzip compression: text/*, application/json, application/javascript
- /health endpoint per health check (return 200)

**Upstream Configuration**:
```nginx
upstream filmapi {
    # Local: filmapi:5000
    # Azure: filmapi-app.internal.cinema67.azurecontainer.io:8080
    server ${FILMAPI_UPSTREAM};
}
```

### 4. Docker Entrypoint Script

**Percorso**: `backend/docker-entrypoint.sh`

**Compiti**:
1. Wait loop per MariaDB health (timeout 60s)
   - Query: `mysql -h${DB_HOST} -u${DB_USER} -p${DB_PASSWORD} -e "SELECT 1"`
   - Retry ogni 5s fino a success o timeout
2. Run EF migrations: `dotnet ef database update`
3. Run seeder: `dotnet FilmApiSeeder.dll`
4. Exec application: `exec dotnet FilmAPI.dll`

**Variabili Environment Attese**:
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- ASPNETCORE_ENVIRONMENT

### 5. docker-compose.yml

**Percorso**: `docker-compose.yml` (root)

**Servizi**:
1. **mariadb**:
   - Image: mariadb:11.4
   - Container name: mariadb
   - Ports: 3306:3306
   - Environment: MARIADB_ROOT_PASSWORD, MARIADB_DATABASE, MARIADB_USER, MARIADB_PASSWORD
   - Volumes: mariadb-data:/var/lib/mysql
   - Health check: mariadb-admin ping
   - Networks: cinema67-network

2. **filmapi**:
   - Build: ./backend/FilmAPI/Dockerfile
   - Container name: filmapi
   - Ports: 5000:5000
   - Environment: (from .env) DB_HOST=mariadb, ASPNETCORE_ENVIRONMENT=Development, JWT_SECRET, etc.
   - Volumes: filmapi-media:/app/media, filmapi-dataprotection:/app/dataprotection
   - Depends on: mariadb (condition: service_healthy)
   - Health check: curl http://localhost:5000/health
   - Networks: cinema67-network

3. **cinebase-web**:
   - Build: ./frontend/CineBase.Web/Dockerfile
   - Container name: cinebase-web
   - Ports: 5001:80
   - Environment: (from .env) FILMAPI_UPSTREAM=filmapi:5000, ASPNETCORE_ENVIRONMENT=Development
   - Volumes: filmapi-dataprotection:/app/dataprotection (for session affinity)
   - Depends on: filmapi (condition: service_healthy)
   - Health check: curl http://localhost:5001/health
   - Networks: cinema67-network

**Named Volumes**:
- mariadb-data (5GB soft limit)
- filmapi-media (1GB soft limit)
- filmapi-dataprotection (shared, 500MB)

**Networks**:
- cinema67-network (bridge mode)

### 6. .env.example

**Struttura**: Documentato in sezioni Development/Docker/Azure per chiarezza

```env
# ============================================================================
# CineBase Environment Configuration
# ============================================================================
# This file documents ALL environment variables used by CineBase.
# Copy to .env and fill in values for your environment.
# DO NOT commit .env to version control (add to .gitignore).
#
# Sections:
#   1. DATABASE (MariaDB connection)
#   2. APPLICATION (ASP.NET Core settings)
#   3. AUTHENTICATION (JWT, OAuth)
#   4. EXTERNAL SERVICES (SMTP, Stripe, TMDB)
#   5. DOCKER-COMPOSE (Local development overrides)
#   6. AZURE (ACA deployment settings)
#
# ============================================================================

# ============================================================================
# 1. DATABASE CONFIGURATION
# ============================================================================
# All environments use MariaDB. Connection string auto-built from these vars.

# Docker Compose & Local Development
DB_HOST=localhost           # MariaDB host (docker-compose: "mariadb", ACA: "mariadb-server")
DB_PORT=3306               # MariaDB port
DB_NAME=cinebase           # Database name to create/use
DB_USER=cinebase_user      # Database user (non-root, app user)
DB_PASSWORD=YourSecurePass123!  # Database user password (CHANGE IN PRODUCTION)

# MariaDB Root (only used during container initialization)
MARIADB_ROOT_PASSWORD=RootSecurePass456!

# ============================================================================
# 2. APPLICATION CONFIGURATION
# ============================================================================

# ASP.NET Core Environment
# Development: detailed errors, hot reload, no HTTPS
# Production: minimal errors, optimized, HTTPS required
ASPNETCORE_ENVIRONMENT=Development

# Frontend Base URL (for CORS, OAuth redirects, etc.)
# Local: http://localhost:5001
# Docker Compose: http://localhost:5001
# Azure: https://cinema67.it
FRONTEND_BASE_URL=http://localhost:5001

# Backend Base URL (for frontend API calls)
# Local/Docker: http://localhost:5000 (or http://filmapi:5000 in compose)
# Azure: https://cinema67.it/api (through Nginx reverse proxy)
BACKEND_BASE_URL=http://localhost:5000

# Data Protection Keys Directory Path
# Local/Docker: /app/dataprotection (mounted volume)
# Azure: /app/dataprotection (mounted Azure Files share)
# Empty = in-process storage (not recommended for multi-instance)
DATA_PROTECTION_KEYS_PATH=/app/dataprotection

# ============================================================================
# 3. AUTHENTICATION
# ============================================================================

# JWT Token Configuration
JWT_SECRET=YourSuperSecretJwtKeyThatIsAtLeast32CharactersLong!!!
JWT_EXPIRES_IN_DAYS=7

# Admin Account (auto-created by seeder on first run)
ADMIN_SEED_EMAIL=admin@cinema67.it
ADMIN_SEED_PASSWORD=AdminInitialPassword123!

# OAuth - Google (register at https://console.cloud.google.com)
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth - Microsoft (register at https://portal.azure.com)
OAUTH_MICROSOFT_CLIENT_ID=your-microsoft-client-id
OAUTH_MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# ============================================================================
# 4. EXTERNAL SERVICES
# ============================================================================

# Email (SMTP) Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=noreply@cinema67.it
SMTP_PASSWORD=your-app-password

# Stripe Payment Processing (optional, for future bookings)
STRIPE_PUBLIC_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# TMDB API (The Movie Database) - for film data enrichment (optional)
TMDB_API_KEY=your-tmdb-api-key

# ============================================================================
# 5. DOCKER-COMPOSE SPECIFIC OVERRIDES (LOCAL DEVELOPMENT)
# ============================================================================
# These are typically managed by docker-compose.yml env_file: .env
# Override in .env.local for local testing

# Nginx Upstream (used in nginx.conf for API proxy)
# Local/Docker: filmapi:5000
# Azure: filmapi-app.internal.cinema67.azurecontainer.io:8080
FILMAPI_UPSTREAM=filmapi:5000

# ============================================================================
# 6. AZURE CONTAINER APPS SPECIFIC (PRODUCTION DEPLOYMENT)
# ============================================================================
# Set these when deploying to Azure Container Apps

# Azure Resource Group & Registry
AZURE_RESOURCE_GROUP=cinebase-rg
AZURE_ACR_NAME=cinebaseacr
AZURE_ACR_LOGIN_SERVER=cinebaseacr.azurecr.io
AZURE_CONTAINER_APPS_ENVIRONMENT=cinema67-env

# Azure Storage (for Data Protection keys share)
AZURE_STORAGE_ACCOUNT=cinebasestg
AZURE_STORAGE_KEY=your-storage-account-key

# ACA-specific overrides
ASPNETCORE_URLS=http://+:8080  # ACA runs on 8080, not 5000
FILMAPI_UPSTREAM=filmapi-app.internal.cinema67.azurecontainer.io:8080

# Database host override for ACA
DB_HOST=mariadb-server  # ACA internal DNS name

# ============================================================================
# SUMMARY OF TYPICAL CONFIGURATIONS
# ============================================================================

# LOCAL DEVELOPMENT (Visual Studio/Rider)
# DB_HOST=localhost
# ASPNETCORE_ENVIRONMENT=Development
# FRONTEND_BASE_URL=http://localhost:5001
# BACKEND_BASE_URL=http://localhost:5000

# DOCKER-COMPOSE (Local Containers)
# DB_HOST=mariadb
# ASPNETCORE_ENVIRONMENT=Development
# FRONTEND_BASE_URL=http://localhost:5001
# BACKEND_BASE_URL=http://localhost:5000
# FILMAPI_UPSTREAM=filmapi:5000

# AZURE PRODUCTION (ACA Deployment)
# DB_HOST=mariadb-server
# ASPNETCORE_ENVIRONMENT=Production
# FRONTEND_BASE_URL=https://cinema67.it
# BACKEND_BASE_URL=https://cinema67.it/api
# ASPNETCORE_URLS=http://+:8080
# FILMAPI_UPSTREAM=filmapi-app.internal.cinema67.azurecontainer.io:8080
```

### 7. GitHub Actions Workflow

**Percorso**: `.github/workflows/deploy-to-azure.yml`

**Trigger**: Push to `main` branch

**Jobs**:

1. **build-and-push**:
   - Runs on: ubuntu-latest
   - Steps:
     - Checkout code
     - Set up QEMU + Docker Buildx (multi-platform support)
     - ACR login (username: ACR_USERNAME, password: ACR_PASSWORD)
     - Build backend (Docker Buildx, tag: $ACR_LOGIN_SERVER/filmapi:main-${{ github.sha }})
     - Push backend image to ACR
     - Build frontend (tag: $ACR_LOGIN_SERVER/cinebase-web:main-${{ github.sha }})
     - Push frontend image to ACR
     - Output image digests

2. **deploy-to-aca**:
   - Runs on: ubuntu-latest
   - Needs: build-and-push
   - Steps:
     - Azure login (credentials: AZURE_CREDENTIALS Service Principal JSON)
     - Update cinebase-web-app (image reference + health check validation)
     - Update filmapi-app (image reference + health check validation)
     - Health check polling loop (max 5 min, retry every 10s)
     - Smoke tests:
       - curl -f https://cinema67.it/health (frontend)
       - curl -f https://cinema67.it/api/films (through Nginx proxy)
       - Login test (POST /api/auth/login)
     - Output deployment summary (app status, replicas, health)

**Secrets Required** (GitHub Settings > Secrets):
- ACR_LOGIN_SERVER (e.g., cinebaseacr.azurecr.io)
- ACR_USERNAME
- ACR_PASSWORD
- AZURE_CREDENTIALS (Service Principal JSON from `az ad sp create-for-rbac`)
- AZURE_RESOURCE_GROUP (e.g., cinebase-rg)
- AZURE_CONTAINER_APPS_ENVIRONMENT (e.g., cinema67-env)
- AZURE_SUBSCRIPTION_ID

---

## 11 Fasi di Implementazione

### Fase 1: Preflight Audit (2-3 ore)
**Obiettivo**: Verificare prerequisites, audit codebase, setup environment.

**Attività**:
1. Verificare Docker/Docker Compose installati (`docker --version`, `docker-compose --version`)
2. Verificare Azure CLI installato (`az --version`)
3. Verificare Git configurato (`git config --list`)
4. Audit codebase:
   - Controllare FilmAPI/Program.cs per Data Protection setup
   - Controllare FilmApiSeeder per idempotency (email check, film title check)
   - Controllare CineBase.Web per static files location (/wwwroot)
   - Controllare .env.example per completezza
5. Setup .env da .env.example (fill in defaults: DB_PASSWORD, JWT_SECRET, etc.)
6. Test applicazione locale (dotnet run in backend + frontend)
7. Creare branch `dev_iteration_6` in Git

**Checklist**:
- [ ] Docker versione 20.10+
- [ ] Docker Compose versione 2.0+
- [ ] Azure CLI versione 2.50+
- [ ] .env creato da .env.example
- [ ] Backend dotnet run funziona
- [ ] Frontend dotnet run funziona
- [ ] Branch dev_iteration_6 creato
- [ ] README.md aggiornato con docker-compose quick start

**Verifica**: 
```bash
docker --version
docker-compose --version
az --version
dotnet --version
```

---

### Fase 2: Dockerfile Backend (3-4 ore)
**Obiettivo**: Creare multistage Dockerfile per FilmAPI con alpine runtime, non-root user, healthcheck.

**Attività**:
1. Creare `backend/FilmAPI/Dockerfile`:
   - Build stage: SDK alpine, restore, publish Release
   - Runtime stage: alpine aspnet, copy publish, non-root user app:app
   - Health check: curl http://localhost:5000/health
   - Entrypoint: docker-entrypoint.sh

2. Creare `.dockerignore` (escludere bin/, obj/, .git/, .env, .gitignore, etc.)

3. Test build locale:
   ```bash
   docker build -t filmapi:latest ./backend/FilmAPI
   docker images filmapi
   # Verify size < 300MB
   ```

4. Test run container:
   ```bash
   docker run --rm -e DB_HOST=host.docker.internal -e ASPNETCORE_ENVIRONMENT=Development filmapi:latest
   # Verify app starts (should exit cleanly if DB not available)
   ```

**Checklist**:
- [ ] Dockerfile created at backend/FilmAPI/Dockerfile
- [ ] .dockerignore created
- [ ] Build stage uses SDK alpine
- [ ] Runtime stage uses aspnet alpine
- [ ] Non-root user app:app created
- [ ] Health check configured (curl /health)
- [ ] Entrypoint references docker-entrypoint.sh
- [ ] Image size < 300MB
- [ ] Local build succeeds
- [ ] Container runs without errors

**Code Review**: docker images, docker inspect filmapi:latest

---

### Fase 3: Dockerfile Frontend (2-3 ore)
**Obiettivo**: Creare multistage Dockerfile per CineBase.Web con Nginx runtime, non-root user.

**Attività**:
1. Creare `frontend/CineBase.Web/Dockerfile`:
   - Build stage: SDK alpine, restore, publish Release
   - Runtime stage: nginx:alpine, copy nginx.conf, copy published wwwroot
   - Non-root user: nginx (default)
   - Health check: curl http://localhost/health
   - Expose: 80

2. Test build:
   ```bash
   docker build -t cinebase-web:latest ./frontend/CineBase.Web
   docker images cinebase-web
   # Verify size < 50MB
   ```

3. Test run:
   ```bash
   docker run --rm -p 5001:80 cinebase-web:latest
   curl http://localhost:5001/health
   # Should return 200
   ```

**Checklist**:
- [ ] Dockerfile created at frontend/CineBase.Web/Dockerfile
- [ ] Build stage uses SDK alpine
- [ ] Runtime stage uses nginx:alpine
- [ ] nginx.conf copied to /etc/nginx/nginx.conf
- [ ] wwwroot copied to /var/www/cinebase
- [ ] Health check configured
- [ ] Image size < 50MB
- [ ] Local build succeeds
- [ ] curl /health returns 200

---

### Fase 4: Nginx Reverse Proxy Configuration (2 ore)
**Obiettivo**: Creare nginx.conf con reverse proxy, rate limiting, security headers.

**Attività**:
1. Creare `frontend/CineBase.Web/nginx.conf`:
   - Worker processes: auto
   - Gzip: on (text/*, application/json)
   - Rate limiting: limit_req_zone (10r/s general, 5r/m login)
   - Upstream filmapi: placeholder ${FILMAPI_UPSTREAM} (envsubst in docker-entrypoint.sh or docker-compose env var)
   - Server block:
     - Listen 80
     - Server name _
     - Security headers: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security
     - Location /health: return 200 "OK"
     - Location /api/*: proxy_pass to upstream filmapi
     - Location /: try_files $uri /index.html (SPA routing)
     - Static files caching: Cache-Control for /dist/*

2. Test nginx.conf syntax:
   ```bash
   docker run --rm -v $(pwd)/frontend/CineBase.Web/nginx.conf:/etc/nginx/nginx.conf nginx:alpine nginx -t
   ```

3. Test with docker-compose upstream:
   - Start empty filmapi container
   - Verify nginx proxies correctly

**Checklist**:
- [ ] nginx.conf created
- [ ] Upstream filmapi configured
- [ ] /health endpoint returns 200
- [ ] /api/* proxied correctly
- [ ] SPA routing (try_files) configured
- [ ] Rate limiting active
- [ ] Security headers present
- [ ] Gzip compression enabled
- [ ] Static file caching configured
- [ ] nginx -t passes

---

### Fase 5: Docker Entrypoint Script (1.5 ore)
**Obiettivo**: Creare docker-entrypoint.sh con wait loop, EF migrations, idempotent seeding.

**Attività**:
1. Creare `backend/docker-entrypoint.sh`:
   ```bash
   #!/bin/bash
   set -e
   
   # Wait for MariaDB to be healthy
   echo "Waiting for MariaDB at $DB_HOST:$DB_PORT..."
   while ! mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} -e "SELECT 1" &>/dev/null; do
       echo "MariaDB not ready, retrying in 5s..."
       sleep 5
   done
   echo "MariaDB is ready!"
   
   # Run EF migrations
   echo "Running EF migrations..."
   dotnet ef database update || echo "Migrations already up-to-date"
   
   # Run seeder
   echo "Running seeder..."
   dotnet FilmApiSeeder.dll
   
   # Start application
   echo "Starting FilmAPI..."
   exec dotnet FilmAPI.dll
   ```

2. Copiare nel Dockerfile (COPY docker-entrypoint.sh /app/, RUN chmod +x /app/docker-entrypoint.sh)

3. Test:
   - Build image
   - Run con docker-compose (verifica wait loop funziona)

**Checklist**:
- [ ] docker-entrypoint.sh created
- [ ] Wait loop for MariaDB implemented
- [ ] EF migrations run
- [ ] Seeder runs idempotently
- [ ] Application starts with exec
- [ ] File has executable permissions (chmod +x)
- [ ] Copied into Docker image
- [ ] Test with docker-compose runs successfully

---

### Fase 6: Docker Compose File (2 ore)
**Obiettivo**: Creare docker-compose.yml con 3 servizi, named volumes, healthchecks.

**Attività**:
1. Creare `docker-compose.yml`:
   - Version: 3.8+
   - Services: mariadb, filmapi, cinebase-web
   - Named volumes: mariadb-data, filmapi-media, filmapi-dataprotection
   - Networks: cinema67-network
   - Environment: sourced from .env (env_file: .env)
   - Health checks per service
   - Depends on: filmapi → mariadb (healthy), cinebase-web → filmapi (healthy)

2. Test startup:
   ```bash
   docker-compose up -d
   docker-compose ps
   # All services healthy
   docker-compose logs -f filmapi
   # Verify migrations + seeder run
   docker-compose down
   docker-compose up
   # Verify data persists (named volumes)
   ```

3. Test cleanup:
   ```bash
   docker-compose down
   docker volume ls
   # mariadb-data, etc. still exist
   docker-compose up
   # Data still there
   ```

**Checklist**:
- [ ] docker-compose.yml created
- [ ] mariadb service configured with volume, healthcheck
- [ ] filmapi service configured with volume, depends_on, healthcheck
- [ ] cinebase-web service configured with depends_on, healthcheck
- [ ] Named volumes defined (mariadb-data, filmapi-media, filmapi-dataprotection)
- [ ] cinema67-network bridge defined
- [ ] env_file: .env configured
- [ ] All services start successfully
- [ ] Data persists between down/up
- [ ] Health checks pass

---

### Fase 7: Azure Infrastructure Setup (3 ore)
**Obiettivo**: Creare Azure resources (resource group, ACR, ACA environment, Log Analytics, storage).

**Attività**:
1. Azure CLI login:
   ```bash
   az login
   az account set --subscription <subscription-id>
   ```

2. Creare script `AZURE_SETUP.sh`:
   ```bash
   #!/bin/bash
   set -e
   
   # Variables
   RESOURCE_GROUP="cinebase-rg"
   LOCATION="italynorth"
   ACR_NAME="cinebaseacr"
   ACA_ENVIRONMENT="cinema67-env"
   STORAGE_ACCOUNT="cinebasestg"
   
   # 1. Create resource group
   echo "Creating resource group..."
   az group create --name $RESOURCE_GROUP --location $LOCATION
   
   # 2. Create Log Analytics workspace
   echo "Creating Log Analytics workspace..."
   LOG_ANALYTICS_WORKSPACE_ID=$(az monitor log-analytics workspace create \
       --resource-group $RESOURCE_GROUP \
       --workspace-name cinema67-logs \
       --query id -o tsv)
   
   # 3. Create ACR
   echo "Creating Container Registry..."
   az acr create \
       --resource-group $RESOURCE_GROUP \
       --name $ACR_NAME \
       --sku Basic
   
   # 4. Create ACA Environment
   echo "Creating Container Apps Environment..."
   az containerapp env create \
       --name $ACA_ENVIRONMENT \
       --resource-group $RESOURCE_GROUP \
       --location $LOCATION \
       --logs-workspace-id $LOG_ANALYTICS_WORKSPACE_ID
   
   # 5. Create Storage Account + File Shares
   echo "Creating Storage Account..."
   az storage account create \
       --resource-group $RESOURCE_GROUP \
       --name $STORAGE_ACCOUNT \
       --location $LOCATION \
       --sku Standard_LRS
   
   # Get storage key
   STORAGE_KEY=$(az storage account keys list \
       --resource-group $RESOURCE_GROUP \
       --account-name $STORAGE_ACCOUNT \
       --query "[0].value" -o tsv)
   
   # Create file shares
   echo "Creating file shares..."
   az storage share create \
       --account-name $STORAGE_ACCOUNT \
       --account-key $STORAGE_KEY \
       --name mariadb-data \
       --quota 5120  # 5GB
   
   az storage share create \
       --account-name $STORAGE_ACCOUNT \
       --account-key $STORAGE_KEY \
       --name filmapi-dataprotection \
       --quota 1024  # 1GB
   
   echo "Azure setup complete!"
   echo "Resource Group: $RESOURCE_GROUP"
   echo "ACR: $ACR_NAME.azurecr.io"
   echo "ACA Environment: $ACA_ENVIRONMENT"
   echo "Storage Account: $STORAGE_ACCOUNT"
   echo "Storage Key: $STORAGE_KEY"
   ```

3. Eseguire script:
   ```bash
   chmod +x AZURE_SETUP.sh
   ./AZURE_SETUP.sh
   ```

4. Verificare risorse create:
   ```bash
   az resource list --resource-group cinebase-rg
   az acr list --resource-group cinebase-rg
   az containerapp env list --resource-group cinebase-rg
   az storage account list --resource-group cinebase-rg
   ```

**Checklist**:
- [ ] Azure subscription selected
- [ ] Resource group created (cinebase-rg)
- [ ] Log Analytics workspace created
- [ ] ACR created (cinebaseacr)
- [ ] ACA environment created (cinema67-env)
- [ ] Storage account created (cinebasestg)
- [ ] File shares created (mariadb-data 5GB, filmapi-dataprotection 1GB)
- [ ] All resources accessible via Azure CLI

---

### Fase 8: GitHub Actions Workflow (2 ore)
**Obiettivo**: Creare GitHub Actions CI/CD pipeline (build → ACR → deploy ACA).

**Attività**:
1. Creare `.github/workflows/deploy-to-azure.yml`:
   - Trigger: push to main
   - Job 1 (build-and-push):
     - Docker Buildx setup
     - ACR login
     - Build + push filmapi image
     - Build + push cinebase-web image
   - Job 2 (deploy-to-aca):
     - Azure login via Service Principal
     - az containerapp update per mariadb-server, filmapi-app, cinebase-web-app
     - Health check polling (5 min timeout)
     - Smoke tests (curl /health, /api/films, POST login)
     - Deployment summary

2. Creare Service Principal per Azure:
   ```bash
   az ad sp create-for-rbac --name "github-actions-cinebase" --role Contributor --scopes /subscriptions/<subscription-id>/resourceGroups/cinebase-rg
   ```
   Output: JSON con appId, password, tenant

3. Configurare GitHub Secrets (Settings > Secrets and variables > Actions):
   - ACR_LOGIN_SERVER (e.g., cinebaseacr.azurecr.io)
   - ACR_USERNAME (ACR username)
   - ACR_PASSWORD (ACR password)
   - AZURE_CREDENTIALS (Service Principal JSON)
   - AZURE_RESOURCE_GROUP (cinebase-rg)
   - AZURE_CONTAINER_APPS_ENVIRONMENT (cinema67-env)
   - AZURE_SUBSCRIPTION_ID

4. Test workflow:
   - Push change to main branch
   - Watch workflow run (Actions tab)
   - Verify images built and pushed to ACR
   - Verify ACA apps updated

**Checklist**:
- [ ] .github/workflows/deploy-to-azure.yml created
- [ ] Service Principal created
- [ ] GitHub Secrets configured (7 secrets)
- [ ] Workflow triggers on main branch push
- [ ] Build job succeeds
- [ ] Deploy job succeeds
- [ ] Images present in ACR
- [ ] ACA apps running with new images

---

### Fase 9: Azure Container Apps Deployment (5-6 ore)
**Obiettivo**: Deploy 3 container apps (mariadb-server, filmapi-app, cinebase-web-app) con healthchecks, volumes, networking.

**Attività**:
1. **Deploy MariaDB**:
   ```bash
   az containerapp create \
       --name mariadb-server \
       --resource-group cinebase-rg \
       --environment cinema67-env \
       --image mariadb:11.4 \
       --cpu 1 --memory 2Gi \
       --ingress internal --target-port 3306 \
       --env-vars \
           MARIADB_ROOT_PASSWORD=<root-password> \
           MARIADB_DATABASE=cinebase \
           MARIADB_USER=cinebase_user \
           MARIADB_PASSWORD=<db-password> \
       --volume-mounts mariadb-data:/var/lib/mysql \
       --transport tcp \
       --health-probe-type tcp \
       --health-probe-port 3306 \
       --health-probe-interval 10s
   ```

2. **Deploy FilmAPI**:
   ```bash
   az containerapp create \
       --name filmapi-app \
       --resource-group cinebase-rg \
       --environment cinema67-env \
       --image cinebaseacr.azurecr.io/filmapi:main-<sha> \
       --cpu 1 --memory 1Gi \
       --min-replicas 1 --max-replicas 3 \
       --ingress internal --target-port 8080 \
       --env-vars \
           DB_HOST=mariadb-server \
           DB_PORT=3306 \
           DB_NAME=cinebase \
           DB_USER=cinebase_user \
           DB_PASSWORD=<db-password> \
           ASPNETCORE_ENVIRONMENT=Production \
           ASPNETCORE_URLS=http://+:8080 \
           JWT_SECRET=<jwt-secret> \
           ... (other vars) \
       --volume-mounts filmapi-dataprotection:/app/dataprotection \
       --registry-login-server cinebaseacr.azurecr.io \
       --registry-username <acr-username> \
       --registry-password <acr-password> \
       --health-probe-type http \
       --health-probe-path /health \
       --health-probe-port 8080 \
       --health-probe-interval 10s \
       --health-probe-timeout 3s
   ```

3. **Deploy CineBase Web**:
   ```bash
   az containerapp create \
       --name cinebase-web-app \
       --resource-group cinebase-rg \
       --environment cinema67-env \
       --image cinebaseacr.azurecr.io/cinebase-web:main-<sha> \
       --cpu 0.5 --memory 512Mi \
       --min-replicas 1 --max-replicas 3 \
       --ingress external --target-port 80 \
       --env-vars \
           FILMAPI_UPSTREAM=filmapi-app.internal.cinema67.azurecontainer.io:8080 \
           ASPNETCORE_ENVIRONMENT=Production \
       --registry-login-server cinebaseacr.azurecr.io \
       --registry-username <acr-username> \
       --registry-password <acr-password> \
       --session-affinity sticky \
       --health-probe-type http \
       --health-probe-path / \
       --health-probe-port 80 \
       --health-probe-interval 10s
   ```

4. Verificare deployments:
   ```bash
   az containerapp list --resource-group cinebase-rg -o table
   az containerapp show --name mariadb-server --resource-group cinebase-rg --query "properties.provisioningState"
   az containerapp logs show --name filmapi-app --resource-group cinebase-rg
   ```

**Checklist**:
- [ ] mariadb-server deployed and healthy
- [ ] filmapi-app deployed and healthy
- [ ] cinebase-web-app deployed and healthy
- [ ] Internal ingress (mariadb, filmapi) working
- [ ] External ingress (cinebase-web-app) working
- [ ] Health probes passing
- [ ] Logs show no errors
- [ ] Replicas scaling correctly
- [ ] Data persists in Azure Files

---

### Fase 10: Domain & SSL Certificate (1.5 ore)
**Obiettivo**: Configurare cinema67.it CNAME → ACA FQDN, SSL certificate.

**Attività**:
1. Ottenere ACA FQDN:
   ```bash
   az containerapp show --name cinebase-web-app --resource-group cinebase-rg \
       --query "properties.configuration.ingress.fqdn" -o tsv
   # Output: cinebase-web-app.XXXX.azurecontainer.io
   ```

2. Configurare CNAME DNS (manualmente in provider DNS):
   - Record: cinema67.it (o www.cinema67.it)
   - Type: CNAME
   - Value: cinebase-web-app.XXXX.azurecontainer.io

3. Creare Azure Managed Certificate:
   ```bash
   az containerapp hostname bind \
       --name cinebase-web-app \
       --resource-group cinebase-rg \
       --hostname cinema67.it \
       --certificate-binding-type azure-managed
   ```

4. Verificare SSL:
   ```bash
   curl -I https://cinema67.it/
   # Should return 200, certificate valid
   ```

5. Aggiornare ingress per HTTPS:
   ```bash
   az containerapp ingress update \
       --name cinebase-web-app \
       --resource-group cinebase-rg \
       --mode secure  # HTTPS only
   ```

**Checklist**:
- [ ] ACA FQDN obtained
- [ ] CNAME record created in DNS
- [ ] DNS propagation verified (nslookup)
- [ ] Azure Managed Certificate created
- [ ] HTTPS certificate valid (no warnings)
- [ ] curl https://cinema67.it returns 200
- [ ] Ingress in secure mode (HTTPS only)
- [ ] Auto-renewal configured (Azure default)

---

### Fase 11: Testing & Validation (3 ore)
**Obiettivo**: Test completi locale e Azure, end-to-end functional tests.

**Attività**:

1. **Test Locale (docker-compose)**:
   ```bash
   # Clean start
   docker-compose down -v
   docker-compose up -d
   
   # Wait for healthy
   sleep 30
   docker-compose ps
   
   # Health checks
   curl -f http://localhost:5001/health
   curl -f http://localhost:5000/health
   
   # API tests
   curl http://localhost:5000/api/films
   curl -X POST http://localhost:5000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"admin@cinema67.it","password":"AdminInitialPassword123!"}'
   
   # Data persistence
   docker-compose down
   docker-compose up -d
   curl http://localhost:5000/api/films
   # Should still have films from seeder
   ```

2. **Test Azure (ACA)**:
   ```bash
   # Health endpoints
   curl -f https://cinema67.it/health
   curl -f https://cinema67.it/api/films
   
   # Login test
   curl -X POST https://cinema67.it/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"admin@cinema67.it","password":"AdminInitialPassword123!"}'
   
   # Frontend functional
   curl -f https://cinema67.it/index.html
   
   # Logs check
   az containerapp logs show --name filmapi-app --resource-group cinebase-rg --tail 50
   ```

3. **Functional Test Suite**:
   - Browser login (Google OAuth)
   - Films list rendering
   - Proiezioni display
   - Admin panel access
   - Add/edit film
   - User profile

4. **Resilience Tests**:
   ```bash
   # Restart container
   az containerapp update --name filmapi-app --resource-group cinebase-rg
   
   # Verify still healthy after restart
   sleep 30
   curl -f https://cinema67.it/api/films
   
   # Check data persisted
   ```

5. **Performance Baseline**:
   ```bash
   # Load test /api/films (100 requests)
   ab -n 100 -c 10 https://cinema67.it/api/films
   ```

**Checklist**:
- [ ] docker-compose up succeeds
- [ ] All services healthy
- [ ] API endpoints respond
- [ ] Login works
- [ ] Films display
- [ ] Data persists after restart
- [ ] Azure deployment accessible
- [ ] HTTPS working (no certificate warnings)
- [ ] Domain cinema67.it resolves
- [ ] Smoke tests pass (100% OK responses)
- [ ] End-to-end functional tests pass
- [ ] Performance baseline acceptable
- [ ] Logs clean (no errors)

---

## Checklist Dettagliata

### Pre-Implementation
- [ ] Docker versione 20.10+
- [ ] Docker Compose versione 2.0+
- [ ] Azure CLI versione 2.50+
- [ ] Dotnet 9 SDK installed
- [ ] Git repository ready (main branch)
- [ ] .env created from .env.example
- [ ] Azure subscription accessible
- [ ] cinema67.it domain registered
- [ ] DNS provider accessible

### Dockerfiles & Images
- [ ] backend/FilmAPI/Dockerfile created
- [ ] frontend/CineBase.Web/Dockerfile created
- [ ] .dockerignore created
- [ ] Backend image builds < 300MB
- [ ] Frontend image builds < 50MB
- [ ] Non-root users configured (app, nginx)
- [ ] Health checks present
- [ ] Local test run successful

### Configuration Files
- [ ] frontend/CineBase.Web/nginx.conf created
- [ ] backend/docker-entrypoint.sh created (executable)
- [ ] docker-compose.yml created
- [ ] .env.example updated with all vars
- [ ] All volumes defined
- [ ] All environment variables documented

### Entrypoint & Seeding
- [ ] docker-entrypoint.sh waits for MariaDB
- [ ] EF migrations run automatically
- [ ] Seeder runs idempotently
- [ ] Admin account created from env vars
- [ ] Seeder skips duplicates
- [ ] Application starts after seeding

### Local Testing
- [ ] docker-compose up -d succeeds
- [ ] All services reach healthy state
- [ ] Health endpoints respond (curl)
- [ ] API endpoints functional
- [ ] Database persistence verified
- [ ] Named volumes created
- [ ] docker-compose down/up retains data

### Azure Infrastructure
- [ ] Azure resource group created
- [ ] Log Analytics workspace created
- [ ] ACR created and accessible
- [ ] ACA environment created
- [ ] Storage account created
- [ ] File shares created (5GB + 1GB)
- [ ] Service Principal created for CI/CD

### GitHub Actions
- [ ] .github/workflows/deploy-to-azure.yml created
- [ ] All GitHub Secrets configured (7 secrets)
- [ ] Workflow triggers on main push
- [ ] Build job completes successfully
- [ ] Images pushed to ACR with SHA tags
- [ ] Deploy job updates container apps
- [ ] Health check polling works
- [ ] Smoke tests pass

### Azure Container Apps Deployment
- [ ] mariadb-server deployed (internal ingress)
- [ ] filmapi-app deployed (internal ingress)
- [ ] cinebase-web-app deployed (external ingress)
- [ ] All health probes passing
- [ ] Replicas running (min 1, max 3)
- [ ] Volume mounts configured
- [ ] Environment variables injected
- [ ] ACR image pull working
- [ ] Logs accessible and clean

### Domain & SSL
- [ ] cinema67.it CNAME record created
- [ ] DNS propagation verified
- [ ] Azure Managed Certificate created
- [ ] HTTPS certificate valid (no warnings)
- [ ] Ingress in secure mode (HTTPS only)
- [ ] curl https://cinema67.it succeeds
- [ ] Auto-renewal configured

### Testing & Validation
- [ ] Smoke tests pass (all endpoints 200)
- [ ] Login works (OAuth providers)
- [ ] Films display correctly
- [ ] Admin panel accessible
- [ ] User profile functional
- [ ] Data persists after restart
- [ ] Resilience tests pass
- [ ] Performance baseline acceptable
- [ ] No errors in logs

### Git & Documentation
- [ ] Branch dev_iteration_6 created
- [ ] All files committed
- [ ] README.md updated
- [ ] PianoDiLavoro.md complete
- [ ] Supporting docs created
- [ ] Commit message clear and detailed

---

## Strategia di Testing

### 1. Local (docker-compose) Testing

**Setup**:
```bash
docker-compose down -v  # Clean slate
docker-compose up -d
sleep 30
docker-compose ps  # Verify all healthy
```

**Smoke Tests**:
```bash
# Health endpoints
curl -f http://localhost:5001/health
curl -f http://localhost:5000/health

# API endpoints
curl http://localhost:5000/api/films
curl http://localhost:5000/api/proiezioni

# Database connection
curl http://localhost:5000/api/health/db

# Frontend
curl -f http://localhost:5001/index.html
```

**Functional Tests**:
- Admin login via OAuth (Google/Microsoft)
- Films list rendering
- Proiezioni display
- Add new film (admin)
- Edit film (admin)
- User profile edit

**Persistence Test**:
```bash
docker-compose down
docker-compose up -d
curl http://localhost:5000/api/films
# Should still have data from seeder
```

### 2. Azure (ACA) Testing

**Preliminary Checks**:
```bash
az containerapp list --resource-group cinebase-rg -o table
az containerapp show --name filmapi-app --resource-group cinebase-rg | grep "provisioningState"
```

**Smoke Tests**:
```bash
# HTTPS health endpoints
curl -f https://cinema67.it/health
curl -f https://cinema67.it/api/films

# Certificate validation
curl -I https://cinema67.it/

# DNS resolution
nslookup cinema67.it
```

**Functional Tests**:
- Browser login: https://cinema67.it (Google OAuth)
- Films page load
- Admin panel (admin account)
- Add film workflow
- User settings

**Resilience Tests**:
```bash
# Force redeploy
az containerapp update --name filmapi-app --resource-group cinebase-rg

# Wait for healthy + retest
sleep 30
curl -f https://cinema67.it/api/films
```

**Performance Tests**:
```bash
# Load test (100 requests, 10 concurrent)
ab -n 100 -c 10 https://cinema67.it/api/films

# Expected: avg response time < 200ms
```

### 3. End-to-End Workflow

```
1. User visits https://cinema67.it
   ↓ (Nginx static files + SPA routing)
2. User clicks "Login with Google"
   ↓ (OAuth provider redirect)
3. OAuth callback to https://cinema67.it/callback?code=...
   ↓ (Frontend → Nginx → Backend proxy)
4. Backend validates OAuth token, creates JWT
   ↓ (Response with JWT in secure cookie)
5. User authenticated, films display
   ↓ (Frontend GET /api/films)
6. Backend queries MariaDB, returns results
   ↓ (Nginx caches response)
7. User adds new film (admin only)
   ↓ (POST /api/admin/films)
8. Backend validates admin role, persists to DB
   ↓ (Response 201 Created)
9. Frontend refreshes films list
   ↓ (New film appears)
10. Test Success!
```

---

## Troubleshooting Guida

### Docker-Compose Issues

**Problema**: `docker-compose up` fails with "Cannot connect to Docker daemon"
- **Soluzione**: Verificare Docker running (`docker ps`)

**Problema**: `mariadb` container exits immediately
- **Soluzione**: Check logs (`docker-compose logs mariadb`), verify passwords in .env

**Problema**: `filmapi` can't reach `mariadb`
- **Soluzione**: Verify network (`docker network ls`), container DNS resolution

**Problema**: Named volumes not persisting
- **Soluzione**: Verify volume mount path in docker-compose, verify filesystem space

### Dockerfile Build Issues

**Problema**: Build timeout (long layer)
- **Soluzione**: Optimize RUN commands, cache dependencies earlier

**Problema**: Image size > 300MB (backend)
- **Soluzione**: Remove unnecessary packages in runtime stage, use alpine base

**Problema**: Non-root user permission denied
- **Soluzione**: Verify CHOWN commands in Dockerfile, check file permissions

### Nginx Issues

**Problema**: `nginx -t` fails
- **Soluzione**: Check nginx.conf syntax, verify upstream name

**Problema**: Upstream returns 502 Bad Gateway
- **Soluzione**: Verify upstream server running, check firewall/network

**Problema**: CORS errors (frontend can't call /api/*)
- **Soluzione**: Check nginx proxy_pass, verify Access-Control headers

### Azure Deployment Issues

**Problema**: ACR push fails (401 Unauthorized)
- **Soluzione**: Verify ACR credentials in GitHub Secrets, check ACR access policy

**Problema**: Container app fails to pull image
- **Soluzione**: Verify image exists in ACR, check image pull secret

**Problema**: Health probe failing
- **Soluzione**: Check container logs (`az containerapp logs show`), verify endpoint responding

**Problema**: Environment variables not set
- **Soluzione**: Verify `--env-vars` in az containerapp create, check Key Vault integration

**Problema**: Data not persisting
- **Soluzione**: Verify volume mount path, check Azure Files share capacity

### Domain & SSL Issues

**Problema**: CNAME doesn't resolve
- **Soluzione**: Check DNS propagation (nslookup), verify CNAME value

**Problema**: Certificate not created
- **Soluzione**: Verify CNAME resolves before certificate binding, check Azure permissions

**Problema**: HTTPS connection refused
- **Soluzione**: Check ingress mode (secure vs public), verify port 443 open

### CI/CD Pipeline Issues

**Problema**: GitHub Actions workflow doesn't trigger
- **Soluzione**: Verify push to main branch, check workflow trigger conditions

**Problema**: Docker build step fails
- **Soluzione**: Check build logs, verify Dockerfile syntax

**Problema**: Deploy step fails
- **Soluzione**: Verify Azure credentials, check Service Principal permissions

---

## Acceptance Criteria

### Infrastructure (Go/No-Go)
- ✅ Docker containers build successfully
- ✅ docker-compose up starts all 3 services
- ✅ All services reach healthy state within 60s
- ✅ Named volumes persist data after down/up
- ✅ Azure resources created and accessible
- ✅ GitHub Actions workflow triggers and completes
- ✅ Container apps deployed to ACA
- ✅ Domain cinema67.it resolves and HTTPS working

### Functionality (Go/No-Go)
- ✅ Admin account created automatically
- ✅ Films listed via /api/films endpoint
- ✅ Login works (email/OAuth)
- ✅ JWT tokens valid and secure (httpOnly cookies)
- ✅ Admin panel accessible only by admin users
- ✅ Database queries respond < 500ms
- ✅ Static files cached (Nginx)
- ✅ SPA routing works (try_files to index.html)

### Operations (Go/No-Go)
- ✅ Logs accessible via Docker/Azure
- ✅ Health probes passing
- ✅ Replicas autoscaling (1-3)
- ✅ Container restart preserves data
- ✅ No hardcoded secrets in code/images
- ✅ Environment variables documented
- ✅ SSL certificate auto-renewing
- ✅ Smoke tests pass (CI/CD)

### Performance Baseline (Go/No-Go)
- ✅ /api/films avg response < 200ms
- ✅ /health endpoints respond < 100ms
- ✅ Frontend load time < 3s
- ✅ Nginx proxy adds < 50ms overhead
- ✅ Can sustain 10 concurrent users

---

## Appendice: Code Snippets

### Snippet 1: Dockerfile Backend (Completo)

```dockerfile
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19 AS builder
WORKDIR /src

COPY ["backend/FilmAPI/FilmAPI.csproj", "FilmAPI/"]
COPY ["backend/FilmAPI.Domain/FilmAPI.Domain.csproj", "FilmAPI.Domain/"]
COPY ["backend/FilmAPI.Infrastructure/FilmAPI.Infrastructure.csproj", "FilmAPI.Infrastructure/"]
COPY ["backend/scripts/FilmApiSeeder/FilmApiSeeder.csproj", "FilmApiSeeder/"]

RUN dotnet restore "FilmAPI/FilmAPI.csproj"

COPY ["backend/", "."]

RUN dotnet publish "FilmAPI/FilmAPI.csproj" -c Release -o /app/publish --no-restore
RUN dotnet publish "FilmApiSeeder/FilmApiSeeder.csproj" -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine3.19
RUN apk add --no-cache curl mysql-client bash

WORKDIR /app
COPY --from=builder /app/publish .

# Create non-root user
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app
USER app

# Copy entrypoint script
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 5000 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]
```

### Snippet 2: Dockerfile Frontend (Completo)

```dockerfile
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine3.19 AS builder
WORKDIR /src

COPY ["frontend/CineBase.Web/CineBase.Web.csproj", "."]
RUN dotnet restore

COPY ["frontend/CineBase.Web/", "."]
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM nginx:alpine
RUN apk add --no-cache curl

# Copy nginx configuration
COPY ["frontend/CineBase.Web/nginx.conf", "/etc/nginx/nginx.conf"]

# Copy published app
COPY --from=builder /app/publish/wwwroot /var/www/cinebase

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Snippet 3: Nginx Configuration (Essenziale)

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream backend (variable from env)
    upstream filmapi {
        server ${FILMAPI_UPSTREAM};
    }

    server {
        listen 80 default_server;
        server_name _;

        # Security headers
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Health check endpoint
        location /health {
            return 200 "OK";
            add_header Content-Type text/plain;
        }

        # Backend API proxy
        location /api/ {
            limit_req zone=general burst=20 nodelay;

            proxy_pass http://filmapi;
            proxy_http_version 1.1;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Login endpoint rate limit
            if ($request_uri ~ /api/auth/login) {
                limit_req zone=login burst=2 nodelay;
            }
        }

        # Static files with caching
        location ~* /dist/.*\.(js|css|png|jpg|gif|ico|woff|woff2)$ {
            root /var/www/cinebase;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing
        location / {
            root /var/www/cinebase;
            try_files $uri /index.html;
        }
    }
}
```

### Snippet 4: Docker Entrypoint Script (Completo)

```bash
#!/bin/bash
set -e

echo "=== FilmAPI Docker Entrypoint ==="

# Wait for MariaDB
echo "Waiting for MariaDB at $DB_HOST:$DB_PORT..."
RETRY_COUNT=0
MAX_RETRIES=12  # 60 seconds with 5s intervals

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p${DB_PASSWORD} -e "SELECT 1" &>/dev/null; then
        echo "✓ MariaDB is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "MariaDB not ready (attempt $RETRY_COUNT/$MAX_RETRIES), retrying in 5s..."
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "✗ MariaDB failed to become ready after 60s"
    exit 1
fi

# Run EF migrations
echo "Running Entity Framework migrations..."
if dotnet ef database update --no-build 2>&1 | tee /tmp/migrate.log; then
    echo "✓ Migrations completed"
else
    echo "⚠ Migration check completed (may already be up-to-date)"
fi

# Run seeder
echo "Running database seeder..."
if dotnet FilmApiSeeder.dll; then
    echo "✓ Seeder completed"
else
    echo "✗ Seeder failed"
    exit 1
fi

# Start application
echo "Starting FilmAPI..."
exec dotnet FilmAPI.dll
```

### Snippet 5: docker-compose.yml (Essenziale)

```yaml
version: '3.8'

services:
  mariadb:
    image: mariadb:11.4
    container_name: mariadb
    restart: unless-stopped
    ports:
      - "3306:3306"
    environment:
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpass}
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mariadb-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mariadb-admin", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - cinema67-network

  filmapi:
    build:
      context: ./backend
      dockerfile: FilmAPI/Dockerfile
    container_name: filmapi
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      DB_HOST: mariadb
      DB_PORT: 3306
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      ASPNETCORE_ENVIRONMENT: Development
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_SEED_EMAIL: ${ADMIN_SEED_EMAIL}
      ADMIN_SEED_PASSWORD: ${ADMIN_SEED_PASSWORD}
      OAUTH_GOOGLE_CLIENT_ID: ${OAUTH_GOOGLE_CLIENT_ID}
      OAUTH_GOOGLE_CLIENT_SECRET: ${OAUTH_GOOGLE_CLIENT_SECRET}
      DATA_PROTECTION_KEYS_PATH: /app/dataprotection
    volumes:
      - filmapi-media:/app/media
      - filmapi-dataprotection:/app/dataprotection
    depends_on:
      mariadb:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 30s
    networks:
      - cinema67-network

  cinebase-web:
    build:
      context: ./frontend
      dockerfile: CineBase.Web/Dockerfile
    container_name: cinebase-web
    restart: unless-stopped
    ports:
      - "5001:80"
    environment:
      FILMAPI_UPSTREAM: filmapi:5000
      ASPNETCORE_ENVIRONMENT: Development
    depends_on:
      filmapi:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - cinema67-network

volumes:
  mariadb-data:
    driver: local
  filmapi-media:
    driver: local
  filmapi-dataprotection:
    driver: local

networks:
  cinema67-network:
    driver: bridge
```

---

## Conclusione

Questo documento fornisce una guida completa per implementare Iterazione 6: Containerizzazione e Deployment su Azure per CineBase.

**Tempo Stimato**: 24 ore full-time (3 giorni lavorativi)  
**Difficulty**: 7/10 (moderatamente complesso; richiede familiarità con Docker, Azure CLI, GitHub Actions)  
**Risk**: Basso (incrementale; no breaking changes)

**Next Steps**:
1. Eseguire Fase 1 (Preflight Audit)
2. Creare branch dev_iteration_6
3. Procedere fase per fase seguendo checklist
4. Testare localmente prima di Azure
5. Validare end-to-end su ACA
6. Commit e merge a main

---

**Document Version**: 1.0  
**Last Updated**: May 28, 2026  
**Status**: READY FOR IMPLEMENTATION
