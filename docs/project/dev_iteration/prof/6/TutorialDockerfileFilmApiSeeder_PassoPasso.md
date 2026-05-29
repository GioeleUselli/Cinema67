# Tutorial Dockerfile FilmApiSeeder - FASE 3 passo passo

Data: 2026-05-29
Stato: documento di supporto alla **FASE 3 - Dockerfile FilmApiSeeder**

---

## 1. Scopo

Spiegare in modo operativo e blocco per blocco il Dockerfile del seeder `FilmApiSeeder`, così da chiarire:

- perché il build parte dalla root del repository;
- perché anche il seeder usa una build multistage;
- come vengono separati `restore`, `publish` e runtime finale;
- perché l'immagine finale non contiene SDK ma resta comunque riusabile come container one-shot;
- come il runtime viene predisposto per il bootstrap offline `snapshot` senza dipendere da `backend/.env` o dalla root Git.

---

## 2. File coinvolti

- `backend/scripts/FilmApiSeeder/Dockerfile`
- `backend/scripts/FilmApiSeeder/Program.cs`
- `backend/scripts/FilmApiSeeder/FilmApiSeeder.csproj`
- `backend/scripts/FilmApiSeeder/data/catalog-snapshot.json`
- `.dockerignore`

Questo Dockerfile è strettamente legato anche al codice del seeder, perché nella FASE 3 non ci siamo limitati al packaging: abbiamo reso il seeder eseguibile in modalità `snapshot` oppure `live` con sole env var.

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
COPY ["backend/scripts/FilmApiSeeder/FilmApiSeeder.csproj", "backend/scripts/FilmApiSeeder/"]

RUN dotnet restore "backend/scripts/FilmApiSeeder/FilmApiSeeder.csproj"

FROM restore AS publish
ARG BUILD_CONFIGURATION=Release

COPY backend/FilmAPI/ backend/FilmAPI/
COPY backend/scripts/FilmApiSeeder/ backend/scripts/FilmApiSeeder/

RUN dotnet publish "backend/scripts/FilmApiSeeder/FilmApiSeeder.csproj" \
    -c ${BUILD_CONFIGURATION} \
    -o /app/publish \
    -p:UseAppHost=false \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app

ENV DB_USE_AUTODETECT=false \
    DB_SERVER_VERSION=10.11.0-mariadb \
    SEED_SOURCE_MODE=snapshot \
    SEED_SNAPSHOT_FILE=/app/data/catalog-snapshot.json

COPY --from=publish /app/publish ./

RUN chown -R ${APP_UID}:${APP_UID} /app

USER ${APP_UID}

ENTRYPOINT ["dotnet", "FilmApiSeeder.dll"]
```

---

## 4. Vista d'insieme

Il file è composto da 3 stage logici:

1. `restore`: scarica le dipendenze NuGet del seeder e del progetto `FilmAPI` referenziato.
2. `publish`: pubblica il seeder con tutti i file necessari, incluso il dataset snapshot committato.
3. `final`: crea un'immagine runtime minimale, pensata per essere eseguita come job/container one-shot.

Il punto chiave della FASE 3 è questo: il container deve poter partire anche senza TMDB e senza file `.env` interni, usando lo snapshot offline come default.

---

## 5. Spiegazione passo passo

### 5.1 Intestazione Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
```

Questa riga rende esplicita la sintassi moderna del Dockerfile e abilita il parsing corretto da parte di BuildKit.

---

### 5.2 Argomenti globali

```dockerfile
ARG DOTNET_VERSION=10.0
ARG BUILD_CONFIGURATION=Release
```

Qui centralizziamo due parametri di build:

- `DOTNET_VERSION=10.0` controlla sia l'immagine `sdk` sia quella `aspnet`;
- `BUILD_CONFIGURATION=Release` evita di ripetere hardcode della configurazione di publish.

Il vantaggio è lo stesso degli altri Dockerfile dell'iterazione 6: se in futuro cambia la versione base o la configurazione, il punto di modifica resta uno solo.

---

### 5.3 Stage `restore`

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS restore
WORKDIR /src
```

Questo è il primo stage di build.

- usa l'immagine `sdk`, non `aspnet`, perché `dotnet restore` richiede il toolchain completo;
- `AS restore` assegna un nome allo stage, così possiamo riutilizzarlo dopo;
- `WORKDIR /src` imposta una directory di lavoro coerente con i path della soluzione.

---

### 5.4 Copia minima per sfruttare il caching del restore

```dockerfile
COPY ["CineBase.slnx", "./"]
COPY ["backend/FilmAPI/FilmAPI.csproj", "backend/FilmAPI/"]
COPY ["backend/scripts/FilmApiSeeder/FilmApiSeeder.csproj", "backend/scripts/FilmApiSeeder/"]
```

Questa è una delle parti più importanti del file.

Il seeder non è un progetto isolato: ha una `ProjectReference` verso `backend/FilmAPI/FilmAPI.csproj`.

Quindi per poter fare restore in modo corretto dobbiamo copiare prima:

- la solution `CineBase.slnx`;
- il `.csproj` del backend `FilmAPI`;
- il `.csproj` del seeder.

Perché farlo prima di copiare tutto il codice?

- se cambia solo `Program.cs`, Docker può riusare il layer del restore;
- il restore viene invalidato solo quando cambiano davvero solution o dipendenze;
- la build resta più veloce durante lo sviluppo.

È anche il motivo per cui il build context parte dalla root repository: il Dockerfile deve vedere sia il progetto del seeder sia il progetto backend referenziato.

---

### 5.5 Restore NuGet

```dockerfile
RUN dotnet restore "backend/scripts/FilmApiSeeder/FilmApiSeeder.csproj"
```

Qui Docker scarica le dipendenze necessarie al seeder.

Anche se il comando punta al `.csproj` del seeder, il restore risolve automaticamente anche la reference verso `FilmAPI`.

Il risultato è un layer cacheabile che può essere riusato finché non cambiano i file progetto coinvolti.

---

### 5.6 Stage `publish`

```dockerfile
FROM restore AS publish
ARG BUILD_CONFIGURATION=Release
```

Questo stage parte dal restore già pronto.

- non rifà il restore;
- eredita i pacchetti già scaricati;
- si occupa solo di copiare il sorgente e pubblicare l'applicazione.

La ridefinizione di `BUILD_CONFIGURATION` è necessaria perché gli `ARG` vanno dichiarati nello stage in cui vengono usati.

---

### 5.7 Copia dei sorgenti reali

```dockerfile
COPY backend/FilmAPI/ backend/FilmAPI/
COPY backend/scripts/FilmApiSeeder/ backend/scripts/FilmApiSeeder/
```

Solo a questo punto vengono copiati i file completi dei due progetti coinvolti:

- `backend/FilmAPI/`, perché contiene model, `FilmDbContext`, servizi e tipi referenziati dal seeder;
- `backend/scripts/FilmApiSeeder/`, perché contiene `Program.cs`, README, Dockerfile e soprattutto il dataset `data/catalog-snapshot.json`.

Questo ordine è intenzionale: prima si blocca il layer del restore, poi si copia il codice che cambia più spesso.

---

### 5.8 Publish del seeder

```dockerfile
RUN dotnet publish "backend/scripts/FilmApiSeeder/FilmApiSeeder.csproj" \
    -c ${BUILD_CONFIGURATION} \
    -o /app/publish \
    -p:UseAppHost=false \
    --no-restore
```

Questa istruzione produce l'output finale da mettere nell'immagine runtime.

Significato dei parametri:

- `-c ${BUILD_CONFIGURATION}`: pubblica in `Release`;
- `-o /app/publish`: raccoglie tutti i file pubblicati in una cartella pulita e nota;
- `-p:UseAppHost=false`: evita la generazione di un apphost nativo inutile nel container;
- `--no-restore`: non ripete il restore, perché è già stato fatto nello stage precedente.

Un dettaglio importante della FASE 3 è che `FilmApiSeeder.csproj` è stato aggiornato per copiare anche `data/catalog-snapshot.json` nel publish output. Quindi il Dockerfile non ha bisogno di una `COPY` separata del JSON dal sorgente: il file arriva già dentro `/app/publish`.

---

### 5.9 Stage runtime finale

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app
```

Qui avviene la separazione netta tra build ed esecuzione.

- l'immagine finale usa `aspnet`, non `sdk`;
- quindi non contiene compilatori o tool di build completi;
- contiene solo ciò che serve a eseguire il seeder pubblicato.

Anche se `FilmApiSeeder` è una console app, usare `aspnet` qui è accettabile perché il progetto referenzia `FilmAPI`, che a sua volta dipende dal runtime ASP.NET.

---

### 5.10 Variabili di default del runtime container

```dockerfile
ENV DB_USE_AUTODETECT=false \
    DB_SERVER_VERSION=10.11.0-mariadb \
    SEED_SOURCE_MODE=snapshot \
    SEED_SNAPSHOT_FILE=/app/data/catalog-snapshot.json
```

Questo blocco è il cuore operativo della FASE 3.

Le variabili fanno quattro cose precise:

- `DB_USE_AUTODETECT=false`: evita che il seeder dipenda da `ServerVersion.AutoDetect()` come default nel container;
- `DB_SERVER_VERSION=10.11.0-mariadb`: rende esplicita la versione attesa del server DB nei runtime containerizzati;
- `SEED_SOURCE_MODE=snapshot`: imposta la modalità offline come default, coerente con il requisito `clone-and-run`;
- `SEED_SNAPSHOT_FILE=/app/data/catalog-snapshot.json`: dice al seeder dove cercare il catalogo snapshot dentro l'immagine finale.

In altre parole: il container nasce già predisposto per il bootstrap locale offline, senza richiedere subito `TMDB_BEARER_TOKEN`.

---

### 5.11 Copia del publish output nel runtime

```dockerfile
COPY --from=publish /app/publish ./
```

Questa riga prende il risultato della `dotnet publish` e lo copia nello stage finale.

Dentro questa cartella arrivano:

- `FilmApiSeeder.dll`;
- le DLL dipendenti del seeder e di `FilmAPI`;
- il file `data/catalog-snapshot.json` copiato dal `.csproj`;
- tutti gli altri file necessari all'esecuzione.

Questo è il punto in cui l'immagine finale diventa autonoma rispetto al sorgente del repository.

---

### 5.12 Ownership della cartella runtime

```dockerfile
RUN chown -R ${APP_UID}:${APP_UID} /app
```

Qui l'intera cartella runtime viene assegnata all'utente non-root che eseguirà il processo.

È importante perché:

- evita di girare come `root`;
- mantiene coerenza con gli altri Dockerfile dell'iterazione 6;
- assicura che il processo possa leggere correttamente il publish output e il file snapshot.

---

### 5.13 Esecuzione come utente non-root

```dockerfile
USER ${APP_UID}
```

Da questo punto in poi il processo non gira più come `root`.

Nel runtime finale abbiamo verificato che l'immagine usa `User="1654"`.

Per un container one-shot non è obbligatorio per forza, ma resta una buona pratica coerente con il resto della soluzione.

---

### 5.14 Entry point finale

```dockerfile
ENTRYPOINT ["dotnet", "FilmApiSeeder.dll"]
```

Questa istruzione definisce il comando principale del container.

Quando il container parte, esegue il seeder pubblicato.

Perché `ENTRYPOINT` è utile qui?

- perché il container è pensato come job/one-shot container;
- perché possiamo ancora passare argomenti aggiuntivi al seeder, ad esempio:
  - `--reset-shows --force`
  - `--reset-all --force`
  - `--help`

Esempio:

```bash
docker run --rm cinebase-seeder --reset-shows --force
```

Docker aggiunge gli argomenti dopo `FilmApiSeeder.dll`, quindi il container resta riusabile senza dover cambiare il Dockerfile.

---

## 6. Perché questo Dockerfile è corretto per la FASE 3

Questo Dockerfile chiude i requisiti reali della fase perché:

- builda dalla root repository, quindi supporta correttamente la `ProjectReference` verso `FilmAPI`;
- produce un'immagine finale senza SDK;
- include il dataset snapshot nel runtime pubblicato;
- imposta come default il seed offline `snapshot`, coerente con il bootstrap `clone-and-run`;
- lascia il container compatibile anche con la modalità `live` tramite override env (`SEED_SOURCE_MODE=live` + `TMDB_BEARER_TOKEN`).

In più, la verifica reale ha confermato che:

- lo snapshot è presente in `/app/data/catalog-snapshot.json`;
- il runtime finale non contiene SDK;
- il seed snapshot parte davvero su MariaDB temporaneo;
- la doppia esecuzione sullo stesso DB resta idempotente.

---

## 7. Cosa non chiude ancora questo Dockerfile

La FASE 3 non chiude ancora tutto il comportamento container-aware del seeder.

Resta esplicitamente fuori perimetro, e rinviato alla FASE 6:

- il retry esplicito di connessione DB;
- l'orchestrazione con dipendenze `healthy/ready` nel futuro `docker-compose.yml`;
- il riallineamento finale con il bootstrap completo dell'intera applicazione containerizzata.

Quindi il Dockerfile della FASE 3 chiude il packaging corretto e il bootstrap snapshot/live del seeder, ma non ancora tutta la resilienza di startup prevista per gli scenari compose/ACA.

---

## 8. Comandi utili di verifica

Build immagine:

```bash
docker build -t cinebase-seeder -f backend/scripts/FilmApiSeeder/Dockerfile .
```

Ispezione immagine:

```bash
docker image inspect cinebase-seeder
```

Help del seeder nel container:

```bash
docker run --rm cinebase-seeder --help
```

Verifica assenza SDK nel runtime:

```bash
docker run --rm --entrypoint dotnet cinebase-seeder --list-sdks
```

Verifica presenza snapshot nell'immagine:

```bash
docker run --rm --entrypoint sh cinebase-seeder -lc "test -f /app/data/catalog-snapshot.json && ls -1 /app/data"
```

Esecuzione snapshot offline:

```bash
docker run --rm \
  -e DB_HOST=mariadb \
  -e DB_PORT=3306 \
  -e DB_NAME=film-api-db \
  -e DB_USER=cinebase \
  -e DB_PASSWORD=cinebase \
  cinebase-seeder
```

Esecuzione live TMDB:

```bash
docker run --rm \
  -e SEED_SOURCE_MODE=live \
  -e TMDB_BEARER_TOKEN=<token> \
  -e DB_HOST=mariadb \
  -e DB_PORT=3306 \
  -e DB_NAME=film-api-db \
  -e DB_USER=cinebase \
  -e DB_PASSWORD=cinebase \
  cinebase-seeder
```

---

## 9. Conclusione

Il Dockerfile del seeder è il punto di raccordo tra due obiettivi diversi:

- avere un container leggero e pulito come tutti gli altri componenti;
- avere un bootstrap locale realmente offline e riproducibile.

Per questo la parte più importante non è solo il multistage in sé, ma l'accoppiata:

- publish che include il dataset snapshot;
- runtime che parte di default in `SEED_SOURCE_MODE=snapshot`.

È questa scelta che rende il container del seeder davvero utile nella futura FASE 4 con `docker compose`, invece di essere solo un packaging formale del comando console.
