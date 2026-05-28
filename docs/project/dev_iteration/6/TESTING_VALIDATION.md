# Fase 11: Testing & Validation Guide

## Overview
Complete testing strategy for CineBase containerized deployment across local docker-compose and Azure Container Apps environments.

## Test Environments

### Local (Docker Compose)
- HTTP only (localhost:5001)
- Mock OAuth (redirect to /login)
- File-based data persistence (named volumes)
- Direct database access

### Azure (Container Apps)
- HTTPS cinema67.it
- Real OAuth providers
- Azure managed SSL certificate
- Managed persistent storage (Azure Files)

---

## Phase 1: Local Docker Compose Smoke Tests

### 1.1 Build & Start Services

```bash
cd ~/film-app-main

# Clean volumes
docker-compose down -v

# Build images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Wait for MariaDB readiness
sleep 30

# Check container status
docker-compose ps
```

### 1.2 Health Checks

```bash
# Backend health
curl -s http://localhost:8080/health | jq .
# Expected: { "status": "healthy", "timestamp": "..." }

# Frontend health
curl -s http://localhost:5001/health | jq .
# Expected: { "status": "healthy", "timestamp": "..." }

# API through reverse proxy
curl -s http://localhost:5001/api/films | jq . | head -20
# Expected: array of film objects
```

### 1.3 Database Validation

```bash
# Connect to MariaDB container
docker-compose exec mariadb mysql -uroot -proot -e "
    SELECT 'MariaDB Connected' as Status;
    USE \`film-api-db\`;
    SELECT COUNT(*) as AdminCount FROM Users WHERE Ruolo = 'Admin';
    SELECT COUNT(*) as FilmsCount FROM Films;
    SELECT COUNT(*) as CinemasCount FROM Cinemas;
"
```

### 1.4 Admin Account Verification

```bash
# Check admin user exists (created by seeder)
curl -s -X POST http://localhost:8080/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@cinebase.it","password":"Admin123!"}' | jq .

# Expected: JWT token in response
```

### 1.5 Film Seeding Verification

```bash
# Get films list
curl -s http://localhost:5001/api/films | jq '.[] | {id, titolo, durata}' | head -30

# Expected: at least 50+ films with valid data
```

### 1.6 Data Persistence Test

```bash
# Verify data persists across restarts
docker-compose stop filmapi mariadb cinebase-web
sleep 5
docker-compose start mariadb filmapi cinebase-web
sleep 10

# Re-run film count query
curl -s http://localhost:5001/api/films | jq '. | length'

# Expected: same film count as before restart
```

---

## Phase 2: Local Integration Tests

### 2.1 Authentication Flow

```bash
# 1. Login
RESPONSE=$(curl -s -X POST http://localhost:8080/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@cinebase.it","password":"Admin123!"}')

TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# 2. Use token in request
curl -s http://localhost:8080/admin/users \
    -H "Authorization: Bearer $TOKEN" | jq . | head -10

# Expected: 200 OK with user data
```

### 2.2 Film & Cinema Data

```bash
# Get cinemas
curl -s http://localhost:5001/api/cinemas | jq '.[] | {id, nome, citta}' | head -20

# Expected: 3+ cinemas (Roma, Milano, Napoli)

# Get shows for specific cinema
CINEMA_ID=$(curl -s http://localhost:5001/api/cinemas | jq -r '.[0].id')
curl -s "http://localhost:5001/api/shows?cinemaId=$CINEMA_ID" | jq . | head -30

# Expected: array of show objects with filmId, salaId, startAtUtc
```

### 2.3 Nginx Configuration

```bash
# Verify nginx is reverse proxying correctly
curl -I http://localhost:5001/api/films

# Check response headers
curl -I http://localhost:5001/ | grep -E "^(X-|Server|Cache-Control)"

# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Cache-Control: no-cache, no-store for health check
```

---

## Phase 3: Docker Compose Cleanup & Diagnostics

### 3.1 View Logs

```bash
# Backend logs
docker-compose logs filmapi --tail=100

# Frontend logs
docker-compose logs cinebase-web --tail=50

# Database logs
docker-compose logs mariadb --tail=50
```

### 3.2 Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| "MariaDB: connection refused" | Database not ready | Wait 30s, increase `start_period` in docker-compose.yml |
| "Seeder failed" | TMDB token missing | Add TMDB_BEARER_TOKEN to .env |
| "API not found at /api/*" | nginx upstream misconfigured | Verify `FILMAPI_UPSTREAM` env var in frontend service |
| "Admin login fails" | Seeder not run | Check backend logs, re-run `docker-compose up mariadb filmapi` |
| "Films show empty" | Seeder hasn't completed | Wait 3-5 minutes for TMDB API calls |

---

## Phase 4: Azure Container Apps Smoke Tests

### 4.1 Verify Deployments

```bash
RESOURCE_GROUP="cinebase-rg"
ACA_ENV="cinema67-env"

# Check all apps are running
for APP in mariadb-server filmapi-app cinebase-web-app; do
    STATUS=$(az containerapp show \
        --name "$APP" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$ACA_ENV" \
        --query "properties.runningStatus" -o tsv)
    echo "$APP: $STATUS"
done

# Expected: all show "Running"
```

### 4.2 Health Checks (Before DNS)

```bash
# Get FQDNs
WEB_FQDN=$(az containerapp show \
    --name cinebase-web-app \
    --resource-group "cinebase-rg" \
    --environment "cinema67-env" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

API_FQDN=$(az containerapp show \
    --name filmapi-app \
    --resource-group "cinebase-rg" \
    --environment "cinema67-env" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

# Test frontend health (allow 2-3 minutes for container startup)
curl -k -I https://$WEB_FQDN/health

# Expected: 200 OK

# Test API through reverse proxy
curl -k -s https://$WEB_FQDN/api/films | jq '.[0:2] | .[] | {id, titolo}'

# Expected: film objects
```

### 4.3 DNS & SSL Verification

```bash
# Test cinema67.it (after DNS CNAME propagated)
curl -I https://cinema67.it/

# Expected: 200 OK, SSL certificate valid

# Check certificate details
openssl s_client -connect cinema67.it:443 -showcerts 2>/dev/null | \
    grep "subject=\|issuer="

# Expected: subject includes cinema67.it, issuer=Azure
```

### 4.4 OAuth Redirect Verification

```bash
# Test OAuth callback redirect
curl -I -L https://cinema67.it/auth/google/callback?code=test

# Expected: 302 or 400 (invalid code ok, tests connectivity)
```

---

## Phase 5: End-to-End Functional Tests

### 5.1 Full Login Flow (Local)

**Frontend Console (Browser DevTools):**
```javascript
// POST /auth/login
fetch('http://localhost:8080/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'admin@cinebase.it',
        password: 'Admin123!'
    })
})
.then(r => r.json())
.then(data => {
    localStorage.setItem('token', data.token);
    window.location.href = '/dashboard';
})
.catch(e => console.error(e));
```

**Expected:**
1. Login succeeds, JWT stored in localStorage
2. Redirected to dashboard
3. User info displayed (name, email, role)

### 5.2 Film Browse & Purchase (Local)

```bash
# Get films
FILMS=$(curl -s http://localhost:5001/api/films | jq -r '.[0].id')

# Get shows for film
FILM_ID=$FILMS
curl -s "http://localhost:5001/api/shows?filmId=$FILM_ID" | \
    jq '.[] | {id, startAtUtc, prezzoBase}' | head -5

# Get seats for show
SHOW_ID=$(curl -s "http://localhost:5001/api/shows?filmId=$FILM_ID" | jq -r '.[0].id')
curl -s "http://localhost:5001/api/shows/$SHOW_ID/seats" | \
    jq '.[] | {id, settore, fila, numero}' | head -10

# Expected: available seats with coordinates
```

### 5.3 Admin Dashboard (Local)

```bash
# Get admin users list
curl -s http://localhost:8080/admin/users \
    -H "Authorization: Bearer $TOKEN" | jq '.[] | {id, email, ruolo}' | head -10

# Expected: admin user + staff users

# Get analytics
curl -s http://localhost:8080/admin/analytics/dashboard \
    -H "Authorization: Bearer $TOKEN" | jq .

# Expected: dashboard stats
```

---

## Phase 6: Resilience & Load Tests

### 6.1 Database Connection Resilience

```bash
# Stop MariaDB, verify backend stays healthy
docker-compose stop mariadb
sleep 5
curl -I http://localhost:8080/health
# Expected: 503 or timeout (expected failure)

# Restart MariaDB, verify recovery
docker-compose start mariadb
sleep 15
curl -I http://localhost:8080/health
# Expected: 200 OK (recovered)
```

### 6.2 Frontend Reverse Proxy Resilience

```bash
# Stop backend, verify frontend remains responsive
docker-compose stop filmapi
sleep 5

# Frontend health should still work
curl -I http://localhost:5001/health
# Expected: 200 OK

# API call should fail gracefully
curl -I http://localhost:5001/api/films
# Expected: 502 Bad Gateway or similar error

# Restart backend
docker-compose start filmapi
sleep 5
curl -I http://localhost:5001/api/films
# Expected: 200 OK (recovered)
```

### 6.3 Concurrent Request Handling (Local)

```bash
# Install Apache Bench
# macOS: brew install httpd
# Linux: apt-get install apache2-utils
# Windows: download from ApacheFriends

# 100 concurrent requests, 1000 total
ab -n 1000 -c 100 http://localhost:5001/api/films

# Expected: <5% failure rate, avg response time <500ms
```

### 6.4 Data Protection Keys Persistence (Docker)

```bash
# Verify keys mount
docker-compose exec filmapi ls -la /var/lib/dataprotection/

# Expected: keys-*.xml files exist

# Restart backend, verify keys persist (no new encryption key)
docker-compose restart filmapi
sleep 5
docker-compose exec filmapi ls -la /var/lib/dataprotection/

# Expected: same keys-*.xml files (verified by timestamp)
```

---

## Phase 7: Azure ACA Resilience

### 7.1 Auto-Scaling Test

```bash
RESOURCE_GROUP="cinebase-rg"

# Check current replicas
for APP in filmapi-app cinebase-web-app; do
    REPLICAS=$(az containerapp show \
        --name "$APP" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "cinema67-env" \
        --query "properties.template.scale" -o jsonc)
    echo "$APP replicas: $REPLICAS"
done

# Load test (simulated)
# In real scenario, use Artillery, Locust, or k6
for i in {1..500}; do
    curl -s https://cinema67.it/api/films >/dev/null &
done
wait

# Check replicas after load
# Expected: ACA auto-scales to max-replicas (3)
```

### 7.2 Pod Restart Resilience

```bash
# Get filmapi pod name
POD=$(az containerapp replica list \
    --name filmapi-app \
    --resource-group "cinebase-rg" \
    --environment "cinema67-env" \
    --query "[0].name" -o tsv)

# Restart pod (simulates crash)
az containerapp replica stop \
    --name filmapi-app \
    --replica-name "$POD" \
    --resource-group "cinebase-rg" \
    --environment "cinema67-env"

# Verify new pod starts automatically
sleep 10
curl -I https://cinema67.it/api/films

# Expected: 200 OK (new pod replaced old one)
```

---

## Test Report Template

```markdown
## CineBase Iteration 6 - Test Report

**Date:** [YYYY-MM-DD]
**Environment:** Local docker-compose / Azure ACA
**Tested By:** [Name]

### Phase 1: Local Smoke Tests
- [ ] Services start successfully
- [ ] Health checks pass (frontend, backend, DB)
- [ ] Admin login works
- [ ] Films load (50+ records)
- [ ] Data persists across restart

### Phase 2: Integration Tests
- [ ] Authentication flow works
- [ ] Film/cinema data loads
- [ ] Nginx reverse proxy functional
- [ ] Security headers present

### Phase 3: Functional Tests
- [ ] Login/logout cycle complete
- [ ] Film browse & show selection
- [ ] Admin dashboard accessible
- [ ] HTTPS works (Azure)

### Phase 4: Resilience
- [ ] Database restart recovery
- [ ] Backend restart recovery
- [ ] Concurrent requests handled
- [ ] Auto-scaling triggered (Azure)

### Issues Found
| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| 1 | P0 | [if any] | Open/Fixed/Deferred |

### Sign-Off
- [ ] All critical tests passing
- [ ] No P0/P1 blockers
- [ ] Ready for production deployment
```

---

## Monitoring & Observability

### Azure Container Apps Logs

```bash
# View real-time logs
az containerapp logs show \
    --name cinebase-web-app \
    --resource-group "cinebase-rg" \
    --environment "cinema67-env" \
    --follow

# Export logs for analysis
az containerapp logs show \
    --name filmapi-app \
    --resource-group "cinebase-rg" \
    --environment "cinema67-env" \
    --tail 1000 > filmapi_logs.txt
```

### Local Docker Logs

```bash
# Real-time logs
docker-compose logs -f

# Specific service
docker-compose logs -f filmapi --tail=100
```

---

## Acceptance Criteria

- [x] Local docker-compose builds without errors
- [x] All services start within 60s
- [x] Health endpoints return 200 OK
- [x] Database migration completes automatically
- [x] Seeder runs idempotently (no errors on restart)
- [x] Admin user created from env vars
- [x] Films populate from TMDB (50+)
- [x] JWT authentication works
- [x] Nginx reverse proxy functional
- [x] HTTPS works on cinema67.it
- [x] OAuth redirects functional
- [x] Auto-scaling works on ACA
- [x] Data persists across container restarts
- [x] <5% request failure under load
- [x] Recovery time <30s on pod restart

---

**Related Documents:**
- [PianoDiLavoro.md](./PianoDiLavoro.md) - Master plan
- [DOCKER_BEST_PRACTICES.md](./DOCKER_BEST_PRACTICES.md) - Container optimization
- [CI_CD_SETUP.md](./CI_CD_SETUP.md) - GitHub Actions workflow
- [DOMAIN_SSL_SETUP.md](./DOMAIN_SSL_SETUP.md) - Domain configuration
