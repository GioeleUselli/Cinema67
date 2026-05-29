# Tutorial Dockerfile CineBase.Web - FASE 2 passo passo

Data: 2026-05-28
Stato: documento di supporto alla **FASE 2 - Dockerfile CineBase.Web**

---

## 1. Scopo

Spiegare in modo operativo e blocco per blocco il Dockerfile del frontend `CineBase.Web`, così da chiarire:

- come vengono costruiti gli asset npm e Tailwind dentro Docker;
- perché il frontend usa 4 stage logici invece di uno solo;
- come vengono separati build asset, restore .NET, publish e runtime;
- perché l'immagine finale non contiene SDK, `node_modules` o file di build inutili;
- come sono configurati porta, healthcheck e utente non-root.

---

## 2. File coinvolti

- `frontend/CineBase.Web/Dockerfile`
- `frontend/CineBase.Web/package.json`
- `frontend/CineBase.Web/copy-static-assets.mjs`
- `frontend/CineBase.Web/tailwind.config.cjs`
- `frontend/CineBase.Web/Program.cs`
- `.dockerignore`

Questo Dockerfile non si limita a pubblicare un progetto ASP.NET: prima costruisce anche gli asset frontend che finiscono in `wwwroot`.

---

## 3. Dockerfile completo

```dockerfile
# syntax=docker/dockerfile:1

ARG DOTNET_VERSION=10.0
ARG NODE_VERSION=20
ARG BUILD_CONFIGURATION=Release

FROM node:${NODE_VERSION}-bookworm-slim AS assets
WORKDIR /src/frontend/CineBase.Web

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY ["frontend/CineBase.Web/package.json", "frontend/CineBase.Web/package-lock.json", "./"]

RUN npm ci

COPY ["frontend/CineBase.Web/tailwind.config.cjs", "frontend/CineBase.Web/tailwind.input.css", "frontend/CineBase.Web/copy-static-assets.mjs", "./"]
COPY ["frontend/CineBase.Web/wwwroot/", "./wwwroot/"]

RUN npm run build:assets

FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS restore
WORKDIR /src

COPY ["CineBase.slnx", "./"]
COPY ["frontend/CineBase.Web/CineBase.Web.csproj", "frontend/CineBase.Web/"]

RUN dotnet restore "frontend/CineBase.Web/CineBase.Web.csproj"

FROM restore AS publish
ARG BUILD_CONFIGURATION=Release

COPY frontend/CineBase.Web/ frontend/CineBase.Web/
COPY --from=assets /src/frontend/CineBase.Web/wwwroot/css/tailwind.css frontend/CineBase.Web/wwwroot/css/tailwind.css
COPY --from=assets /src/frontend/CineBase.Web/wwwroot/vendor frontend/CineBase.Web/wwwroot/vendor

RUN dotnet publish "frontend/CineBase.Web/CineBase.Web.csproj" \
    -c ${BUILD_CONFIGURATION} \
    -o /app/publish \
    -p:UseAppHost=false \
    --no-restore

RUN rm -f /app/publish/package.json \
    /app/publish/package-lock.json \
    /app/publish/copy-static-assets.mjs \
    /app/publish/tailwind.config.cjs \
    /app/publish/tailwind.input.css

FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish ./

RUN chown -R ${APP_UID}:${APP_UID} /app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["curl", "--fail", "--silent", "--show-error", "http://127.0.0.1:8080/"]

USER ${APP_UID}

ENTRYPOINT ["dotnet", "CineBase.Web.dll"]
```

---

## 4. Vista d'insieme

Il file è composto da 4 stage logici:

1. `assets`: installa dipendenze npm e genera CSS/vendor dentro `wwwroot`.
2. `restore`: scarica i pacchetti NuGet del progetto ASP.NET.
3. `publish`: pubblica il frontend ASP.NET, includendo gli asset generati nello stage `assets`.
4. `final`: crea l'immagine runtime finale, senza Node, senza SDK e senza file di build inutili.

Il punto chiave della FASE 2 è questo: l'immagine finale non deve dipendere dagli asset già presenti sulla macchina host.

---

## 5. Spiegazione passo passo

### 5.1 Intestazione e argomenti globali

```dockerfile
# syntax=docker/dockerfile:1

ARG DOTNET_VERSION=10.0
ARG NODE_VERSION=20
ARG BUILD_CONFIGURATION=Release
```

Qui vengono centralizzate le versioni dei runtime usati dalla build.

- `DOTNET_VERSION=10.0` controlla immagini `sdk` e `aspnet`.
- `NODE_VERSION=20` controlla l'immagine Node usata per gli asset.
- `BUILD_CONFIGURATION=Release` definisce la configurazione di publish.

---

### 5.2 Stage `assets`

```dockerfile
FROM node:${NODE_VERSION}-bookworm-slim AS assets
WORKDIR /src/frontend/CineBase.Web
```

Il primo stage usa Node perché il frontend ha un passaggio reale di build asset.

- Tailwind deve generare `wwwroot/css/tailwind.css`;
- lo script `copy-static-assets.mjs` deve copiare font e vendor self-hosted in `wwwroot/vendor`.

`bookworm-slim` è una base Debian snella, sufficiente per `npm ci` e build asset.

---

### 5.3 Evitare download inutili di Playwright

```dockerfile
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

Nel `package.json` del frontend è presente `playwright` tra le devDependency, ma per costruire gli asset Docker non servono i browser di test.

Questa variabile evita che `npm ci` tenti di scaricarli durante la build immagine.

Il vantaggio è concreto:

- build più veloce;
- meno traffico di rete;
- immagine di build più leggera.

---

### 5.4 Copia dei manifest npm

```dockerfile
COPY ["frontend/CineBase.Web/package.json", "frontend/CineBase.Web/package-lock.json", "./"]
```

Come nel Dockerfile backend, qui si copia prima il minimo indispensabile per il caching.

Per `npm ci` servono i manifest:

- `package.json`
- `package-lock.json`

Se cambia solo un file HTML o JS del sito, il layer `npm ci` può restare in cache.

---

### 5.5 Installazione dipendenze frontend

```dockerfile
RUN npm ci
```

`npm ci` è preferito a `npm install` in build riproducibili perché:

- usa esattamente il lockfile;
- fallisce se lockfile e manifest divergono;
- è più adatto a pipeline e immagini Docker.

---

### 5.6 Copia degli input necessari alla build asset

```dockerfile
COPY ["frontend/CineBase.Web/tailwind.config.cjs", "frontend/CineBase.Web/tailwind.input.css", "frontend/CineBase.Web/copy-static-assets.mjs", "./"]
COPY ["frontend/CineBase.Web/wwwroot/", "./wwwroot/"]
```

Qui entrano nel container tutti i file che servono per generare gli asset finali.

- `tailwind.config.cjs`: definisce come Tailwind deve analizzare il progetto;
- `tailwind.input.css`: sorgente Tailwind da compilare;
- `copy-static-assets.mjs`: copia Inter, Font Awesome e Chart.js in `wwwroot/vendor`;
- `wwwroot/`: contiene HTML, JS, CSS base e struttura su cui Tailwind calcola le classi usate.

---

### 5.7 Generazione degli asset

```dockerfile
RUN npm run build:assets
```

Questo script lancia due passaggi:

1. `npm run build:vendor`
2. `npm run build:css`

In pratica produce:

- `wwwroot/css/tailwind.css`
- `wwwroot/vendor/inter/*`
- `wwwroot/vendor/fontawesome/*`
- `wwwroot/vendor/chartjs/*`

Così l'immagine finale non dipende da asset generati in precedenza sulla macchina locale.

---

### 5.8 Stage `restore` .NET

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS restore
WORKDIR /src

COPY ["CineBase.slnx", "./"]
COPY ["frontend/CineBase.Web/CineBase.Web.csproj", "frontend/CineBase.Web/"]

RUN dotnet restore "frontend/CineBase.Web/CineBase.Web.csproj"
```

Questo stage fa il restore NuGet del frontend ASP.NET.

La logica è identica al backend:

- si usa `sdk` perché il restore richiede il toolchain .NET;
- si copia prima solution e `.csproj`;
- si massimizza il caching del restore.

---

### 5.9 Stage `publish`

```dockerfile
FROM restore AS publish
ARG BUILD_CONFIGURATION=Release
```

Lo stage `publish` eredita il restore già pronto e si concentra solo sulla pubblicazione dell'app.

---

### 5.10 Copia del progetto frontend

```dockerfile
COPY frontend/CineBase.Web/ frontend/CineBase.Web/
```

Qui viene copiato il progetto ASP.NET completo.

Questo include anche la `wwwroot` originaria del repository, ma subito dopo il Dockerfile sovrascrive i file generati che devono arrivare dallo stage `assets`.

---

### 5.11 Iniezione degli asset generati nello stage `assets`

```dockerfile
COPY --from=assets /src/frontend/CineBase.Web/wwwroot/css/tailwind.css frontend/CineBase.Web/wwwroot/css/tailwind.css
COPY --from=assets /src/frontend/CineBase.Web/wwwroot/vendor frontend/CineBase.Web/wwwroot/vendor
```

Queste due righe sono il ponte tra il mondo Node e il mondo ASP.NET.

In pratica dicono:

- usa il `tailwind.css` appena costruito nello stage `assets`;
- usa la cartella `vendor` appena generata nello stage `assets`;
- metti questi asset nel progetto .NET prima della publish finale.

Così `dotnet publish` include davvero gli asset corretti costruiti dentro Docker.

---

### 5.12 Publish del frontend ASP.NET

```dockerfile
RUN dotnet publish "frontend/CineBase.Web/CineBase.Web.csproj" \
    -c ${BUILD_CONFIGURATION} \
    -o /app/publish \
    -p:UseAppHost=false \
    --no-restore
```

Il significato è lo stesso del backend:

- publish in `Release`;
- output in `/app/publish`;
- niente apphost nativo inutile;
- niente restore ripetuto.

Il risultato è una cartella già pronta da copiare nel runtime finale.

---

### 5.13 Pulizia del publish output

```dockerfile
RUN rm -f /app/publish/package.json \
    /app/publish/package-lock.json \
    /app/publish/copy-static-assets.mjs \
    /app/publish/tailwind.config.cjs \
    /app/publish/tailwind.input.css
```

Questo blocco non è strettamente necessario per far partire l'app, ma è importante per mantenere il runtime pulito.

Questi file servono solo nella build:

- manifest npm;
- script di copia asset;
- configurazione Tailwind;
- input Tailwind.

Nel container finale non servono più, quindi vengono rimossi prima del copy nello stage `final`.

---

### 5.14 Stage runtime finale

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app
```

Come nel backend, lo stage finale usa l'immagine `aspnet` e non l'immagine `sdk`.

Questo significa:

- niente compilatori;
- niente Node;
- niente `node_modules`;
- solo il runtime necessario ad avviare `CineBase.Web`.

---

### 5.15 Configurazione porta interna

```dockerfile
ENV ASPNETCORE_URLS=http://+:8080
```

Il frontend containerizzato deve ascoltare su tutte le interfacce interne del container alla porta `8080`.

È la stessa convenzione usata per il backend, così compose e ACA possono orchestrare i servizi in modo coerente.

---

### 5.16 Installazione `curl` per il healthcheck

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

Qui `curl` serve soltanto al `HEALTHCHECK` Docker.

Il frontend non ha ancora un endpoint `/healthz`, quindi in FASE 2 il probe usa temporaneamente `/`.

---

### 5.17 Copia del publish output nello stage finale

```dockerfile
COPY --from=publish /app/publish ./
```

Anche qui la regola è: nello stage finale entra solo l'output pubblicato.

Questo tiene fuori:

- Node;
- `node_modules`;
- SDK .NET;
- sorgenti non necessari.

---

### 5.18 Permessi per utente non-root

```dockerfile
RUN chown -R ${APP_UID}:${APP_UID} /app
```

Prima di cambiare utente, i file sotto `/app` vengono assegnati all'utente applicativo della base image.

Così il processo può leggere correttamente il proprio contenuto senza girare come `root`.

---

### 5.19 Documentazione della porta

```dockerfile
EXPOSE 8080
```

Questa riga documenta che il container frontend espone `8080`.

Non pubblica la porta sull'host, ma la rende esplicita per ispezione e orchestrazione.

---

### 5.20 Healthcheck HTTP del frontend

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["curl", "--fail", "--silent", "--show-error", "http://127.0.0.1:8080/"]
```

Questo probe verifica che il frontend risponda almeno sulla home page.

Perché non usa `/healthz`?

- perché in FASE 2 l'endpoint leggero dedicato non esiste ancora;
- la sua introduzione è prevista in FASE 6;
- nel frattempo `/` è sufficiente come smoke probe HTTP di base.

---

### 5.21 Utente non-root

```dockerfile
USER ${APP_UID}
```

Da qui in poi il processo gira con privilegi ridotti.

Anche per il frontend questa è una best practice importante in ambienti containerizzati.

---

### 5.22 Entrypoint finale

```dockerfile
ENTRYPOINT ["dotnet", "CineBase.Web.dll"]
```

Quando il container parte, esegue:

```bash
dotnet CineBase.Web.dll
```

Questo avvia l'host ASP.NET che serve:

- le clean URLs come `/`, `/programmazione`, `/accedi`;
- gli asset statici dentro `wwwroot`;
- gli header di sicurezza già definiti in `Program.cs`.

---

## 6. Perché l'ordine delle istruzioni è importante

L'ordine è pensato per sfruttare il caching sia lato npm sia lato .NET.

Sequenza reale:

1. copia manifest npm;
2. esegui `npm ci`;
3. copia input Tailwind/vendor e `wwwroot`;
4. genera gli asset;
5. copia solution e `.csproj`;
6. esegui `dotnet restore`;
7. copia il progetto completo;
8. sovrascrivi `tailwind.css` e `vendor` con quelli generati nello stage `assets`;
9. esegui `dotnet publish`;
10. pulisci il publish output;
11. copia tutto nel runtime finale minimale.

Questo minimizza rebuild costosi quando cambiano solo codice .NET o solo asset frontend.

---

## 7. Cosa produce lo stage `assets`

Lo stage `assets` è il cuore specifico della FASE 2.

Produce almeno questi file:

- `wwwroot/css/tailwind.css`
- `wwwroot/vendor/inter/inter.css` e font `.woff2`
- `wwwroot/vendor/fontawesome/css/*` e webfonts
- `wwwroot/vendor/chartjs/chart.umd.js`
- `wwwroot/vendor/chartjs/chartjs-plugin-zoom.min.js`
- `wwwroot/vendor/chartjs/hammer.min.js`

Senza questo stage, l'immagine finale dipenderebbe dagli asset già preparati localmente, cosa che la FASE 2 voleva evitare esplicitamente.

---

## 8. Cosa entra e cosa non entra nell'immagine finale

Entra nell'immagine finale:

- l'output pubblicato di `CineBase.Web`;
- gli asset build-time realmente usati dal sito;
- il runtime ASP.NET;
- `curl` per il probe Docker.

Non entra nell'immagine finale:

- Node;
- `node_modules`;
- SDK .NET;
- sorgenti `.cs` e `.csproj`;
- manifest npm e file di configurazione build rimossi dal publish output;
- `.git`, `.env`, `bin`, `obj`, docs e tests esclusi dal root `.dockerignore`.

---

## 9. Flusso reale del build

Quando eseguiamo:

```bash
docker build -t cinebase-web -f frontend/CineBase.Web/Dockerfile .
```

succede questo:

1. Docker parte dalla root repository come build context.
2. Il root `.dockerignore` filtra materiale inutile.
3. Lo stage `assets` installa dipendenze npm e genera CSS/vendor.
4. Lo stage `restore` esegue il restore NuGet.
5. Lo stage `publish` copia il progetto, innesta gli asset generati e pubblica l'app.
6. Il publish output viene ripulito dai file build-time non necessari.
7. Lo stage `final` crea il runtime minimale e non-root.
8. Il container finale serve il frontend sulla porta `8080`.

---

## 10. Verifiche eseguite nella FASE 2

- `docker build -t cinebase-web -f frontend/CineBase.Web/Dockerfile .`
- `docker image inspect cinebase-web`
- `docker run --rm --entrypoint dotnet cinebase-web --list-sdks`
- verifica assenza nell'immagine finale di `node_modules`, `.git`, sorgenti `.cs`, `.csproj`, `package.json`, `package-lock.json`
- smoke runtime con container esposto su `8081`

Gli smoke test eseguiti hanno verificato:

- `GET /` -> `200`
- `GET /programmazione` -> `200`
- `GET /accedi` -> `200`
- `GET /css/tailwind.css` -> `200`
- `GET /vendor/fontawesome/css/all.min.css` -> `200`
- `GET /vendor/inter/inter.css` -> `200`
- `GET /vendor/chartjs/chart.umd.js` -> `200`

È stata anche verificata la presenza dell'header `Content-Security-Policy` sulla home.

---

## 11. Limiti residui della FASE 2

La FASE 2 chiude il packaging del frontend, ma non ancora l'adattamento completo del codice al runtime containerizzato.

Restano infatti aperti fino alla FASE 6:

- `runtime-config.js` ancora statico e hardcoded su `localhost`;
- endpoint `/healthz` dedicato per probe frontend;
- generazione runtime della configurazione via `Program.cs`.

In altre parole: il container frontend parte, serve pagine e asset correttamente, ma non è ancora runtime-config aware nel senso definitivo deciso nella FASE 0.

---

## 12. Comandi utili

Build:

```bash
docker build -t cinebase-web -f frontend/CineBase.Web/Dockerfile .
```

Ispezione immagine:

```bash
docker image inspect cinebase-web
```

Verifica assenza SDK:

```bash
docker run --rm --entrypoint dotnet cinebase-web --list-sdks
```

Esecuzione manuale:

```bash
docker run --rm -p 5001:8080 cinebase-web
```

---

## 13. Riferimenti

- `frontend/CineBase.Web/Dockerfile`
- `frontend/CineBase.Web/package.json`
- `frontend/CineBase.Web/copy-static-assets.mjs`
- `frontend/CineBase.Web/tailwind.config.cjs`
- `frontend/CineBase.Web/Program.cs`
- `.dockerignore`
- `docs/project/dev_iteration/6/PianoDiLavoro.md`
