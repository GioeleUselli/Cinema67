# FASE 0 - Analisi architetturale e chiusura decisioni

Data: 2026-05-28
Stato: **Completata**

---

## 1. Scopo

Chiudere le decisioni architetturali dell'iterazione 6 usando il codice reale come sorgente di verità, così da evitare che Dockerfile, `docker-compose`, bootstrap locale e deployment ACA vengano costruiti su assunzioni sbagliate.

---

## 2. File analizzati

- `backend/FilmAPI/Program.cs`
- `backend/FilmAPI/Data/DataSeeder.cs`
- `backend/FilmAPI/Services/FrontendEnvironment.cs`
- `backend/FilmAPI/Services/AuthCookieService.cs`
- `backend/FilmAPI/Services/EmailService.cs`
- `backend/FilmAPI/Services/AccountEmailService.cs`
- `backend/FilmAPI/Services/ExternalAuthService.cs`
- `backend/FilmAPI/Services/GoogleExternalAuthProvider.cs`
- `backend/FilmAPI/Services/MicrosoftExternalAuthProvider.cs`
- `backend/FilmAPI/Services/MediaService.cs`
- `backend/FilmAPI/Endpoints/MediaEndpoints.cs`
- `backend/scripts/FilmApiSeeder/Program.cs`
- `backend/scripts/FilmApiSeeder/SeedCatalog.cs`
- `backend/.env.example`
- `frontend/CineBase.Web/Program.cs`
- `frontend/CineBase.Web/wwwroot/js/runtime-config.js`
- `frontend/CineBase.Web/wwwroot/js/api.js`

---

## 3. Fotografia reale del codice

### 3.1 Backend `FilmAPI`

| Tema | Evidenza | Stato reale |
| --- | --- | --- |
| Caricamento env | `backend/FilmAPI/Program.cs:14-29` | Il backend prova alcuni path espliciti, poi cade su `Env.Load()` senza argomento. In container questo mantiene una dipendenza implicita dal filesystem e dalla working directory. |
| Configurazione DB | `backend/FilmAPI/Program.cs:47-60` | `DB_USE_AUTODETECT` vale `true` di default e quindi `ServerVersion.AutoDetect(connectionString)` apre il DB già in fase di startup. |
| Bootstrap DB | `backend/FilmAPI/Program.cs:282-286`, `backend/FilmAPI/Data/DataSeeder.cs:19-27` | All'avvio viene eseguito direttamente `DataSeeder.SeedAsync()`, ma non c'è `Database.MigrateAsync()` prima del seed. Su DB vuoto containerizzato questo è un gap reale. |
| Health checks | assenti in `backend/FilmAPI/Program.cs` | Non esistono endpoint `live` e `ready` utilizzabili da Docker o ACA. |
| CORS e URL frontend | `backend/FilmAPI/Services/FrontendEnvironment.cs:5-49` | Il progetto ha già una separazione corretta tra `FRONTEND_PUBLIC_BASE_URL` e `CORS_ALLOWED_ORIGINS`; questa convenzione va mantenuta. |
| Auth e cookie | `backend/FilmAPI/Services/AuthCookieService.cs:7-43`, `backend/FilmAPI/Endpoints/AuthEndpoints.cs:36-118` | Il modello attuale è già `access token` bearer + refresh token cookie `HttpOnly`, `SameSite=Strict`, `Path=/api/auth`, host-only. Non c'è sessione server-side classica. |
| Data Protection / sessione | ricerca repo su `AddDataProtection`, `AddSession`, `UseSession` | Nessuna evidenza di `Data Protection` condivisa o sessione ASP.NET richiesta dall'architettura attuale. |

### 3.2 Seeder `FilmApiSeeder`

| Tema | Evidenza | Stato reale |
| --- | --- | --- |
| Dipendenza da repository root | `backend/scripts/FilmApiSeeder/Program.cs:36-37`, `924-974` | Il seeder cerca la root Git tramite `CineBase.slnx` e carica `backend/.env`. Da publish output containerizzato questo approccio non è affidabile. |
| Dipendenza da TMDB | `backend/scripts/FilmApiSeeder/Program.cs:39-44` | Senza `TMDB_BEARER_TOKEN` il seed non parte. Oggi non esiste una modalità snapshot o offline. |
| Migrazioni | `backend/scripts/FilmApiSeeder/Program.cs:46-48` | Il seeder applica già `Database.MigrateAsync()`. Questo comportamento va preservato, ma reso env-safe e con retry DB. |
| Configurazione DB | `backend/scripts/FilmApiSeeder/Program.cs:96-108` | Anche qui `DB_USE_AUTODETECT` vale `true` di default, con la stessa dipendenza prematura dal DB. |
| Dati deterministici già presenti | `backend/scripts/FilmApiSeeder/SeedCatalog.cs:18-156` | Cinema, sale, categorie, supplementi e target film sono già nel repository. La parte non deterministica è il fetch dei dettagli TMDB. |

### 3.3 Frontend `CineBase.Web`

| Tema | Evidenza | Stato reale |
| --- | --- | --- |
| Hosting pagine | `frontend/CineBase.Web/Program.cs:61-125` | Il frontend è già un host statico minimale con clean URLs. |
| `runtime-config.js` | `frontend/CineBase.Web/wwwroot/js/runtime-config.js:1-5`, `10-104` | Il file è statico e hardcoded su `http://localhost:5000/api` e `http://localhost:5000/media`. Non è adatto a container e ACA senza mutazioni esterne. |
| Hook già presente per cache | `frontend/CineBase.Web/Program.cs:5-6`, `138-141` | Il path `/js/runtime-config.js` è già trattato come risorsa speciale per il `Cache-Control`, quindi la sostituzione con un endpoint dinamico è naturale. |
| Config applicativa separata | `backend/FilmAPI/Program.cs:263-274`, `frontend/CineBase.Web/wwwroot/js/api.js:562-563` | Stripe publishable key e versioni legali passano già da `/api/config/frontend`. Non serve fonderli subito dentro `runtime-config.js`. |
| Health frontend | assente in `frontend/CineBase.Web/Program.cs` | Non esiste un endpoint leggero tipo `/healthz` per i probe del container. |

### 3.4 Email, OAuth e integrazioni opzionali

| Tema | Evidenza | Stato reale |
| --- | --- | --- |
| Ticket email | `backend/FilmAPI/Services/EmailService.cs:25-31`, `74-77`, `97-103` | Richiede sempre `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`; connette sempre con `SecureSocketOptions.StartTls` e autentica sempre. |
| Email account | `backend/FilmAPI/Services/AccountEmailService.cs:22-27`, `269-272`, `292-298` | Stessa limitazione del servizio ticket: niente supporto nativo a SMTP locale no-auth. |
| Provider esterni visibili | `backend/FilmAPI/Services/ExternalAuthService.cs:40-65`, `451-460` | La lista provider è filtrata solo sul `client_id`. Questo è meglio di niente, ma non equivale ancora a "provider realmente configurati". |
| Exchange provider | `backend/FilmAPI/Services/GoogleExternalAuthProvider.cs:30-35`, `56-58`; `backend/FilmAPI/Services/MicrosoftExternalAuthProvider.cs:28-33`, `55-56` | L'exchange reale richiede sia `client_id` sia `client_secret`. Quindi l'esposizione provider va resa più rigorosa nelle fasi successive. |

### 3.5 Media e persistenza

| Tema | Evidenza | Stato reale |
| --- | --- | --- |
| Upload cover | `backend/FilmAPI/Services/MediaService.cs:54-68` | Le copertine uploadate finiscono in `wwwroot/media/covers` del backend. Questa directory è il target corretto del volume persistente. |
| Servizio media | `backend/FilmAPI/Endpoints/MediaEndpoints.cs:10-41`, `backend/FilmAPI/Program.cs:227` | `POST /media/covers` richiede ruolo backoffice, ma i file statici sotto `wwwroot` vengono serviti da `UseStaticFiles()`. Non serve un media server separato. |
| Default cover | `backend/FilmAPI/Services/FilmService.cs:18`, `backend/FilmAPI/Services/ProgrammazioneService.cs:16`; nessun file sotto `backend/FilmAPI/wwwroot/media/defaults` | Esiste una divergenza secondaria: il backend fallbacka su `/media/defaults/cover-default.jpg`, ma nel backend non esiste oggi quella risorsa. Va riallineata, ma non blocca la chiusura della FASE 0. |

---

## 4. Decisioni architetturali definitive

### 4.1 Bootstrap backend container-aware

1. Il backend in container deve usare una sequenza esplicita: caricamento env best-effort, configurazione DB, retry limitato sulla connessione, `Database.MigrateAsync()`, `DataSeeder.SeedAsync()`, poi readiness.
2. Nei container `DB_USE_AUTODETECT` deve essere `false` di default e `DB_SERVER_VERSION` deve essere esplicito. Il workflow locale `dotnet run` può continuare a usare `AutoDetect` come convenienza fuori dal perimetro container.
3. Il backend deve esporre almeno `GET /api/health/live` e `GET /api/health/ready`.
4. I callback OIDC restano al root path del backend, perché i provider esterni redirectano direttamente lì; non vanno spostati dentro il frontend.

### 4.2 Strategia seed locale

1. La modalità base del compose sarà `SEED_SOURCE_MODE=snapshot`.
2. La modalità `snapshot` deve funzionare senza `TMDB_BEARER_TOKEN` e senza repository root.
3. La modalità `live` resta opzionale per refresh o arricchimento dati quando il token TMDB è disponibile.
4. Il file snapshot da committare deve contenere i metadati film già risolti oggi da TMDB e sufficienti a popolare il catalogo senza chiamate di rete a TMDB.
5. `SeedCatalog.cs` resta la sorgente canonica per cinema, sale, categorie, supplementi e regole di pianificazione; il file snapshot serve solo a rimpiazzare la dipendenza live da TMDB.

### 4.3 Configurazione runtime frontend

1. `frontend/CineBase.Web/Program.cs` deve servire `/js/runtime-config.js` dinamicamente.
2. Le chiavi minime del runtime dinamico sono `apiBaseUrl`, `mediaBaseUrl` e `deploymentMode`.
3. La configurazione applicativa già esposta da `GET /api/config/frontend` resta separata nella 6: non allarghiamo `runtime-config.js` a Stripe e legal config se non c'è un bisogno concreto.
4. Niente shell script di mutazione file all'avvio container: il contratto definitivo è server-generated runtime config.

### 4.4 Email locale e SMTP reale

1. Il compose locale base include `mailpit`.
2. Entrambi i servizi email del backend devono supportare `SMTP_REQUIRE_AUTH=false` e `SMTP_SECURE_SOCKET_OPTIONS=None` nel baseline locale, oltre a auth e socket options configurabili per ambienti reali.
3. Il bootstrap locale zero-config non deve richiedere un account SMTP reale.
4. OAuth Google e Microsoft, Stripe reale e SMTP reale restano integrazioni opzionali da attivare solo via override locale o secret ACA.
5. La lista provider esposta da `/api/auth/external/providers` dovrà riflettere la configurazione completa del provider, non solo la presenza del `client_id`.

### 4.5 Porte, naming e persistenza locale

| Componente | Nome compose | Porta container | Porta host | Decisione |
| --- | --- | --- | --- | --- |
| MariaDB | `mariadb` | `3306` | nessuna | Il DB non viene esposto sull'host nel compose base. |
| Backend | `filmapi` | `8080` | `5000` | Porta pubblica locale dell'API. |
| Frontend | `cinebase-web` | `8080` | `5001` | Porta pubblica locale del sito. |
| Seeder | `seeder` | nessuna | nessuna | Servizio one-shot rilanciabile manualmente. |
| Mailpit SMTP | `mailpit` | `1025` | nessuna | Usato solo internamente dai container. |
| Mailpit UI | `mailpit` | `8025` | `8025` | Interfaccia browser per verifica email. |

Decisioni di persistenza:

- volume Docker `mariadb-data` montato su `/var/lib/mysql`;
- volume Docker `media-uploads` montato su `/app/wwwroot/media/covers` nel backend publishato;
- nessun volume Data Protection nel compose base, perché l'architettura attuale non lo richiede.

### 4.6 Topologia ACA definitiva

| Ruolo | Scelta definitiva |
| --- | --- |
| Database | container app interna `cinebase-mariadb`, singola replica, storage persistente dedicato |
| Backend | container app esterna `cinebase-filmapi`, con mount `media-uploads` |
| Frontend | container app esterna `cinebase-web` |
| Seeder | ACA Job `cinebase-filmapi-seeder`, esecuzione manuale o on-demand |
| Registry | ACR con pull via Managed Identity e ruolo `AcrPull` |
| Logging | Log Analytics e diagnostica ACA |
| Storage | Azure Files almeno per `mariadb-data` e `media-uploads` |

Decisioni di perimetro cloud:

- niente uso primario dell'admin user di ACR;
- niente Data Protection share e niente session affinity, salvo futura evidenza concreta diversa;
- segreti applicativi solo in ACA secrets o equivalenti, mai baked nelle immagini.

### 4.7 Matrice bootstrap approvata

| Scenario | Config minima | Seed | Email | Integrazioni esterne | Esito atteso |
| --- | --- | --- | --- | --- | --- |
| Locale zero-config | sola `.env.docker.example` | `snapshot` | `mailpit` | OAuth, Stripe e TMDB assenti | App avviabile e usabile dopo `docker compose up -d --build` |
| Locale con override | `.env.docker.example` + `.env.docker` | `snapshot` o `live` | `mailpit` o SMTP reale | opzionali | Verifica manuale di integrazioni reali senza cambiare il compose base |
| ACA / cloud | manifest + secret ACA | `snapshot` o `live` via job | SMTP reale | OAuth e Stripe reali | Ambiente cloud completo e versionato |

---

## 5. Punti esplicitamente fuori perimetro della 6 base

- Nessun prerequisito di MariaDB installato sulla macchina host.
- Nessun obbligo di credenziali Google, Microsoft, Stripe o SMTP reale per il bootstrap locale base.
- Nessuna reintroduzione di sessione server-side o sticky session come scorciatoia.
- Nessuna dipendenza da `backend/.env` o dalla root Git dentro le immagini publishate.

---

## 6. Osservazioni secondarie emerse

- Il fallback backend `/media/defaults/cover-default.jpg` va riallineato a un asset reale o a un fallback coerente col frontend.
- La visibilità dei provider esterni deve essere riallineata al concetto di "configurazione completa", non soltanto alla presenza del `client_id`.
- I test che oggi assumono un `runtime-config.js` statico dovranno essere aggiornati nella FASE 6 insieme al passaggio a runtime config dinamico.

---

## 7. Esito

I criteri di accettazione della FASE 0 risultano chiusi perché:

1. esiste una fotografia aderente al codice reale di backend, seeder, frontend, email, storage e auth;
2. è chiara la differenza tra bootstrap locale zero-config, override locale e deployment cloud con credenziali reali;
3. sono chiuse senza ambiguità le decisioni su `MigrateAsync()`, `DB_USE_AUTODETECT`, seed snapshot e live, `runtime-config.js`, `mailpit`, porte, volumi, naming e topologia ACA;
4. `Data Protection` condivisa e `session affinity` sono esplicitamente escluse dal perimetro della 6, perché il modello auth attuale non ne mostra un bisogno concreto.

---

## 8. Verifiche

- Nessuna build o suite test eseguita: FASE 0 documentale.
- Decisioni prese tramite lettura del codice reale e dei file di configurazione sopra elencati.

---

## 9. Riferimenti

- `docs/project/dev_iteration/6/PianoDiLavoro.md`
- `backend/FilmAPI/Program.cs`
- `backend/FilmAPI/Data/DataSeeder.cs`
- `backend/FilmAPI/Services/FrontendEnvironment.cs`
- `backend/FilmAPI/Services/AuthCookieService.cs`
- `backend/FilmAPI/Services/EmailService.cs`
- `backend/FilmAPI/Services/AccountEmailService.cs`
- `backend/FilmAPI/Services/ExternalAuthService.cs`
- `backend/FilmAPI/Services/GoogleExternalAuthProvider.cs`
- `backend/FilmAPI/Services/MicrosoftExternalAuthProvider.cs`
- `backend/FilmAPI/Services/MediaService.cs`
- `backend/FilmAPI/Endpoints/MediaEndpoints.cs`
- `backend/scripts/FilmApiSeeder/Program.cs`
- `backend/scripts/FilmApiSeeder/SeedCatalog.cs`
- `backend/.env.example`
- `frontend/CineBase.Web/Program.cs`
- `frontend/CineBase.Web/wwwroot/js/runtime-config.js`
- `frontend/CineBase.Web/wwwroot/js/api.js`
