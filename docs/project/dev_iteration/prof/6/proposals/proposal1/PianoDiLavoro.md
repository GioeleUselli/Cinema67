# Piano di Lavoro - Iterazione 6

Autore: OpenCode con DeepSeek V4 Pro Max

## Obiettivo

Containerizzare completamente l'applicazione CineBase (backend FilmAPI, frontend CineBase.Web, seeder FilmApiSeeder) e orchestrare i servizi tramite docker-compose secondo best practices. Successivamente, effettuare il deployment dell'applicazione containerizzata su Azure Container Apps (ACA) con persistenza dati, segreti gestiti e dominio personalizzato.

## Decisioni Guida della 6

- Il database MariaDB è già containerizzato nel setup locale; l'obiettivo è portare anche backend, frontend e seeder in container con Dockerfile multistage;
- docker-compose deve simulare uno scenario realistico: un utente clona il repository, esegue `docker-compose up -d` e tutto deve funzionare con account admin configurato, servizi e-mail pronti, autenticazione con provider esterni configurata, dati del seeder già inseriti, senza dipendere dall'istanza locale di MariaDB;
- il database parte vuoto e viene popolato dal seeder; non si monta il volume dati dell'istanza locale esistente;
- i Dockerfile devono essere multistage (build + runtime) per minimizzare la dimensione delle immagini;
- il deployment ACA segue un approccio analogo a quello documentato per `EducationalGames`, adattato all'architettura dual-container (backend API + frontend statico) di CineBase;
- il backend FilmAPI funge da API server e media server; il frontend CineBase.Web serve i file statici e le pagine HTML con clean URLs;
- i segreti (JWT, SMTP, OAuth, Stripe, TMDB) vanno gestiti tramite variabili d'ambiente in docker-compose e come segreti ACA in produzione;
- per ACA, si sfrutta Azure Files per la persistenza dei dati MariaDB e per la condivisione delle Data Protection Keys di ASP.NET Core tra repliche.

## Stato Avanzamento Fasi

| Fase | Stato | Note |
| --- | --- | --- |
| FASE 0 - Analisi architetturale e decisioni containerizzazione | **Da avviare** | Deliverable: documento di analisi con decisioni su multi-stage, porte, volumi, variabili d'ambiente, wait-for-it e strategia seeder |
| FASE 1 - Dockerfile FilmAPI (backend multistage) | **Da avviare** | Backend .NET 10 con MariaDB, JWT, CORS, Stripe, OAuth, SMTP |
| FASE 2 - Dockerfile CineBase.Web (frontend multistage) | **Da avviare** | Frontend .NET 10 con static files, clean URLs, security headers |
| FASE 3 - Dockerfile FilmApiSeeder (one-shot) | **Da avviare** | Seeder console app per popolare il database con TMDB |
| FASE 4 - docker-compose.yml e orchestrazione locale | **Da avviare** | Orchestrazione 4 servizi: mariadb, filmapi, cinebase-web, seeder |
| FASE 5 - .env.docker e configurazione ambiente containerizzato | **Da avviare** | File .env.docker con tutte le variabili, gestione segreti, override per container |
| FASE 6 - Test e verifica docker-compose (clone simulato) | **Da avviare** | Simulazione clone da zero e verifica funzionamento completo |
| FASE 7 - Preparazione ACA: ACR e push immagini | **Da avviare** | Azure Container Registry, build e push immagini |
| FASE 8 - Deployment ACA: MariaDB e Azure Files | **Da avviare** | ACA environment, Azure Files per persistenza DB |
| FASE 9 - Deployment ACA: FilmAPI backend | **Da avviare** | Backend con ingress esterno, segreti, variabili d'ambiente |
| FASE 10 - Deployment ACA: CineBase.Web frontend | **Da avviare** | Frontend con ingress esterno, variabili d'ambiente per backend URL |
| FASE 11 - Configurazione dominio, email e autenticazione su ACA | **Da avviare** | Dominio personalizzato, certificato gestito, redirect URI OAuth, SMTP |
| FASE 12 - Test e verifica deployment ACA | **Da avviare** | Test end-to-end dell'applicazione su ACA |

---

## FASE 0 - Analisi architetturale e decisioni containerizzazione

### Scopo

Fissare le decisioni architetturali prima di scrivere i Dockerfile, garantendo coerenza con l'architettura esistente e con le best practices Docker per .NET.

### Contesto

L'applicazione CineBase ha un'architettura dual-container:
- **FilmAPI** (porta 5000): backend .NET 10 Minimal API che serve endpoint REST sotto `/api`, file statici (media), webhook Stripe e callback OAuth esterni. Si connette a MariaDB. Configurazione via variabili d'ambiente (DotNetEnv).
- **CineBase.Web** (porta 5001): frontend .NET 10 che serve HTML/JS/CSS statici con clean URLs e security header (CSP, CORS via backend).
- **FilmApiSeeder**: console app .NET 10 che popola il database con dati TMDB (film, cinema, sale, show, categorie).
- **MariaDB**: database relazionale (versione 10.11+), già containerizzato in sviluppo.

Il browser chiama CineBase.Web per le pagine e FilmAPI direttamente per le API (CORS con credenziali, architettura `direct-backend`).

### Attività

1. Definire le immagini base per build e runtime (.NET SDK 10.0 e ASP.NET 10.0);
2. Decidere la struttura delle porte esposte nei container (backend: 5000, frontend: 5001, mariadb: 3306);
3. Stabilire la strategia di healthcheck per ogni servizio nel docker-compose;
4. Decidere la strategia di attesa avvio: `depends_on` con `condition: service_healthy` per il seeder, che deve partire solo dopo che FilmAPI ha applicato le migrazioni e il DataSeeder ha creato l'account admin;
5. Decidere come gestire il file `.env` nel container: le variabili d'ambiente verranno passate via `environment` o `env_file` in docker-compose, e FilmAPI dovrà leggerle senza dipendere dal filesystem `.env` (il codice cerca già `.env` in tre percorsi ma in container useremo env vars dirette);
6. Decidere il volume per i dati MariaDB: volume Docker named (`mariadb-data`) non bind-mount, per simulare uno scenario pulito;
7. Decidere la strategia di seeding: il seeder (FilmApiSeeder) viene eseguito come container one-shot dopo che FilmAPI è healthy;
8. Decidere la gestione delle immagini media (copertine film, default): servite da FilmAPI via `/media`, le immagini devono essere incluse nell'immagine Docker del backend;
9. Confermare che il `DataSeeder` in `FilmAPI.Program.cs` crea già l'account admin al bootstrap (basta garantire le variabili d'ambiente `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD`);
10. Verificare la compatibilità del seeder con il backend containerizzato (il seeder chiama l'API per creare i dati? O usa direttamente il DbContext?).

### Criteri di accettazione

- Esiste un documento di analisi che elenca tutte le decisioni architetturali con motivazioni;
- Le porte, i volumi, gli healthcheck e la strategia di attesa sono documentati;
- Il ruolo di ogni container nel docker-compose è chiaro;
- La strategia di gestione dei segreti è definita per entrambi gli ambienti (locale e ACA).

### File coinvolti

| File | Modifica |
| --- | --- |
| `docs/project/dev_iteration/6/FASE0_AnalisiArchitetturaleContainerizzazione.md` | Nuovo deliverable di analisi |

---

## FASE 1 - Dockerfile FilmAPI (backend multistage)

### Scopo

Creare un Dockerfile multistage per il backend FilmAPI che produca un'immagine ottimizzata, sicura e pronta per l'esecuzione in container.

### Attività

1. Creare `backend/FilmAPI/Dockerfile` con build stage (SDK .NET 10.0) e runtime stage (ASP.NET 10.0);
2. Build stage:
   - Copiare `backend/FilmAPI/FilmAPI.csproj` ed eseguire `dotnet restore`;
   - Copiare tutto il codice sorgente ed eseguire `dotnet publish -c Release -o /app/publish`;
3. Runtime stage:
   - Usare `mcr.microsoft.com/dotnet/aspnet:10.0` come base;
   - Copiare i file pubblicati da `/app/publish`;
   - Copiare la directory `backend/FilmAPI/wwwroot` (media statici come cover-default.jpg, QR template, ecc.);
   - Esporre la porta 5000 (o 8080 per convenzione container);
   - Configurare `ASPNETCORE_URLS=http://+:5000` (o `http://+:8080`);
   - Impostare `ASPNETCORE_ENVIRONMENT=Production` come default (override via docker-compose per Development);
   - Aggiungere `HEALTHCHECK` su `/api` o un endpoint dedicato;
4. Assicurarsi che il codice non cerchi di caricare `.env` da filesystem quando eseguito in container (fallback sicuro su env vars di sistema);
   - Verificare il comportamento di `DotNetEnv` nel Program.cs: se non trova i file `.env` nei percorsi configurati, deve comunque avviarsi usando le env vars del sistema operativo;
5. Aggiungere `.dockerignore` in `backend/` per escludere `bin`, `obj`, `.env` (che contiene segreti reali), `node_modules`, ecc.;
6. Testare la build dell'immagine e l'avvio del container isolato (connesso a MariaDB locale);
7. Assicurarsi che le migrazioni EF vengano applicate automaticamente all'avvio (verificare che `DataSeeder.SeedAsync` esegua `Database.MigrateAsync()` o equivalente);
8. Verificare che il backend risponda correttamente su `http://localhost:5000/api/` con Swagger (o almeno un health endpoint).

### Criteri di accettazione

- `docker build -t cinebase-filmapi:latest -f backend/FilmAPI/Dockerfile .` completa con successo;
- Il container si avvia, si connette a MariaDB, applica le migrazioni e risponde alle richieste API;
- La dimensione dell'immagine runtime è sensibilmente inferiore a quella di build (multistage efficace);
- Non ci sono segreti hardcodati nell'immagine;
- L'HEALTHCHECK risponde correttamente.

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `backend/FilmAPI/Dockerfile` | **Nuovo** — Dockerfile multistage per il backend |
| `backend/.dockerignore` | **Nuovo** — esclude bin, obj, .env, node_modules, .git |
| `backend/FilmAPI/Program.cs` | Eventuale modifica per fallback env vars senza `.env` file (se necessario) |

---

## FASE 2 - Dockerfile CineBase.Web (frontend multistage)

### Scopo

Creare un Dockerfile multistage per il frontend CineBase.Web che serva i file statici con clean URLs e security headers.

### Attività

1. Creare `frontend/CineBase.Web/Dockerfile` con build stage e runtime stage;
2. Build stage:
   - Copiare `frontend/CineBase.Web/CineBase.Web.csproj` ed eseguire `dotnet restore`;
   - Copiare tutto il codice ed eseguire `dotnet publish -c Release -o /app/publish`;
   - Verificare che `npm run build:assets` sia stato eseguito (Tailwind, Font Awesome, Inter) — se `wwwroot/css/tailwind.css`, `wwwroot/vendor/` ecc. sono già committati, non serve npm nel Dockerfile;
3. Runtime stage:
   - Usare `mcr.microsoft.com/dotnet/aspnet:10.0` come base;
   - Copiare i file pubblicati e `wwwroot/` completa;
   - Esporre la porta 5001 (o 8080);
   - Configurare `ASPNETCORE_URLS=http://+:5001`;
   - Configurare `ASPNETCORE_ENVIRONMENT=Production`;
   - Aggiungere `HEALTHCHECK`;
4. Il frontend JS chiama il backend tramite `API_BASE_URL` (definito in `api.js` o `runtime-config.js`). In container, l'URL del backend deve essere configurabile. Verificare come il frontend determina l'URL del backend:
   - Il file `runtime-config.js` viene servito dal backend a `/api/config/frontend`;
   - La configurazione API base URL va gestita via variabili d'ambiente o URL relativo;
5. Aggiungere `.dockerignore` in `frontend/`;
6. Testare la build e l'avvio del container.

### Criteri di accettazione

- `docker build -t cinebase-web:latest -f frontend/CineBase.Web/Dockerfile .` completa con successo;
- Il container serve correttamente le pagine HTML con clean URLs e security headers;
- L'immagine finale ha dimensione ridotta;
- Il frontend può raggiungere il backend via rete Docker (in docker-compose userà il service name `filmapi`).

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `frontend/CineBase.Web/Dockerfile` | **Nuovo** — Dockerfile multistage per il frontend |
| `frontend/.dockerignore` | **Nuovo** — esclude bin, obj, node_modules |
| `frontend/CineBase.Web/wwwroot/js/api.js` | Eventuale modifica per supportare API_BASE_URL configurabile via env |

---

## FASE 3 - Dockerfile FilmApiSeeder (one-shot)

### Scopo

Creare un Dockerfile per il seeder FilmApiSeeder, progettato come container one-shot che si avvia, popola il database e termina.

### Attività

1. Creare `backend/scripts/FilmApiSeeder/Dockerfile` (o un unico Dockerfile nella root degli script);
2. Poiché il seeder ha una dipendenza di progetto su FilmAPI (che include Entity Framework, DbContext, servizi), il Dockerfile deve:
   - Avere accesso al sorgente di FilmAPI durante la build;
   - Pubblicare il seeder insieme alle sue dipendenze;
3. Struttura Dockerfile:
   - Build stage: SDK .NET, copiare `backend/FilmAPI/` e `backend/scripts/FilmApiSeeder/`, eseguire `dotnet publish` per il progetto seeder;
   - Runtime stage: usare SDK .NET (non solo runtime) perché il seeder usa Entity Framework per interrogare/modificare il DB;
   - Esporre nessuna porta (container one-shot);
   - Configurare le env vars per la connessione DB e il token TMDB;
   - L'entrypoint deve accettare parametri (es. `--force --reset-all` opzionale in sviluppo);
4. Verificare che il seeder funzioni correttamente quando eseguito dopo l'avvio di FilmAPI;
5. Assicurarsi che il seeder aspetti che il database sia accessibile (può usare `depends_on` con healthcheck o un wrapper script di retry).

### Criteri di accettazione

- `docker build -t cinebase-seeder:latest -f backend/scripts/FilmApiSeeder/Dockerfile .` completa con successo;
- Il container esegue il seeding e termina con exit code 0;
- I dati (film, cinema, sale, show, categorie, registi) sono presenti nel database dopo l'esecuzione;
- L'account admin creato dal DataSeeder di FilmAPI è ancora presente e funzionante dopo il seeding.

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `backend/scripts/FilmApiSeeder/Dockerfile` | **Nuovo** — Dockerfile per il seeder |

---

## FASE 4 - docker-compose.yml e orchestrazione locale

### Scopo

Creare il file `docker-compose.yml` che orchestra tutti i servizi: MariaDB, FilmAPI, CineBase.Web e FilmApiSeeder, con l'obiettivo che un semplice `docker-compose up -d` avvii tutto e produca un'applicazione completamente funzionante.

### Attività

1. Creare `docker-compose.yml` nella root del repository;
2. Definire i servizi:
   - **mariadb**: immagine `mariadb:11.4`, volume `mariadb-data:/var/lib/mysql`, env vars `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, healthcheck su `mysqladmin ping`, porta `3306` esposta solo internamente (o mappata per sviluppo);
   - **filmapi**: build da `backend/FilmAPI/Dockerfile`, dipende da `mariadb` con `condition: service_healthy`, env vars per connessione DB e tutti i segreti, porta `5000` mappata, healthcheck su `/api` o endpoint dedicato;
   - **cinebase-web**: build da `frontend/CineBase.Web/Dockerfile`, dipende da `filmapi` con `condition: service_started`, env vars per URL backend, porta `5001` mappata;
   - **seeder**: build da `backend/scripts/FilmApiSeeder/Dockerfile`, dipende da `filmapi` con `condition: service_healthy`, env vars per connessione DB e TMDB token, `restart: "no"` (one-shot);
3. Configurare i volumi:
   - `mariadb-data`: volume named per i dati del database;
   - (opzionale) `media-data`: per i file media caricati, se il backend scrive su filesystem;
4. Configurare la rete:
   - Rete bridge `cinebase-net` per la comunicazione tra container;
   - I container si raggiungono tramite service name (es. `mariadb`, `filmapi`);
5. Gestire l'ordine di avvio:
   - `mariadb` → healthy;
   - `filmapi` → avviato dopo mariadb (migrazioni + DataSeeder);
   - `cinebase-web` → avviato dopo filmapi;
   - `seeder` → avviato dopo filmapi healthy (popola dati);
6. Configurare le env vars per ogni servizio (usando `env_file` o `environment` con riferimento a `.env.docker`);
7. Aggiungere profili docker-compose opzionali:
   - Profilo `dev` con bind-mount dei sorgenti per hot reload;
   - Profilo `prod` per simulare l'ambiente di produzione;
8. Documentare i comandi principali:
   - `docker-compose up -d`: avvio completo;
   - `docker-compose down -v`: rimozione completa inclusi volumi;
   - `docker-compose build --no-cache`: rebuild pulito.

### Criteri di accettazione

- `docker-compose up -d` dalla root del repository avvia tutti i servizi;
- Dopo l'avvio (incluso il completamento del seeder):
  - Il frontend è raggiungibile su `http://localhost:5001`;
  - L'API backend è raggiungibile su `http://localhost:5000/api/`;
  - La pagina `/cinema` mostra i cinema caricati dal seeder;
  - La pagina `/programmazione` mostra i film in programmazione;
  - Il login con `admin@cinebase.it` / `Admin123!` funziona;
  - I servizi email sono configurati e funzionanti;
  - L'autenticazione Google e Microsoft sono configurabili via env vars;
- `docker-compose down -v` rimuove tutto, inclusi i dati DB;
- Un successivo `docker-compose up -d` ricrea tutto da zero (idempotente).

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `docker-compose.yml` | **Nuovo** — file di orchestrazione Docker Compose |
| `docker-compose.override.yml` | **Nuovo** (opzionale) — override per sviluppo locale |

---

## FASE 5 - .env.docker e configurazione ambiente containerizzato

### Scopo

Creare un file `.env.docker` con tutte le variabili d'ambiente necessarie per l'esecuzione containerizzata, separato dal `.env` locale, e assicurarsi che il backend legga correttamente le variabili d'ambiente senza dipendere dal filesystem.

### Contesto

Il backend FilmAPI usa `DotNetEnv` per caricare un file `.env` dal filesystem. In produzione containerizzata, le variabili d'ambiente vengono iniettate dal runtime Docker e non esiste un file `.env`. Il codice attuale cerca `.env` in tre percorsi, ma in container questi file non esisteranno e le variabili devono provenire dall'ambiente di sistema.

### Attività

1. Creare `.env.docker` nella root del repository con tutte le variabili d'ambiente necessarie, usando valori placeholder per i segreti reali;
2. Le variabili da definire includono:
   - **Database**: `DB_HOST=mariadb`, `DB_PORT=3306`, `DB_NAME=film-api-db`, `DB_USER=root`, `DB_PASSWORD`, `DB_USE_AUTODETECT`, `DB_SERVER_VERSION`;
   - **JWT**: `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_TOKEN_EXPIRY_MINUTES`, `JWT_REFRESH_TOKEN_EXPIRY_DAYS`;
   - **Admin seed**: `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`;
   - **SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`;
   - **Stripe**: `STRIPE_SECRET_API_KEY`, `STRIPE_PUBLISHABLE_API_KEY`, `STRIPE_WEBHOOK_SECRET`;
   - **Google OAuth**: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`;
   - **Microsoft OAuth**: `MICROSOFT_OAUTH_CLIENT_ID`, `MICROSOFT_OAUTH_CLIENT_SECRET`, `MICROSOFT_OAUTH_REDIRECT_URI`, `MICROSOFT_AUTHORITY`;
   - **TMDB**: `TMDB_BEARER_TOKEN`;
   - **URLs**: `FRONTEND_PUBLIC_BASE_URL`, `CORS_ALLOWED_ORIGINS`, `TICKET_VALIDATION_BASE_URL`;
   - **Ticketing**: `DEFAULT_TICKET_PRICE`, `HOLD_TTL_MINUTES`, `MAX_SEATS_PER_ORDER`;
   - **Rate limiting e TTL**: varie variabili di rate limit e token TTL;
   - **Legal**: `PRIVACY_POLICY_VERSION`, `TERMS_CONDITIONS_VERSION`, `COOKIE_POLICY_VERSION`;
3. Verificare che il `Program.cs` di FilmAPI gestisca il caso in cui `DotNetEnv.Load()` non trovi alcun file `.env`: deve proseguire usando le variabili d'ambiente di sistema (quelle iniettate da Docker). Se necessario, modificare il codice per rendere il caricamento `.env` opzionale;
4. Modificare `docker-compose.yml` per referenziare `.env.docker` con `env_file`;
5. Aggiungere `.env.docker` a `.gitignore` (contiene placeholder, ma meglio evitare commit accidentali con valori reali)? In realtà va committato come template, ma con valori placeholder. Creare un `.env.docker.example` con placeholder e istruzioni;
6. Documentare nel README o in un file di istruzioni come copiare `.env.docker.example` in `.env.docker` e popolare i valori reali.

### Criteri di accettazione

- `.env.docker.example` esiste con tutte le variabili e placeholder descrittivi;
- `docker-compose up -d` usa `.env.docker` e i servizi partono correttamente;
- Il backend non crasha se il file `.env` non esiste nel filesystem del container;
- I segreti non sono hardcodati nei Dockerfile o nel docker-compose.

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `.env.docker.example` | **Nuovo** — template variabili d'ambiente per Docker |
| `docker-compose.yml` | Modifica per usare `env_file: .env.docker` |
| `.gitignore` | Aggiungere `.env.docker` (il file reale va creato localmente) |
| `backend/FilmAPI/Program.cs` | Eventuale modifica per rendere `.env` file opzionale |

---

## FASE 6 - Test e verifica docker-compose (clone simulato)

### Scopo

Simulare lo scenario di un nuovo sviluppatore che clona il repository e avvia l'applicazione con docker-compose, verificando che tutto funzioni correttamente.

### Attività

1. Clonare il repository in una directory temporanea (o usare `git clean -fdx` per pulire i file non tracciati);
2. Copiare `.env.docker.example` in `.env.docker` e inserire valori di test validi:
   - Password JWT generata casualmente;
   - Password admin;
   - Token TMDB valido;
   - Credenziali SMTP di test (es. Maildev o Papercut per test locale);
   - Credenziali OAuth di test (o placeholder che non bloccano l'avvio);
   - Chiavi Stripe di test;
3. Eseguire `docker-compose up -d`;
4. Attendere il completamento di tutti i container (incluso il seeder);
5. Verificare:
   - **Frontend**: `http://localhost:5001` mostra la home page con i film in evidenza;
   - **Programmazione**: `http://localhost:5001/programmazione` mostra i film del seeder;
   - **Cinema**: `http://localhost:5001/cinema` mostra i cinema con indirizzi;
   - **Scheda film**: `http://localhost:5001/film/{id}` mostra i dettagli;
   - **Login admin**: login con `admin@cinebase.it` / `Admin123!` funziona (se il seeder non sovrascrive l'admin);
   - **Admin panel**: `/admin` accessibile dopo login;
   - **API**: `http://localhost:5000/api/films` restituisce JSON con i film;
   - **Database**: i dati sono persistenti dopo `docker-compose restart`;
6. Testare `docker-compose down -v` e verificare che i dati vengano rimossi;
7. Rieseguire `docker-compose up -d` e verificare che tutto venga ricreato correttamente (idempotenza);
8. Documentare eventuali problemi e soluzioni.

### Criteri di accettazione

- Il flusso "clone → copia .env → docker-compose up" funziona senza errori;
- Tutte le pagine principali sono raggiungibili e mostrano dati reali;
- Login admin funziona;
- Il database è persistente tra restart dei container;
- `docker-compose down -v` rimuove tutto e un successivo `up` ricrea correttamente.

### File coinvolti

| File | Modifica |
| --- | --- |
| `docs/project/dev_iteration/6/FASE6_ReportTestDockerCompose.md` | **Nuovo** — report dei test di verifica |

---

## FASE 7 - Preparazione ACA: Azure Container Registry e push immagini

### Scopo

Creare un Azure Container Registry (ACR) e pushare le immagini Docker di CineBase (backend, frontend), preparando il terreno per il deployment su Azure Container Apps.

### Attività

1. Creare un resource group Azure per tutti i servizi ACA (es. `cinebase-aca-rg`);
2. Creare un Azure Container Registry (SKU Basic) nella region desiderata (es. `italynorth` o `westeurope`);
3. Abilitare l'admin user su ACR (o configurare l'identità gestita per ACA);
4. Effettuare il login ad ACR dalla macchina locale;
5. Buildare e taggare le immagini per ACR:
   - `docker build -t cinebase-filmapi:latest -f backend/FilmAPI/Dockerfile .`
   - `docker tag cinebase-filmapi:latest $ACR_LOGIN_SERVER/cinebase-filmapi:latest`
   - `docker push $ACR_LOGIN_SERVER/cinebase-filmapi:latest`
   - Stessa procedura per `cinebase-web`;
6. Il seeder non serve su ACA (verrà eseguito una tantum o i dati saranno importati diversamente). Valutare se eseguire il seeder come container job su ACA o se popolare il DB in altro modo;
7. Documentare i comandi `az` necessari nel deliverable di deployment.

### Criteri di accettazione

- ACR creato e raggiungibile;
- Entrambe le immagini (backend e frontend) sono presenti in ACR;
- Le immagini sono taggate correttamente;
- ACA può pullare le immagini da ACR (identity o credenziali configurate).

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `docs/project/dev_iteration/6/FASE7_GuidaDeploymentACA.md` | **Nuovo** — guida step-by-step al deployment ACA (parte 1: ACR) |

---

## FASE 8 - Deployment ACA: MariaDB e Azure Files

### Scopo

Distribuire MariaDB su Azure Container Apps con persistenza dati tramite Azure Files, seguendo l'approccio della guida EducationalGames.

### Attività

1. Creare un Log Analytics Workspace per l'ambiente ACA;
2. Creare l'ambiente Azure Container Apps (ACA Environment);
3. Creare un Azure Storage Account e una condivisione Azure Files per i dati MariaDB:
   - Nome condivisione: `mariadb-data`;
   - Quota: 5 GB (iniziale, scalabile);
   - Protocollo: SMB;
4. Creare l'app container per MariaDB:
   - Immagine: `mariadb:11.4` (da Docker Hub, non da ACR);
   - Segreto: `mariadb-root-password`;
   - Volume: montare Azure Files su `/var/lib/mysql`;
   - Ingress: interno (porta 3306), accessibile solo dalle altre app container nell'ambiente;
   - CPU/memoria: 0.5 CPU, 1 Gi (adeguabile);
   - `min-replicas: 1` (per demo va bene anche 0, ma per produzione meglio 1);
   - `max-replicas: 1`;
5. Configurare le variabili d'ambiente per MariaDB:
   - `MYSQL_ROOT_PASSWORD=secretref:mariadb-root-password`;
   - `MYSQL_DATABASE=film-api-db`;
6. Verificare che MariaDB sia raggiungibile e i dati persistano tra restart.

### Criteri di accettazione

- MariaDB è in esecuzione su ACA;
- Il database `film-api-db` è creato;
- I dati persistono dopo il restart del container;
- La connessione è raggiungibile solo internamente all'ambiente ACA.

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `docs/project/dev_iteration/6/FASE7_GuidaDeploymentACA.md` | Aggiornamento — parte 2: MariaDB e Azure Files |

---

## FASE 9 - Deployment ACA: FilmAPI backend

### Scopo

Distribuire il backend FilmAPI su Azure Container Apps con ingress esterno, segreti gestiti e connessione a MariaDB.

### Attività

1. Preparare la configurazione dell'app container per FilmAPI:
   - Immagine: da ACR (`$ACR_LOGIN_SERVER/cinebase-filmapi:latest`);
   - Ingress: esterno su porta 5000 (o 8080);
   - CPU/memoria: 0.5 CPU, 1 Gi;
   - `min-replicas: 1`, `max-replicas: 3`;
2. Configurare i segreti ACA:
   - `mariadb-root-password`, `jwt-secret`, `smtp-password`;
   - `auth-google-clientid`, `auth-google-clientsecret`;
   - `auth-microsoft-clientid`, `auth-microsoft-clientsecret`;
   - `stripe-secret-api-key`, `stripe-webhook-secret`;
   - `azure-storage-account-key`;
3. Configurare le variabili d'ambiente:
   - `ASPNETCORE_ENVIRONMENT=Production`;
   - `DB_HOST=mariadb-server`, `DB_PORT=3306`, `DB_NAME=film-api-db`, `DB_USER=root`, `DB_PASSWORD=secretref:mariadb-root-password`;
   - Vari JWT, SMTP, Stripe, OAuth, TMDB come `secretref:*` o valori diretti;
   - `FRONTEND_PUBLIC_BASE_URL=https://$WEBAPP_FQDN` (il dominio del frontend);
   - `CORS_ALLOWED_ORIGINS=https://$WEBAPP_FQDN`;
   - `DEFAULT_COVER_IMAGE_PATH=/media/defaults/cover-default.jpg`;
4. Configurare la condivisione Azure Files per le Data Protection Keys:
   - Nome condivisione: `dataprotection-keys`;
   - Quota: 1 GB;
   - Montata su `/mnt/dataprotectionkeys`;
5. Modificare `Program.cs` di FilmAPI per supportare Data Protection Keys condivise via Azure Files (se non già presente):
   - Aggiungere `builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo("/mnt/dataprotectionkeys"))` quando `DATA_PROTECTION_KEYS_PATH` è impostato;
6. Abilitare l'affinità di sessione (`--enable-session-affinity`) per supportare il refresh cookie JWT;
7. Verificare che il backend risponda su HTTPS all'URL ACA e che le API siano funzionanti;
8. Verificare che il `DataSeeder` venga eseguito al primo avvio (crea admin, platform settings) e che sia idempotente (non duplichi dati a ogni restart).

### Criteri di accettazione

- FilmAPI è raggiungibile su HTTPS all'URL ACA;
- `/api/films` restituisce dati JSON (vuoti prima del seeding);
- L'account admin è configurato e funzionante;
- Il backend si connette a MariaDB su ACA;
- CORS funziona con il dominio del frontend;
- Le Data Protection Keys sono persistenti su Azure Files;
- Lo scaling a più repliche non rompe l'autenticazione.

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `backend/FilmAPI/Program.cs` | Aggiungere supporto Data Protection Keys path |
| `docs/project/dev_iteration/6/FASE7_GuidaDeploymentACA.md` | Aggiornamento — parte 3: FilmAPI backend |

---

## FASE 10 - Deployment ACA: CineBase.Web frontend

### Scopo

Distribuire il frontend CineBase.Web su Azure Container Apps con ingress esterno e connessione al backend.

### Attività

1. Preparare la configurazione dell'app container per CineBase.Web:
   - Immagine: da ACR (`$ACR_LOGIN_SERVER/cinebase-web:latest`);
   - Ingress: esterno su porta 5001 (o 8080);
   - CPU/memoria: 0.25 CPU, 0.5 Gi (il frontend è leggero, serve solo file statici);
   - `min-replicas: 1`, `max-replicas: 3`;
2. Configurare le variabili d'ambiente:
   - `ASPNETCORE_ENVIRONMENT=Production`;
   - `ASPNETCORE_URLS=http://+:5001`;
   - (Se necessario) `BACKEND_API_BASE_URL=https://$BACKEND_FQDN` per configurare l'URL del backend nel frontend;
3. Verificare che il frontend JS punti correttamente al backend ACA:
   - In sviluppo locale, il frontend chiama `localhost:5000/api/...`;
   - Su ACA, il frontend deve chiamare l'URL pubblico del backend FilmAPI;
   - La strategia: usare una variabile d'ambiente `API_BASE_URL` o un file `runtime-config.js` generato dinamicamente;
   - Alternativa: se frontend e backend sono sullo stesso dominio (reverse proxy), usare URL relativi;
   - Per CineBase, l'architettura `direct-backend` prevede che il frontend chiami direttamente il backend via CORS. Su ACA, il frontend deve conoscere l'URL del backend. Valutare le opzioni:
     - Opzione A: variabile d'ambiente iniettata nel `runtime-config.js` dal backend al momento del serving;
     - Opzione B: variabile d'ambiente iniettata nel frontend all'avvio del container;
     - Opzione C: URL relativo se si usa un reverse proxy (es. Front Door o Application Gateway);
4. Se si sceglie l'Opzione A, documentare come il backend genera il `runtime-config.js` con l'URL corretto;
5. Se si sceglie l'Opzione B, modificare l'entrypoint del frontend per scrivere un `runtime-config.js` con l'URL del backend;
6. Verificare che il frontend sia raggiungibile su HTTPS e che le pagine vengano servite correttamente;
7. Verificare che le chiamate API dal browser al backend funzionino (CORS configurato correttamente).

### Criteri di accettazione

- CineBase.Web è raggiungibile su HTTPS all'URL ACA;
- La home page mostra i film in evidenza (dati dal backend);
- Le pagine di programmazione, cinema, scheda film funzionano;
- Login funziona (token JWT in memoria, refresh cookie HttpOnly);
- I security headers (CSP, X-Frame-Options, ecc.) sono presenti;
- Il frontend scala a più repliche senza perdita di funzionalità.

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `frontend/CineBase.Web/Program.cs` | Eventuale modifica per generare `runtime-config.js` con API_BASE_URL |
| `frontend/CineBase.Web/wwwroot/js/api.js` | Eventuale modifica per leggere API_BASE_URL da `runtime-config.js` |
| `docs/project/dev_iteration/6/FASE7_GuidaDeploymentACA.md` | Aggiornamento — parte 4: CineBase.Web frontend |

---

## FASE 11 - Configurazione dominio, email e autenticazione su ACA

### Scopo

Configurare il dominio personalizzato (se disponibile), i certificati TLS/SSL, l'invio email tramite SMTP e l'autenticazione con provider esterni (Google, Microsoft) per l'ambiente ACA.

### Attività

1. **Dominio personalizzato e certificati**:
   - Acquisire o configurare un dominio personalizzato (es. `cinebase.example.com`);
   - Configurare i record DNS (CNAME e TXT di validazione) presso il provider DNS;
   - Aggiungere il dominio personalizzato all'app container frontend in ACA;
   - Scegliere l'opzione "Certificato gestito da Container Apps" per HTTPS automatico con rinnovo;
   - Verificare che il dominio funzioni con HTTPS;
2. **Aggiornare gli URI di redirect OAuth**:
   - **Google Cloud Console**: aggiungere `https://<dominio-backend>/auth/external/google/callback` agli URI di reindirizzamento autorizzati;
   - **Microsoft Entra ID**: aggiornare gli URI di reindirizzamento per includere `https://<dominio-backend>/auth/external/microsoft/callback`;
3. **Configurazione email SMTP**:
   - Verificare che le variabili d'ambiente SMTP siano correttamente impostate nei segreti ACA;
   - Se si usa Gmail SMTP, assicurarsi di usare una "Password per le app";
   - Testare l'invio email (registrazione, reset password, biglietti);
4. **Configurazione Stripe webhook**:
   - Aggiornare l'endpoint webhook in Stripe Dashboard per puntare a `https://<dominio-backend>/pagamento/webhook`;
   - Aggiornare il `STRIPE_WEBHOOK_SECRET` con il segreto del nuovo endpoint;
5. **Altre configurazioni**:
   - Verificare che `FRONTEND_PUBLIC_BASE_URL` punti al dominio corretto;
   - Verificare che `CORS_ALLOWED_ORIGINS` includa il dominio del frontend;
   - Configurare eventuali regole di scalabilità automatica (scale rules) basate su CPU/memoria/richieste HTTP.

### Criteri di accettazione

- Il dominio personalizzato funziona con HTTPS (certificato valido);
- Il login con Google reindirizza correttamente al dominio ACA e completa l'autenticazione;
- Il login con Microsoft funziona analogamente;
- Le email vengono inviate e ricevute (registrazione, notifiche);
- I webhook Stripe vengono ricevuti correttamente;
- L'applicazione è completamente funzionante sul dominio di produzione.

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `docs/project/dev_iteration/6/FASE7_GuidaDeploymentACA.md` | Aggiornamento — parte 5: dominio, email, OAuth |

---

## FASE 12 - Test e verifica deployment ACA

### Scopo

Eseguire test end-to-end sull'applicazione distribuita su ACA per verificare il corretto funzionamento di tutte le funzionalità critiche.

### Attività

1. **Test funzionali**:
   - Navigare tutte le pagine pubbliche (home, programmazione, cinema, scheda film);
   - Registrare un nuovo utente e verificare l'email di verifica;
   - Effettuare il login con credenziali locali;
   - Effettuare il login con Google;
   - Effettuare il login con Microsoft;
   - Prenotare un posto e completare un acquisto (test Stripe in modalità test);
   - Verificare la ricezione dei biglietti via email;
   - Validare un biglietto;
   - Accedere all'area admin e verificare le CRUD principali;
2. **Test di carico e scalabilità**:
   - Verificare che lo scaling automatico funzioni (simulare carico);
   - Verificare che la sessione auth persista tra repliche (session affinity + Data Protection Keys condivise);
3. **Test di resilienza**:
   - Riavviare il backend e verificare che il frontend gestisca il disservizio temporaneo;
   - Riavviare MariaDB e verificare che il backend si riconnetta;
   - Verificare che i dati persistano dopo restart dei container;
4. **Monitoraggio**:
   - Controllare i log in Log Analytics;
   - Verificare le metriche di CPU, memoria e richieste;
   - Configurare eventuali alert;
5. Documentare i risultati in un report di test.

### Criteri di accettazione

- Tutti i flussi utente principali funzionano su ACA;
- L'autenticazione multi-provider funziona;
- Gli acquisti e i pagamenti funzionano con Stripe;
- Le email vengono inviate e ricevute;
- Il sistema è resiliente ai restart dei container;
- I log sono accessibili e significativi;
- La scalabilità automatica funziona senza rompere le sessioni.

### File da creare/modificare

| File | Modifica |
| --- | --- |
| `docs/project/dev_iteration/6/FASE12_ReportTestACA.md` | **Nuovo** — report dei test end-to-end su ACA |

---

## Riepilogo file da creare/modificare

| File | Fase | Tipo |
| --- | --- | --- |
| `docs/project/dev_iteration/6/FASE0_AnalisiArchitetturaleContainerizzazione.md` | 0 | Nuovo |
| `backend/FilmAPI/Dockerfile` | 1 | Nuovo |
| `backend/.dockerignore` | 1 | Nuovo |
| `backend/FilmAPI/Program.cs` | 1, 5, 9 | Modifica |
| `frontend/CineBase.Web/Dockerfile` | 2 | Nuovo |
| `frontend/.dockerignore` | 2 | Nuovo |
| `frontend/CineBase.Web/wwwroot/js/api.js` | 2, 10 | Modifica |
| `backend/scripts/FilmApiSeeder/Dockerfile` | 3 | Nuovo |
| `docker-compose.yml` | 4 | Nuovo |
| `docker-compose.override.yml` | 4 | Nuovo (opzionale) |
| `.env.docker.example` | 5 | Nuovo |
| `.gitignore` | 5 | Modifica |
| `docs/project/dev_iteration/6/FASE6_ReportTestDockerCompose.md` | 6 | Nuovo |
| `docs/project/dev_iteration/6/FASE7_GuidaDeploymentACA.md` | 7-11 | Nuovo |
| `docs/project/dev_iteration/6/FASE12_ReportTestACA.md` | 12 | Nuovo |
| `frontend/CineBase.Web/Program.cs` | 10 | Modifica |
