# Piano di Lavoro - Iterazione 6

Autore: Antigravity con Gemini 3.1 xHigh

## Obiettivo

Portare l'applicazione CineBase a uno stato "production-ready" architetturale e infrastrutturale. Questo si tradurrà in:

1. **Setup locale containerizzato "One-Click"**: Tramite `docker-compose`, qualsiasi sviluppatore dovrà poter lanciare l'intera applicazione da zero (`docker-compose up -d --build`). Questo setup prevedrà una nuova istanza di MariaDB pulita, sulla quale verranno applicate migrazioni e il seeding dei dati (film via TMDB, utenti, cataloghi base) tramite un job automatico. Tutto questo simulerà lo scenario reale, senza appoggiarsi al LocalDB attualmente preesistente sulla macchina utente.
2. **Deployment in Cloud su Azure Container Apps (ACA)**: L'architettura verrà migrata su Azure utilizzando le Container Apps. Verranno implementate tutte le best practice documentate, inclusa l'esternalizzazione dello storage del database tramite Azure Files SMB e la persistenza condivisa delle chiavi di Data Protection (ASP.NET Core) per garantire che l'app sia pronta alla scalabilità orizzontale senza invalidare sessioni e token di anti-forgery.

## Decisioni Guida della Iterazione 6

- **Multi-stage Dockerfiles**: Tutte le immagini (`FilmAPI`, `CineBase.Web`, `FilmApiSeeder`) utilizzeranno Dockerfile multistage per ridurre le dimensioni finali dei container e ottimizzare la sicurezza (uso di immagini runtime base come Alpine o simili, o comunque immagini non-SDK in produzione).
- **Zero Configuration Hardcoded**: Nessun segreto (es. `ConnectionStrings`, chiavi JWT, `AdminPassword`, credenziali TMDB, `SmtpServer`) dovrà risiedere direttamente nel codice o nei file `appsettings.json`. Sarà tutto demandato all'uso di Environment Variables.
- **Security-First negli Immagini**: I container devono girare nativamente senza privilegi di root (usare utente `app` o creare utente low-privilege dedicato). 
- **Persistenza Indipendente**: In ambiente cloud, sia la persistenza del Database che lo stack delle chiavi di crittografia .NET verranno affidati a volumi remoti.

---

## Stato Avanzamento Fasi

| Fase | Stato | Note |
| --- | --- | --- |
| FASE 0 - Assessment, Normalizzazione Environment e Secrets | **Da Iniziare** | Rimozione hardcoded, introduzione `.env.example`. |
| FASE 1 - Containerizzazione `FilmAPI` (Backend) e Data Protection | **Da Iniziare** | Dockerfile multistage API, hook per Data Protection. |
| FASE 2 - Containerizzazione `FilmApiSeeder` (Inizializzazione Dati) | **Da Iniziare** | Dockerfile job seeder, wait-for-it pattern DB. |
| FASE 3 - Containerizzazione `CineBase.Web` (Frontend) | **Da Iniziare** | Dockerfile multistage Web, integrazione build asset Tailwind. |
| FASE 4 - Orchestrazione locale: `docker-compose.yml` | **Da Iniziare** | Setup locale zero-config, network e volumi docker. |
| FASE 5 - Provisioning Infrastruttura Azure Base (ACR e Storage) | **Da Iniziare** | Creazione registry, environment, File Shares (SMB). |
| FASE 6 - Deployment Dati: MariaDB in ACA e Share Keys | **Da Iniziare** | Deploy database in container ACA con volume Azure Files. |
| FASE 7 - Deployment Applicativo: Backend API e Seeder Job su ACA | **Da Iniziare** | Deploy backend e job per setup database. Ingress External/Internal. |
| FASE 8 - Deployment Frontend WebApp su ACA | **Da Iniziare** | Deploy front-end, Ingress External, binding env vars CORS. |
| FASE 9 - Refinements: SSL, CORS, OAuth, Mail in Cloud | **Da Iniziare** | Validazione flussi esterni su dominio cloud, check invio mail e log. |

---

## FASE 0 - Assessment, Normalizzazione Environment e Secrets

### Scopo
Preparare l'intera base di codice applicativa per essere dinamica e "12-factor app compliant". I segreti e i path assoluti devono scomparire dal codice.

### Attività Dettagliate
- **Censimento Variabili**: Analizzare i file `appsettings.json` e `appsettings.Development.json` all'interno di `backend/FilmAPI/` e `frontend/CineBase.Web/`. Identificare tutti i nodi sensibili (es. `ConnectionStrings:DefaultConnection`, `Jwt:Key`, `Email:SmtpPassword`, `Google:ClientId`).
- **File `.env.example`**: Creare un file `.env.example` nella root directory del repository. Questo file conterrà il template per tutte le variabili d'ambiente usate nell'app (es. `MARIADB_ROOT_PASSWORD`, `ConnectionStrings__DefaultConnection`, ecc.), con commenti esplicativi.
- **Aggiornamento Codice API**: Assicurarsi che `FilmAPI` e `FilmApiSeeder` leggano correttamente le impostazioni d'ambiente, affidandosi al provider gerarchico integrato in .NET Core (es. il mapping environment `ConnectionStrings__DefaultConnection` va sovrascrivere il nodo json `ConnectionStrings:DefaultConnection`).
- **Aggiornamento Codice WebApp**: Analizzare `CineBase.Web` e accertarsi che la risoluzione dell'URL per il backend (variabile per far puntare il client JS all'API) avvenga o tramite configurazione dinamica fornita a runtime dal server ASP.NET Core MVC (es. renderizzata nella View) o tramite reverse proxy configurato correttamente. Sostituire qualsiasi hardcoding legato a `localhost:5000`.

### Criteri di accettazione
- Nessuna password, token o path locale esiste più hardcodato nei file di codice o json nel repository Git.
- Esiste un file `.env.example` chiaro che un nuovo sviluppatore può copiare come `.env` e personalizzare.

---

## FASE 1 - Containerizzazione `FilmAPI` (Backend) e Data Protection

### Scopo
Creare il container definitivo per le API, ottimizzato per dimensioni, sicurezza e compatibile con un deployment replicato orizzontalmente (dove la statefulness di crittografia è su file share esterna).

### Attività Dettagliate
- **Creazione Dockerfile API**: Creare `backend/FilmAPI/Dockerfile`.
  - Usare `mcr.microsoft.com/dotnet/sdk:10.0` per lo step di build (`AS build`). Copiare `.csproj`, fare `dotnet restore`, poi copiare il sorgente e `dotnet publish -c Release -o /app/publish`.
  - Usare `mcr.microsoft.com/dotnet/aspnet:10.0` per lo step finale (`AS final`).
  - Configurare l'utente non-root (`USER $APP_UID` o `USER app`).
  - Esporre la porta applicativa predefinita per .NET 8+ in container: `8080`.
- **Implementazione Data Protection Esternalizzata**: In `backend/FilmAPI/Program.cs`, modificare il setup dei servizi `AddDataProtection()`. Configurare ASP.NET Core affinché scriva le chiavi del key ring su un percorso prelevato dall'ambiente (es. `Environment.GetEnvironmentVariable("DP_KEYS_PATH")`). Se il valore non è nullo, usare `PersistKeysToFileSystem(new DirectoryInfo(dpKeysPath))`. Questo è il passo critico che permetterà in fase 6/7 l'aggancio all'Azure File Share.
- **Aggiunta Healthcheck**: Se `FilmAPI` non espone un endpoint di healthcheck, aggiungere `builder.Services.AddHealthChecks()` e mappare un endpoint (es. `/api/health`). 

### Criteri di accettazione
- Il comando `docker build -f backend/FilmAPI/Dockerfile .` genera un'immagine snella senza errori.
- Il container generato espone un probe healthcheck `/api/health` che risponde `200 OK` quando il db e le dipendenze essenziali sono raggiungibili.
- Il container esegue col processo come utente limitato `app`.

---

## FASE 2 - Containerizzazione `FilmApiSeeder` (Inizializzazione Dati)

### Scopo
Convertire l'applicativo di Seeding, attualmente console, in un container che può girare come un Job o un init-container per effettuare: migrazioni database di Entity Framework, setup admin, caricamento bulk dei dati.

### Attività Dettagliate
- **Creazione Dockerfile Seeder**: Creare `backend/scripts/FilmApiSeeder/Dockerfile` multistage, in modo identico a quello della `FilmAPI`. Essendo un container job, lo step di entrypoint sarà l'esecuzione della dll (`dotnet FilmApiSeeder.dll`).
- **Resilienza al boot del DB**: Nel codice di `FilmApiSeeder/Program.cs`, implementare un "wait-for-it". Poiché il docker-compose avvierà DB e Seeder quasi in parallelo, il seeder dovrà provare la connessione al database con un ciclo di retry (es. Polly o semplice try/catch con `Thread.Sleep`) per massimo N tentativi prima di crashare.
- **Automazione Migrazioni**: Il `FilmApiSeeder` dovrà includere il codice per chiamare `db.Database.MigrateAsync()` prima di effettuare qualsiasi logica di seeding. In questo modo le tabelle vengono create all'istante all'avvio.

### Criteri di accettazione
- `docker build -f backend/scripts/FilmApiSeeder/Dockerfile .` termina con successo.
- Eseguendo il container del seeder a fronte di un MariaDB appena avviato (tramite CLI), esso attende che il server MariaDB sia accessibile, applica lo schema EF, riempie il DB e si spegne terminando il processo con Exit Code `0`.

---

## FASE 3 - Containerizzazione `CineBase.Web` (Frontend)

### Scopo
Realizzare il container di front-end che necessita non solo di compilazione C# ma anche di build Node.js (per CSS/Tailwind/JS assets).

### Attività Dettagliate
- **Creazione Dockerfile WebApp**: Creare `frontend/CineBase.Web/Dockerfile` multistage, tenendo conto delle doppie dipendenze.
  - **Stage Node**: Usare un'immagine `node` o installare Node all'interno dell'immagine `mcr.microsoft.com/dotnet/sdk:10.0`. Eseguire `npm ci` o `npm install` e poi `npm run build:assets` per generare minified styles e compilare Tailwind.
  - **Stage .NET Build**: Effettuare `dotnet publish`.
  - **Stage Final**: Usare `aspnet:10.0` (utente non-root `app`), copiare l'output della build (che ora conterrà i file JS/CSS processati nello stadio precedente presenti nella `wwwroot`).
- **Data Protection WebApp**: Allo stesso modo della Fase 1, aggiungere l'esternalizzazione della Data Protection tramite directory definita da environment per i cookie di autenticazione o token Antiforgery di CineBase.Web.
- **Inject dinamico dell'API**: Assicurarsi che le UI Web, quando il container è deployato, ricevano istruzioni su quale sia la base-URL delle API (se questa avviene dal browser del client, serve iniettare l'env var nell'output HTML; se avviene server-side via BFF/Proxy interno, basta leggere `appsettings`).

### Criteri di accettazione
- L'immagine Docker compila con successo in meno di 3-4 minuti e ingloba gli asset statici moderni.
- Visitando il container `CineBase.Web` su port `8080` (eseguito localmente con un port forward `8080:8080`), vengono serviti i file stilizzati senza errori 404 su bundle o css.

---

## FASE 4 - Orchestrazione locale: `docker-compose.yml`

### Scopo
Creare il file definitivo che integra le fasi precedenti per un developer environment completo e automatizzato.

### Attività Dettagliate
- **Creazione Root `docker-compose.yml`**:
  - Definire il servizio `mariadb` partendo dall'immagine ufficiale (`mariadb:11.4`). Configurare le variabili da `.env` (`MARIADB_ROOT_PASSWORD`, `MARIADB_DATABASE`, `MARIADB_USER`, `MARIADB_PASSWORD`). Mappare volume locale nominato (`mariadb_data`). Inserire healthcheck nativo (es. comando bash `mysqladmin ping -h localhost`).
  - Definire il servizio `film-api` montando i file `.env`. Impostare `depends_on: mariadb: condition: service_healthy`. Mappare la connection string verso il nome hostname interno `mariadb:3306`.
  - Definire il servizio `seeder` con immagine builtita e `depends_on: mariadb: condition: service_healthy` (oppure dipendente anche da `film-api`). Utilizzare un docker profile (es. `profiles: ["init"]`) per impedire il riavvio o tenerlo normale ma non-restartable. Inserire chiavi di configurazione, credenziali Admin.
  - Definire il servizio `webapp` (frontend), `depends_on: film-api: condition: service_started`. Iniettare via ENV la configurazione di API connection string (es. interna). 
- **Verifica e test del flusso locale**:
  - Pulire tutti i container esistenti ed eseguire il bootstrap totale. Assicurarsi che i permessi di scrittura sui volumi interni DataProtection avvengano correttamente (poiché in locale si useranno tmp-dir o volumi docker locali).

### Criteri di accettazione
- `docker-compose -d up --build` avvia la piattaforma senza interazione umana.
- L'app risulta navigabile (`localhost` -> `webapp`), l'amministratore locale configurato nell' `.env` può effettuare il login.
- Il database ha i film popolati dal TMDB import.

---

## FASE 5 - Provisioning Infrastruttura Azure Base (ACR e Storage)

### Scopo
Stabilire le risorse cloud basilari (Registry e Storage) seguendo i pattern della guida ACA EducationalGames fornita. L'AI genererà lo script necessario.

### Attività Dettagliate
- **Creazione Script di Provisioning** (es. Azure CLI in bash/powershell o documentazione operativa strict):
  - Dichiarazione Variabili (Resource Group, Location, ACR Name, Workspace, ACA Environment).
  - Creazione Resource Group e Azure Container Registry (Basic o Standard).
  - Comandi per buildare localmente in tag ACR ed effettuare `az acr login` e `docker push` delle immagini di Fase 1,2,3 sull'ACR.
  - Creazione `Log Analytics Workspace` ed estrazione dei Client ID/Keys.
  - Creazione `Azure Container Apps Environment` utilizzando il workspace di log.
  - Creazione `Storage Account` e all'interno due `File Share` in SMB:
    - Share 1: `mariadb-data-share`.
    - Share 2: `dp-keys-share`.

### Criteri di accettazione
- Generazione dello script eseguibile che porta un tenant Azure pulito ad avere l'ambiente pronto.
- Esecuzione dello script confermata e check sulle immagini caricate con successo nel private ACR.

---

## FASE 6 - Deployment Dati: MariaDB in ACA e Share Keys

### Scopo
Allocare il database in container su Azure con garanzia di persistenza nel file share SMB per resistere a riavvi.

### Attività Dettagliate
- **Configurazione Link Volume Storage ACA**: Nello script/operatività, associare il File Share `mariadb-data-share` all'ambiente Container Apps (link a livello environment). Stessa cosa per il `dp-keys-share`.
- **Deploy MariaDB Container App**:
  - Specificare il montaggio volume `mariadb-data-share` alla directory container `/var/lib/mysql`.
  - Iniettare i secret (Password Root, Password Utente) dalla funzionalità `az containerapp secret set`.
  - Configurare CPU/RAM adeguate al DB.
  - Impostare Ingress su `Internal`, porta `3306`, target port `3306`. (Permetterà al backend di dialogare via FQDN interno dell'environment).
- **Restart Test**: Riavviare volontariamente l'app MariaDB via CLI e convalidare nei log o tramite seeder successivo che i dati permangono.

### Criteri di accettazione
- App MariaDB deployata correttamente in ACA in stato "Running".
- Il database MariaDB è accessibile internamente nel mesh network di ACA.

---

## FASE 7 - Deployment Applicativo: Backend API e Seeder Job su ACA

### Scopo
Deployare la logica applicativa principale. L'API esposta verso internet, il seeder gestito come un Job una tantum.

### Attività Dettagliate
- **Creazione Container App Job per il Seeder**:
  - Istanziare un `Container Apps Job` (anzichè Web App) tramite l'immagine pushata in ACR di `FilmApiSeeder`.
  - Iniettare Secret `ConnectionStrings__DefaultConnection` mappato al DNS interno del MariaDB (`server=mariadb-app.internal.nice...`).
  - Iniettare l'accesso ai volumi File Share se necessita di scrivere log, altrimenti solo credenziali (TMDB API, Admin User).
  - Eseguire il Job `az containerapp job execution start` e validarne il Log per constatare che il DB sia stato popolato con successo in Cloud.
- **Creazione Container App per FilmAPI (Backend)**:
  - Deploy dell'immagine `FilmAPI`.
  - Ingress: Se il frontend è in architettura `direct-backend`, configurare l'ingress su `External` (accessibile dal web), se è proxy server-side configurare `Internal`. Per CineBase il fallback target è `External` esposto in HTTPS.
  - Configurazione Variabili: Segreti mappati, Connection String al DB locale in ACA.
  - Montaggio Volume `dp-keys-share` sul path specificato dalla ENV Var aggiunta in Fase 1 per la Data Protection.

### Criteri di accettazione
- L'esecuzione del Job Seeder risulta in stato Succeeded sui monitor Azure.
- Il backend `FilmAPI` risponde ad API requests da Postman e dal web senza errori DB.

---

## FASE 8 - Deployment Frontend WebApp su ACA

### Scopo
Esporre il portale web ASP.NET al traffico utente reale, connesso dinamicamente al backend cloud.

### Attività Dettagliate
- **Creazione Container App Frontend**:
  - Deploy di `CineBase.Web` da ACR.
  - Ingress: `External` (Porta visibile web), permettendo traffico public.
  - Configurazione Variables: Impostare `ApiBaseUrl` con la FQDN pubblica esposta in Fase 7 dal servizio API.
  - Montaggio Volume `dp-keys-share` sullo stesso percorso designato. (Questo permetterà che i cookie emessi siano decriptabili se vi è scalabilità o comunicazioni tra app se necessario - anche se in questo caso sono disaccoppiati, la coerenza è buona practice).

### Criteri di accettazione
- Visitando il dominio autogenerato da Azure (`https://webapp-frontend.xxxxxx.region.azurecontainerapps.io`) l'app Web CineBase appare.
- I flussi di chiamata API dal browser o da server non generano CORS Errors (grazie al check pre-inserito).

---

## FASE 9 - Refinements: SSL, CORS, OAuth, Mail in Cloud

### Scopo
Allineare l'applicazione cloud al set completo di feature, chiudendo il loop su autorizzazioni esterne e delivery di email in scenari reali.

### Attività Dettagliate
- **Configurazione CORS (FilmAPI)**: Assicurarsi che le env variables di produzione della `FilmAPI` su ACA consentano le chiamate CORS esplicitamente solo verso l'FQDN autogenerato di `CineBase.Web` in ACA o l'eventuale Custom Domain, evitando accessi da altre origin.
- **Custom Domain Binding (Opzionale)**: Se disponibile dominio acquistato/fornito, mappare su `CineBase.Web` e `FilmAPI` tramite managed certificates di Azure Container Apps.
- **Provider Esterni (OAuth Google/Entra ID)**:
  - Aggiornare le console sviluppatori Google e Azure Entra ID inserendo la nuova Return URL pubblica dell'ambiente (es. `https://<nome-app-aca>/signin-google`).
- **Verifica Email Delivery (SMTP)**:
  - Usare la password d'app (es. Google SMTP) precedentemente settata nei secret di ACA. Testare la registrazione di un utente fittizio sull'istanza ACA pubblica e verificare l'arrivo dell'email reale.

### Criteri di accettazione
- Sicurezza CORS consolidata in ambiente di produzione cloud.
- Autenticazione con Identity Provider esterni funzionante in cloud.
- Trigger di e-mail (come recupero password / conferme / checkout biglietti in caso esistano) effettuato con successo dai container hostati.
