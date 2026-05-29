# Tutorial Dockerfile FilmAPI - FASE 1 passo passo

Data: 2026-05-28
Stato: documento di supporto alla **FASE 1 - Dockerfile FilmAPI**

---

## 1. Scopo

Spiegare in modo operativo e riga per riga il Dockerfile del backend `FilmAPI`, così da chiarire:

- perché la build parte dalla root del repository;
- perché il file è multistage;
- come vengono separati `restore`, `publish` e runtime;
- perché l'immagine finale non contiene SDK, sorgenti o file sensibili;
- come sono stati configurati porta, healthcheck e utente non-root.

---

## 2. File coinvolti

- `backend/FilmAPI/Dockerfile`
- `.dockerignore`
- `backend/FilmAPI/Program.cs`

Il Dockerfile da solo non basta a spiegare tutto: il probe Docker di FASE 1 dipende infatti anche dall'endpoint `GET /api/health/live` aggiunto in `Program.cs`, mentre la pulizia del build context dipende dal root `.dockerignore`.

---

## 3. Dockerfile completo

```dockerfile
# syntax=docker/dockerfile:1

ARG DOTNET_VERSION=10.0
ARG BUILD_CONFIGURATION=Release

FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS restore
WORKDIR /src

COPY ["CineBase.slnx", "./"]
COPY ["backend/FilmAPI/FilmAPI.csproj", "backend/FilmAPI/"]

RUN dotnet restore "backend/FilmAPI/FilmAPI.csproj"

FROM restore AS publish
ARG BUILD_CONFIGURATION=Release

COPY backend/FilmAPI/ backend/FilmAPI/

RUN dotnet publish "backend/FilmAPI/FilmAPI.csproj" \
    -c ${BUILD_CONFIGURATION} \
    -o /app/publish \
    -p:UseAppHost=false \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish ./

RUN mkdir -p /app/wwwroot/media/covers \
    && chown -R ${APP_UID}:${APP_UID} /app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["curl", "--fail", "--silent", "--show-error", "http://127.0.0.1:8080/api/health/live"]

USER ${APP_UID}

ENTRYPOINT ["dotnet", "FilmAPI.dll"]
```

---

## 4. Vista d'insieme

Il file è organizzato in 3 stage logici:

1. `restore`: scarica i pacchetti NuGet necessari al progetto.
2. `publish`: compila e pubblica il backend in una cartella pronta per il runtime.
3. `final`: costruisce l'immagine finale minimale, senza SDK, con solo il runtime ASP.NET.

L'obiettivo è semplice: usare immagini grandi solo dove servono per costruire, e un'immagine piccola e pulita per eseguire l'app.

---

## 5. Spiegazione passo passo

### 5.1 Intestazione Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
```

Questa riga dice a Docker quale sintassi usare.

- rende esplicito che il file usa la sintassi moderna di Dockerfile;
- aiuta BuildKit a interpretare correttamente istruzioni e ottimizzazioni.

---

### 5.2 Argomenti globali

```dockerfile
ARG DOTNET_VERSION=10.0
ARG BUILD_CONFIGURATION=Release
```

Questi `ARG` sono parametri di build.

- `DOTNET_VERSION=10.0` centralizza la versione delle immagini .NET usate negli stage `sdk` e `aspnet`.
- `BUILD_CONFIGURATION=Release` evita di hardcodare più volte la configurazione di publish.

Perché usare `ARG` qui?

- perché possiamo cambiare versione o configurazione in un solo punto;
- perché il Dockerfile resta più leggibile;
- perché in futuro si può fare override con `--build-arg` senza riscrivere il file.

---

### 5.3 Stage `restore`

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS restore
WORKDIR /src
```

Qui parte il primo stage.

- usa l'immagine `sdk`, non quella `aspnet`, perché `dotnet restore` richiede il toolchain completo;
- `AS restore` assegna un nome allo stage, così potrà essere riusato dopo;
- `WORKDIR /src` imposta la directory di lavoro interna al container.

---

### 5.4 Copia minima per sfruttare il caching

```dockerfile
COPY ["CineBase.slnx", "./"]
COPY ["backend/FilmAPI/FilmAPI.csproj", "backend/FilmAPI/"]
```

Questo è uno dei punti più importanti del Dockerfile.

Invece di copiare subito tutto il repository, copiamo solo:

- la soluzione `CineBase.slnx`;
- il file progetto `FilmAPI.csproj`.

Perché?

- se cambia solo il codice `.cs`, Docker può riusare il layer del restore già calcolato;
- il restore viene invalidato solo quando cambiano solution o dipendenze del progetto;
- la build diventa molto più veloce durante lo sviluppo.

Questa è la ragione principale per cui il build context parte dalla root repository: il Dockerfile può riferirsi sia alla solution sia al progetto tramite path coerenti.

---

### 5.5 Restore NuGet

```dockerfile
RUN dotnet restore "backend/FilmAPI/FilmAPI.csproj"
```

Qui Docker esegue il restore dei pacchetti NuGet del backend.

Il risultato è un layer cacheabile che verrà riusato finché non cambiano le dipendenze dichiarate.

---

### 5.6 Stage `publish`

```dockerfile
FROM restore AS publish
ARG BUILD_CONFIGURATION=Release
```

Questo stage parte dallo stage `restore` già pronto.

- non ripete il restore;
- eredita i pacchetti già scaricati;
- si limita a copiare il sorgente e pubblicare l'app.

La ridefinizione di `ARG BUILD_CONFIGURATION` è necessaria perché gli `ARG` vanno dichiarati anche nello stage in cui vengono usati.

---

### 5.7 Copia del sorgente backend

```dockerfile
COPY backend/FilmAPI/ backend/FilmAPI/
```

Solo a questo punto viene copiato il codice del backend.

È una scelta intenzionale:

- prima si fissano solution e dipendenze;
- poi si copia il sorgente applicativo;
- così i cambi di codice non invalidano inutilmente il restore.

---

### 5.8 Publish dell'app

```dockerfile
RUN dotnet publish "backend/FilmAPI/FilmAPI.csproj" \
    -c ${BUILD_CONFIGURATION} \
    -o /app/publish \
    -p:UseAppHost=false \
    --no-restore
```

Questa è l'istruzione che produce l'output finale da copiare nel runtime.

Significato dei parametri:

- `-c ${BUILD_CONFIGURATION}`: pubblica in `Release`.
- `-o /app/publish`: mette tutti i file pubblicati in una cartella nota e pulita.
- `-p:UseAppHost=false`: evita di generare un apphost nativo inutile dentro il container.
- `--no-restore`: non ripete il restore perché è già stato fatto nello stage precedente.

Il risultato è una cartella con i file realmente necessari ad avviare `FilmAPI`.

---

### 5.9 Stage runtime finale

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app
```

Qui avviene la separazione netta tra build ed esecuzione.

- l'immagine finale usa `aspnet`, non `sdk`;
- quindi contiene solo il runtime necessario a eseguire l'app;
- niente compilatori, niente restore tools, niente SDK completi.

Questo riduce dimensione dell'immagine e superficie inutile.

---

### 5.10 Porta interna ASP.NET

```dockerfile
ENV ASPNETCORE_URLS=http://+:8080
```

Questa variabile dice a Kestrel di ascoltare su tutte le interfacce del container, porta `8080`.

Perché così?

- dentro Docker non basta ascoltare su `localhost`;
- ascoltare su `http://+:8080` permette al container di ricevere traffico da compose, ACA o mapping porte host;
- `8080` è la porta standard decisa per i container di questa iterazione.

---

### 5.11 Installazione di `curl` per il probe Docker

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

`curl` non serve all'applicazione, ma al `HEALTHCHECK` Docker.

La pulizia finale di `/var/lib/apt/lists/*` evita di lasciare nella image cache di package manager non necessaria.

---

### 5.12 Copia del publish output

```dockerfile
COPY --from=publish /app/publish ./
```

Questa riga prende solo il risultato della publish e lo copia nello stage finale.

È il cuore del multistage:

- tutto quello che apparteneva agli stage di build resta fuori dall'immagine finale;
- entrano solo i file pubblicati;
- il runtime finale resta pulito.

---

### 5.13 Preparazione cartella media e permessi

```dockerfile
RUN mkdir -p /app/wwwroot/media/covers \
    && chown -R ${APP_UID}:${APP_UID} /app
```

Questa riga fa due cose.

1. crea esplicitamente la cartella `wwwroot/media/covers`, che è il punto in cui il backend salva le copertine uploadate;
2. assegna la proprietà dei file all'utente non-root usato in runtime.

`APP_UID` è fornito dall'immagine base ASP.NET e consente di usare un utente applicativo già predisposto senza dover creare manualmente un nuovo utente nel Dockerfile.

---

### 5.14 Documentazione porta container

```dockerfile
EXPOSE 8080
```

`EXPOSE` non pubblica la porta sull'host.

Serve a documentare che il container espone il servizio sulla porta `8080`, cosa utile per:

- lettura del Dockerfile;
- strumenti di orchestrazione;
- ispezione dell'immagine.

---

### 5.15 Healthcheck Docker

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["curl", "--fail", "--silent", "--show-error", "http://127.0.0.1:8080/api/health/live"]
```

Questo dice a Docker come verificare se il processo è vivo.

Significato pratico:

- `--interval=30s`: prova ogni 30 secondi;
- `--timeout=5s`: fallisce il tentativo se non riceve risposta entro 5 secondi;
- `--start-period=20s`: concede tempo iniziale all'app per partire;
- `--retries=3`: dopo 3 fallimenti il container viene marcato unhealthy.

Perché usa `/api/health/live`?

- perché in FASE 1 serviva solo un probe minimale di liveness;
- la readiness legata a DB, migrazioni e bootstrap resta rinviata alla FASE 6.

---

### 5.16 Utente non-root

```dockerfile
USER ${APP_UID}
```

Da questo punto in poi il processo non gira più come `root`.

È una best practice importante perché:

- riduce i privilegi del processo;
- evita di far girare l'app con permessi eccessivi;
- si allinea meglio ai target runtime come Docker Compose e Azure Container Apps.

---

### 5.17 Entrypoint finale

```dockerfile
ENTRYPOINT ["dotnet", "FilmAPI.dll"]
```

Questa è l'istruzione con cui il container parte davvero.

Quando il container viene eseguito, Docker lancia:

```bash
dotnet FilmAPI.dll
```

Quindi l'applicazione backend parte dal publish output già copiato in `/app`.

---

## 6. Perché l'ordine delle istruzioni è importante

L'ordine scelto non è casuale.

1. prima si copiano solution e `.csproj`;
2. poi si fa `dotnet restore`;
3. solo dopo si copia il sorgente completo;
4. infine si esegue `dotnet publish`.

Questo approccio massimizza il caching Docker. Se modifichiamo un file `.cs`, il restore non viene rifatto inutilmente.

---

## 7. Cosa entra e cosa non entra nell'immagine finale

Entra nell'immagine finale:

- il publish output di `FilmAPI`;
- il runtime ASP.NET;
- `wwwroot`, inclusa la cartella `wwwroot/media/covers`;
- `curl` per il probe Docker.

Non entra nell'immagine finale:

- l'SDK .NET;
- il sorgente C# del progetto;
- `.git`;
- file `.env`;
- `node_modules`;
- cartelle `bin` e `obj` del workspace;
- documentazione e test esclusi dal root `.dockerignore`.

Questa pulizia dipende dalla combinazione di:

- root `.dockerignore`;
- multistage build;
- copia nel runtime solo dell'output pubblicato.

---

## 8. Flusso reale del build

Quando eseguiamo:

```bash
docker build -t cinebase-filmapi -f backend/FilmAPI/Dockerfile .
```

succede questo:

1. Docker parte dalla root del repository come build context.
2. Il root `.dockerignore` esclude file inutili o sensibili.
3. Lo stage `restore` scarica i pacchetti NuGet del backend.
4. Lo stage `publish` copia il codice e produce `/app/publish`.
5. Lo stage `final` crea l'immagine minimale di runtime.
6. Il container, una volta avviato, espone `8080` e risponde al probe su `/api/health/live`.

---

## 9. Verifiche eseguite nella FASE 1

- `docker build -t cinebase-filmapi -f backend/FilmAPI/Dockerfile .`
- `docker image inspect cinebase-filmapi`
- `docker run --rm --entrypoint dotnet cinebase-filmapi --list-sdks`
- verifica assenza nell'immagine finale di `.env`, `.git`, `node_modules`, `bin`, `obj`
- verifica presenza di `wwwroot/media/covers`

Risultato atteso e ottenuto nella fase:

- build riuscita;
- runtime su `8080`;
- utente non-root (`User 1654`);
- SDK assente nell'immagine finale;
- probe Docker funzionante.

---

## 10. Limiti residui della FASE 1

Questo Dockerfile chiude il packaging del backend, non ancora il bootstrap completo container-aware.

Restano infatti aperti fino alla FASE 6:

- `MigrateAsync()` automatico all'avvio;
- readiness vera legata al DB;
- retry di startup verso MariaDB;
- bootstrap `migrate -> seed -> ready`.

Quindi la FASE 1 rende l'immagine corretta e pulita, ma non risolve ancora tutta la logica di avvio applicativo.

---

## 11. Comandi utili

Build:

```bash
docker build -t cinebase-filmapi -f backend/FilmAPI/Dockerfile .
```

Ispezione immagine:

```bash
docker image inspect cinebase-filmapi
```

Verifica assenza SDK:

```bash
docker run --rm --entrypoint dotnet cinebase-filmapi --list-sdks
```

Esecuzione manuale:

```bash
docker run --rm -p 5000:8080 cinebase-filmapi
```

---

## 12. Riferimenti

- `backend/FilmAPI/Dockerfile`
- `.dockerignore`
- `backend/FilmAPI/Program.cs`
- `docs/project/dev_iteration/6/PianoDiLavoro.md`
