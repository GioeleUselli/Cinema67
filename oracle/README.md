# Cinema67 su Oracle Cloud Always Free

## Requisiti

- Account Oracle Cloud (gratuito — carta di credito solo per verifica, nessun addebito)
- Dominio personale (es. `cinema67.it`) — necessario per HTTPS con Let's Encrypt

## Architettura

```
Internet (80/443)
    └── Caddy (reverse proxy + SSL automatico)
          ├── cinema67.it    → cinema67-web:8080  (frontend)
          └── api.cinema67.it → filmapi:8080       (backend API)
                                  └── mariadb:3306   (database)
```

Tutto gira su una singola VM ARM Ampere 4 OCPU / 24 GB RAM — gratis per sempre.

---

## Step 1: Creare la VM su Oracle Cloud

1. Vai su [cloud.oracle.com](https://cloud.oracle.com) → Compute → Instances → Create instance
2. Nome: `cinema67`
3. Image: **Ubuntu 22.04** o **24.04**
4. Shape: **Ampere** → OCPU: 4, Memory: 24 GB (sempre gratuito)
5. SSH: carica la tua chiave pubblica
6. Boot volume: 50-100 GB (massimo 200 GB free total)
7. Clicca **Create**

## Step 2: Aprire le porte nel Security List

Dopo la creazione, apri le porte nel firewall Oracle:

1. Compute → Instances → clicca sulla VM → **Attached VNIC** → **Security Lists**
2. Aggiungi regole Ingress per:
   - **TCP 22**  da `0.0.0.0/0` (SSH)
   - **TCP 80**  da `0.0.0.0/0` (HTTP)
   - **TCP 443** da `0.0.0.0/0` (HTTPS)

## Step 3: Puntare il DNS

Aggiungi questi record DNS per il tuo dominio:

| Tipo | Nome | Valore |
|------|------|--------|
| A    | `@`       | `<IP pubblico VM>` |
| A    | `www`     | `<IP pubblico VM>` |
| A    | `api`     | `<IP pubblico VM>` |

L'IP pubblico lo trovi nella pagina dell'istanza su Oracle Cloud Console.

## Step 4: Setup della VM

Connettiti via SSH ed esegui:

```bash
# Clona il progetto
cd /opt
git clone <URL_DEL_TUO_REPO> cinema67
cd cinema67/oracle

# Esegui lo script di setup (installa Docker, Git, configura firewall)
sudo chmod +x setup-vm.sh
sudo ./setup-vm.sh
```

## Step 5: Configurare le variabili d'ambiente

```bash
cd /opt/cinema67/oracle
cp .env.production .env
nano .env
```

Compila TUTTI i campi con i tuoi valori (password, chiavi API, ecc.).

Genera un JWT secret forte:
```bash
openssl rand -hex 32
```

## Step 6: Avviare l'applicazione

```bash
cd /opt/cinema67/oracle
docker compose up -d --build
```

Al primo avvio il backend:
- Attende che MariaDB sia pronto
- Applica le migrazioni EF Core
- Popola il database (seed)

Controlla i log:
```bash
docker compose logs -f filmapi
```

## Step 7: Abilitare l'avvio automatico

```bash
sudo systemctl enable cinema67
sudo systemctl start cinema67
```

---

## Comandi utili

```bash
# Stato dei container
docker compose ps

# Log in tempo reale
docker compose logs -f

# Riavviare tutto
docker compose down && docker compose up -d --build

# Backup del database
docker exec mariadb mariadb-dump -u root -p film-api-db > backup.sql

# Backup dei volumi
tar czf media-backup.tar.gz -C /var/lib/docker/volumes/oracle_media-uploads/_data .
```

## Rinnovo certificati SSL

Caddy rinnova i certificati Let's Encrypt automaticamente. Nessuna configurazione necessaria.

---

## Note

- **Costi**: L'Always Free Tier Oracle include 4 OCPU ARM + 24 GB RAM + 200 GB storage. Questa VM ne usa il massimo ma resta gratuita. Nessun costo nascosto.
- **Email**: Per inviare email da Gmail, serve una App Password (Google Account → Security → 2-Step Verification → App Passwords).
- **Stripe Webhook**: Se usi Stripe webhook, aggiorna l'endpoint nel dashboard Stripe a `https://api.cinema67.it/stripe/webhook`.
- **OAuth**: Se usi Google/Microsoft login, aggiorna i redirect URI a `https://api.cinema67.it/auth/google/callback` e `https://api.cinema67.it/auth/microsoft/callback`.
