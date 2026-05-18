# 🎬 CINEMA67 - Film-App: Presentazione Completa del Progetto

**Data**: 16 Maggio 2026  
**Status**: Production-Ready ✅  
**Build**: v5.0 (Iterazione 5)

---

## 📋 Indice

1. [Executive Summary](#executive-summary)
2. [Architettura Tecnica](#architettura-tecnica)
3. [Funzionalità Principali](#funzionalità-principali)
4. [Stack Tecnologico](#stack-tecnologico)
5. [Modello Dati](#modello-dati)
6. [Ruoli Utenti e RBAC](#ruoli-utenti-e-rbac)
7. [Flussi Principali](#flussi-principali)
8. [Installazione e Setup](#installazione-e-setup)
9. [Punti di Forza](#punti-di-forza)
10. [Roadmap e Miglioramenti](#roadmap-e-miglioramenti)

---

## Executive Summary

**Cinema67** è una **piattaforma completa per la gestione di cinema multisala** con ticketing digitale, pagamenti online e amministrazione avanzata.

### Cosa Offre?

✅ **Catalogo Film Dinamico** - Integrato con TMDB, filtri per genere/regista  
✅ **Prenotazione Biglietti** - Selezione posti interattiva, hold con TTL  
✅ **Pagamenti Flessibili** - Stripe Checkout + Credito piattaforma  
✅ **Ticketing Digitale** - PDF con QR code, validazione scanner  
✅ **Multi Cinema** - Gestione completa di cinema con più sale  
✅ **Admin Panel** - 20+ workspace role-based per gestione operativa  
✅ **Autenticazione Moderna** - JWT + OAuth (Google/Microsoft)  
✅ **Sistema Credito** - Ricariche, audit trail completo  

### Numeri Chiave

| Metrica | Valore |
|---------|--------|
| **Entità Modello** | 49 |
| **Endpoint API** | 33+ |
| **Servizi Backend** | 57 |
| **Pagine Frontend** | 56 |
| **Migrazioni DB** | 71 |
| **Test Automatici** | 231 (100% PASS) |
| **Coverage Ruoli** | 6 role distinti |
| **Tabelle Database** | 39 con indici ottimizzati |

---

## Architettura Tecnica

### 1️⃣ Architettura Monorepo

```
film-app-main/
│
├── backend/                    # ASP.NET Core 9 API
│   ├── FilmAPI/               # Progetto API Minimal
│   ├── scripts/
│   │   └── FilmApiSeeder/     # Seeder con TMDB
│   └── .env                   # Config runtime
│
├── frontend/                  # HTML5 + JavaScript Vanilla
│   └── CineBase.Web/          # ASP.NET Core static server
│
├── tests/                     # Suite test (231 test)
│   └── backend/Integration/
│
├── docs/                      # Documentazione estesa
│   ├── PROJECT_OVERVIEW.md   # Questo file
│   ├── FRONTEND_ARCHITECTURE.md
│   ├── TUTORIAL_*.md
│   └── project/
│
└── README.md                  # Credenziali e quick-start
```

### 2️⃣ Separazione Backend/Frontend

#### Backend (ASP.NET Core 9)

- **Pattern**: Minimal API (no MVC controller)
- **Runtime**: .NET 9 Scoped Services
- **Database**: MySQL 8.0+ / MariaDB 10.11+
- **ORM**: Entity Framework Core 9
- **Autenticazione**: JWT + OAuth 2.0 + Device ID Locking
- **Arch Layer**:
  - **Models** (49 entità)
  - **Services** (57 business logic)
  - **Endpoints** (33 route groups)
  - **Middleware** (Auth, CORS, Rate Limit)
  - **Migrations** (71 schema versions)

#### Frontend (HTML5/JavaScript)

- **Stack**: Zero-build (vanilla ES6+)
- **Styling**: Tailwind CSS
- **State**: localStorage + sessionStorage
- **HTTP**: Fetch API centralizzato
- **Rendering**: Template Loader dinamico con cache
- **Pages**: 56 HTML + 26 moduli JavaScript

### 3️⃣ Flusso Comunicazione

```
┌─────────────────────────────────────────────────┐
│         Browser (http://localhost:5001)          │
│  - HTML5 UI rendering                          │
│  - Template Loader + Cache                      │
│  - JWT token management                         │
│  - Device ID persistence                        │
└────────────────┬────────────────────────────────┘
                 │ Fetch API
                 │ (JSON over HTTPS)
                 ▼
┌─────────────────────────────────────────────────┐
│     API Gateway (http://localhost:5000)         │
│  - Minimal API routing                          │
│  - CORS + Rate Limit middleware                 │
│  - JWT validation + Device lock                 │
│  - RBAC authorization policy                    │
└────────────────┬────────────────────────────────┘
                 │ DbContext
                 │ (LINQ queries)
                 ▼
┌─────────────────────────────────────────────────┐
│   MySQL Database (localhost:3306)               │
│  - 39 tabelle con foreign keys                  │
│  - 71 migrazioni applicate                      │
│  - Indici per overlap detection                 │
│  - Constraints per data integrity               │
└─────────────────────────────────────────────────┘
```

---

## Funzionalità Principali

### 🎯 Area Utente Pubblico

#### 1. **Catalogo Film**
- ✅ Visualizzazione film con cover, trama, cast
- ✅ Filtri per genere, regista, anno uscita
- ✅ Ricerca full-text per titolo
- ✅ Integrazione TMDB per metadati
- ✅ Paginazione server-side

```
GET /films                          # Lista film paginata
GET /films/{id}                     # Dettaglio film
GET /films/{id}/scheda              # Scheda con orari show
```

#### 2. **Programmazione Cinema**
- ✅ Visualizza cinema per città/località
- ✅ Programma giornaliero cinema (date rail)
- ✅ Filtri per genere, orario, cinema
- ✅ Geolocalizzazione browser per cinema vicini
- ✅ Salva cinema preferito in profilo

```
GET /my-cinemas                     # Cinema con schedule giornaliero
GET /my-cinemas/{id}/schedule       # Schedule cinema
GET /programmazione/films           # Film pubblici paginati
GET /programmazione/cinemas         # Cinema pubblici
```

#### 3. **Acquisto Biglietti** 🎫

**Step 1: Selezione Posti**
- ✅ Piantina interattiva con layout sala
- ✅ Visualizza posti occupati/liberi/on-hold
- ✅ Seleziona fino a 10 posti
- ✅ Countdown TTL visibile (10 minuti default)
- ✅ Visualizza prezzo total con supplementi

```
GET  /checkout/shows/{id}/seat-map  # Mappa posti
POST /checkout/holds                # Crea hold
POST /checkout/holds/{token}/refresh # Estendi TTL
DELETE /checkout/holds/{token}      # Rilascia hold
```

**Step 2: Metodo Pagamento**
- ✅ Stripe Checkout hosted (sessione)
- ✅ Pagamento con credito piattaforma
- ✅ Pagamento misto (credito + carta)
- ✅ Visualizza saldo credito
- ✅ Ricevuta ordine in tempo reale

```
POST /checkout/orders               # Crea ordine Pending
POST /checkout/orders/{id}/pay      # Finalizza pagamento
POST /checkout/orders/{id}/stripe-checkout-session  # Hosted checkout
```

**Step 3: Conferma e Download**
- ✅ Riepilogo ordine
- ✅ Download PDF multipagina con QR code
- ✅ Email con biglietti allegati
- ✅ Tracking ordine

```
GET /checkout/orders/{id}           # Dettaglio ordine
GET /checkout/orders/{id}/pdf       # Download PDF
```

#### 4. **Autenticazione e Profilo**
- ✅ Registrazione email/password
- ✅ Login locale + OAuth (Google/Microsoft)
- ✅ Visualizza profilo personale
- ✅ Storico ordini acquistati
- ✅ Gestione cinema preferito
- ✅ Saldo credito visibile

```
POST /auth/register                 # Registrazione
POST /auth/login                    # Login email
POST /auth/google-login             # OAuth Google
POST /auth/microsoft-login          # OAuth Microsoft
POST /auth/change-password          # Cambio password
GET  /credito/me                    # Saldo credito
```

#### 5. **Features Aggiuntive Utente**
- ✅ **Membership Card** - Acquista membership con benefici
- ✅ **Gift Card** - Compra/riscatta gift card
- ✅ **Shop Merchandise** - Catalogo merch con spedizione
- ✅ **Party Booking** - Prenotazione feste con catering
- ✅ **Food & Beverage** - Ordina popcorn/bevande
- ✅ **Newsletter** - Iscrizione promozioni
- ✅ **Support** - Ticket supporto con chat

---

### 👨‍💼 Area Admin & PowerUser

#### **Dashboard Admin** 📊
- ✅ Quick stats: Biglietti venduti, revenue, ordini oggi
- ✅ Grafico vendite ultimi 30 giorni
- ✅ Link rapidi a workspace
- ✅ Alert per cinema/show problematici

#### **1. Gestione Catalogo** 📚

**Film Management**
- ✅ CRUD completo film (title, trama, cast, anno)
- ✅ Upload cover image con validazione
- ✅ Link automatico TMDB
- ✅ Bulk import da TMDB seeder
- ✅ Ricerca e filtri avanzati

```
POST   /films                       # Crea film
PUT    /films/{id}                  # Modifica film
DELETE /films/{id}                  # Elimina film
GET    /films/{id}                  # Dettaglio film
```

**Categoria Management**
- ✅ CRUD categorie (generi)
- ✅ Assegna film a categorie (M2M)
- ✅ Visualizza film per categoria
- ✅ Ordinamento priorità

```
CRUD /categorie                     # Film generi
```

**Regista Management**
- ✅ CRUD registi (nome, biografia, foto)
- ✅ Assegna film a regista
- ✅ Filmografia per regista

```
CRUD /registi                       # Film directors
```

#### **2. Gestione Cinema e Sale** 🏢

**Cinema Management**
- ✅ CRUD cinema (nome, città, indirizzo, coordinate)
- ✅ Telefono, email per contatti
- ✅ Gestione sale associate
- ✅ Report occupazione sala

```
CRUD /cinemas                       # Cinema CRUD
```

**Sala Management**
- ✅ CRUD sale (numero, tipo: 2D/3D/ISENSE/XL)
- ✅ Editor piantina interattivo:
  - Crea layout posti (settore, fila, numero)
  - Designa posti disabili
  - Visualizza anteprima layout
- ✅ Applicazione layout a interi settori
- ✅ Blocco sala se biglietti emessi

```
GET    /sale/{id}                   # Dettaglio sala
GET    /sale/{id}/posti             # Piantina posti
PUT    /sale/{id}/posti             # Salva piantina
```

#### **3. Programmazione Show** 📺

**Show Workspace Multi-sala**
- ✅ Crea show (film, cinema, sala, orario)
- ✅ Prezzo base + supplemento sala
- ✅ Fallback durata da film
- ✅ Anti-overlap temporale (validazione)
- ✅ Visualizza conflitti orari
- ✅ Modifica/elimina show

**Validazioni**
- ✅ Nessun overlap tra show stessa sala: `[NewStart, NewEnd)` ∩ `[ExistingStart, ExistingEnd)` = ∅
- ✅ Prezzo minimo validato
- ✅ Cinema/sala deve esistere
- ✅ Blocking eliminazione se biglietti emessi

```
POST   /shows                       # Crea show
PUT    /shows/{id}                  # Modifica show
DELETE /shows/{id}                  # Elimina show
GET    /shows                       # Lista show paginata
```

#### **4. Gestione Pagamenti** 💳

**Ricarica Credito Utente**
- ✅ Ricerca utente per email
- ✅ Visualizza saldo credito corrente
- ✅ Ricarica importo customizzato
- ✅ Audit trail movimento credito
- ✅ Storico ricariche utente

```
POST   /admin/credito/ricariche     # Ricarica credito
GET    /credito/me                  # Saldo credito
```

**Gestione Rimborsi**
- ✅ Rimborsa ordine (credito o carta)
- ✅ Cancella ordine pendente
- ✅ Storico rimborsi completo
- ✅ Email notifica rimborso

```
POST   /checkout/orders/{id}/cancel # Annulla ordine
```

#### **5. Validazione Biglietti** ✅

**QR/Barcode Scanner**
- ✅ Fotocamera browser con zoom
- ✅ Auto-detect QR code in tempo reale
- ✅ Fallback input manuale codice
- ✅ Lookup ticket (show, cinema, utente, stato)
- ✅ Validazione con audit trail
- ✅ Prevent doppia validazione
- ✅ Blocco validazione da cinema diverso

**Modalità Operazione**
- Mode Normal: lookup → visualizza → conferma
- Mode Auto-Click: validazione diretta (rapido)
- Mode Manuale: input codice CB-XXXXXX

```
GET    /admin/tickets/validate/{code}  # Lookup ticket
POST   /admin/tickets/validate         # Valida ticket
```

#### **6. Gestione Utenti (Admin Only)** 👥

- ✅ Ricerca utenti per email
- ✅ Visualizza profilo utente
- ✅ Promozione ruolo (PowerUser, Admin, CinemaStaff)
- ✅ Blocco/sblocco account
- ✅ Revoca sessioni utente (logout forzato)
- ✅ Export lista utenti

```
CRUD   /admin/users                 # User management
POST   /admin/users/{id}/promote    # Promozione ruolo
POST   /admin/users/{id}/revoke-sessions # Logout forzato
```

#### **7. Promozioni e Marketing** 🎁

- ✅ CRUD promozioni (percentuale, importo fisso, biglietto gratis)
- ✅ Codice coupon univoco
- ✅ Validità temporale (data inizio/fine)
- ✅ Limiti utilizzo per utente/totale
- ✅ Film o cinema specifici
- ✅ Report utilizzo coupon

```
CRUD   /promozioni                  # Promotion CRUD
```

#### **8. Prenotazioni Feste** 🎉

- ✅ Crea prenotazione festa
- ✅ Numero persone, data, orario
- ✅ Menu catering selezionabile
- ✅ Prezzo customizzato
- ✅ Assegnazione sala automatica
- ✅ Reminder email cliente

#### **9. Food & Beverage** 🍿

- ✅ Catalogo item (popcorn, bevande, snack)
- ✅ Prezzo + foto
- ✅ Disponibilità per sala/cinema
- ✅ Ordini durante show

#### **10. Merchandise Shop** 👕

- ✅ Catalogo merch (t-shirt, poster, etc.)
- ✅ Foto, prezzo, stock
- ✅ Spedizione con tracking
- ✅ Magazzino + Corriere workflow

**Magazziniere** 📦
- ✅ Visualizza ordini pronti
- ✅ Pacchetto - etichetta con barcode
- ✅ Inventario gestito

**Corriere** 🚗
- ✅ Prendi in carico pacchi
- ✅ Scansione consegna
- ✅ Tracking cliente visibile

#### **11. Support Ticket System** 📞

- ✅ Gestione ticket supporto
- ✅ Categorie ticket (Pagamento, Biglietto, Altro)
- ✅ Chat in-app
- ✅ Priorità (Low/Medium/High)
- ✅ Assegnazione a staff
- ✅ SLA tracking

#### **12. Newsletter & Campagne** 📧

- ✅ Gestione subscriber
- ✅ Template email
- ✅ Scheduling campagne
- ✅ Analytics aperture/click

#### **13. Analytics & Report** 📈

- ✅ Dashboard analytics completa
- ✅ Revenue per cinema/film
- ✅ Occupazione sala (heat map)
- ✅ Export dati in CSV/PDF
- ✅ Trend ultimi 30 giorni

---

### 🏷️ Area Staff Cinema

**CinemaStaff Role Accesso:**
- Ricarica credito utente
- Validazione biglietti
- Support ticket
- Promozioni (view)
- Feste (view)
- Rimborsi (assistiti)
- Food (view ordini)
- Merchandise (view ordini)

---

## Stack Tecnologico

### Backend

#### **Runtime**
- `.NET 9.0` - Framework runtime
- `ASP.NET Core 9` - Web API framework

#### **Database & ORM**
| Libreria | Versione | Uso |
|----------|----------|-----|
| `Pomelo.EntityFrameworkCore.MySql` | 9.0.0 | Driver MySQL/MariaDB |
| MySQL 8.0+ / MariaDB 10.11+ | - | Database principale |

#### **Autenticazione & Security**
| Libreria | Versione | Uso |
|----------|----------|-----|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 9.0.11 | JWT token validation |
| `Microsoft.AspNetCore.Authentication.Google` | 9.0.0 | OAuth Google |
| `Microsoft.AspNetCore.Authentication.MicrosoftAccount` | 9.0.0 | OAuth Microsoft |
| `BCrypt.Net-Next` | 4.1.0 | Password hashing |
| `DotNetEnv` | 3.1.1 | .env file support |

#### **Pagamenti**
| Libreria | Versione | Uso |
|----------|----------|-----|
| `Stripe.net` | 48.2.0 | Stripe API integration |

#### **PDF & QR Code**
| Libreria | Versione | Uso |
|----------|----------|-----|
| `QuestPDF` | 2026.2.4 | PDF generation biglietti |
| `QRCoder` | 1.8.0 | QR code generation |
| `ZXing.Net` | 0.16.11 | Barcode reading |

#### **Email**
| Libreria | Versione | Uso |
|----------|----------|-----|
| `MailKit` | 4.16.0 | SMTP client email |

#### **API Documentation**
| Libreria | Versione | Uso |
|----------|----------|-----|
| `NSwag.AspNetCore` | 14.6.3 | Swagger/OpenAPI docs |

### Frontend

#### **HTML & CSS**
- `HTML5` - Semantic markup
- `CSS3` - Grid, Flexbox, media queries
- `Tailwind CSS` - Utility-first CSS framework

#### **JavaScript Runtime**
- `ECMAScript 2020+` - Vanilla JS (no framework)
- `Fetch API` - HTTP requests
- `Web APIs`:
  - Geolocation API
  - Camera API (QR scanning)
  - Barcode Detection API
  - Local Storage API
  - File API

#### **Browser Compatibility**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### DevOps & Build

#### **Versioning & CI/CD**
- `Git` - Source control
- `.gitignore` - Exclude .env, node_modules

#### **Package Management**
- `NuGet` - .NET dependency management
- `npm` - JavaScript tooling (optional)

#### **Database Migrations**
- `Entity Framework Core Migrations` - Schema versioning (71 migrations)

#### **Configuration**
- `.env` files - Environment-specific config
- `appsettings.json` - ASP.NET Core config
- `launchSettings.json` - Development URLs

---

## Modello Dati

### Entità Principali

#### **User** 👤
```csharp
public class User
{
    public int UserId { get; set; }
    public string Email { get; set; }                    // Unique
    public string NomeCompleto { get; set; }
    public string PasswordHash { get; set; }
    public UserRole Role { get; set; }                  // enum: User=0, PowerUser=1, Admin=2, CinemaStaff=3, Corriere=4, Magazziniere=5
    public bool LocalCredentialsEnabled { get; set; }
    public string AuthVersion { get; set; }             // Session revocation
    public int? CinemaPreferitoId { get; set; }
    public decimal CreditoResiduo { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

#### **Film** 🎥
```csharp
public class Film
{
    public int FilmId { get; set; }
    public string Titolo { get; set; }
    public int? Anno { get; set; }
    public string Trama { get; set; }
    public string DescrizioneLunga { get; set; }
    public string CastText { get; set; }
    public DateTime? DataRilascio { get; set; }
    public int Durata { get; set; }                     // minuti (fallback per Show)
    public string Genere { get; set; }
    
    // Relations
    public virtual ICollection<Regista> Registi { get; set; }
    public virtual ICollection<Categoria> Categorie { get; set; }
    public virtual ICollection<Show> Shows { get; set; }
}
```

#### **Cinema** 🏢
```csharp
public class Cinema
{
    public int CinemaId { get; set; }
    public string Nome { get; set; }
    public string Citta { get; set; }
    public string Indirizzo { get; set; }
    public string Telefono { get; set; }
    public decimal? Latitudine { get; set; }
    public decimal? Longitudine { get; set; }
    
    // Relations
    public virtual ICollection<Sala> Sale { get; set; }
    public virtual ICollection<Show> Shows { get; set; }
}
```

#### **Sala (Theater Room)** 🎪
```csharp
public class Sala
{
    public int SalaId { get; set; }
    public int CinemaId { get; set; }
    public int NumeroProgressivo { get; set; }
    public TipoSala TipoSala { get; set; }             // enum: 2D, 3D, ISENSE, XL
    public string Nome { get; set; }
    public decimal Supplemento { get; set; }           // extra price
    public bool IsAttiva { get; set; }
    
    // Relations
    public virtual Cinema Cinema { get; set; }
    public virtual ICollection<SalaPosto> SalaPosti { get; set; }
    public virtual ICollection<Show> Shows { get; set; }
}
```

#### **SalaPosto (Physical Seat)** 🪑
```csharp
public class SalaPosto
{
    public int SalaPostoId { get; set; }
    public int SalaId { get; set; }
    public string Settore { get; set; }                // A, B, C...
    public int Fila { get; set; }                      // Row number
    public int Numero { get; set; }                    // Seat number in row
    public int PosX { get; set; }                      // Layout coordinates
    public int PosY { get; set; }
    public bool IsWheelchair { get; set; }
    public bool IsAttivo { get; set; }
    
    // Relations
    public virtual Sala Sala { get; set; }
}
```

#### **Show (Projection)** 📺
```csharp
public class Show
{
    public int ShowId { get; set; }
    public int CinemaId { get; set; }
    public int SalaId { get; set; }
    public int FilmId { get; set; }
    public DateTime StartAtUtc { get; set; }           // Unique per Sala
    public int DurataMinutiSnapshot { get; set; }
    public decimal PrezzoBase { get; set; }
    public decimal SupplementoSala { get; set; }
    
    // Relations
    public virtual Cinema Cinema { get; set; }
    public virtual Sala Sala { get; set; }
    public virtual Film Film { get; set; }
    public virtual ICollection<ShowPostoStato> ShowPostiStato { get; set; }
    public virtual ICollection<Biglietto> Biglietti { get; set; }
}
```

#### **ShowPostoStato (Seat State)** 🔒
```csharp
public class ShowPostoStato
{
    public int Id { get; set; }
    public int ShowId { get; set; }
    public int SalaPostoId { get; set; }
    public int? UserId { get; set; }
    public ShowPostoState Stato { get; set; }          // Hold=0, Sold=1
    public string HoldToken { get; set; }              // Unique per hold
    public DateTime? ScadeAtUtc { get; set; }          // TTL expiry
    public int? OrdineId { get; set; }
    
    // Relations
    public virtual Show Show { get; set; }
    public virtual Ordine Ordine { get; set; }
}
```

#### **Ordine (Order)** 📋
```csharp
public class Ordine
{
    public int OrdineId { get; set; }
    public string CodiceOrdine { get; set; }           // Unique human-readable
    public int UserId { get; set; }
    public int ShowId { get; set; }
    public int CinemaId { get; set; }
    public int SalaId { get; set; }
    public int FilmId { get; set; }
    public string HoldToken { get; set; }              // Link to hold
    public int NumeroBiglietti { get; set; }
    public decimal TotaleLordo { get; set; }
    public decimal ImportoCredito { get; set; }
    public decimal ImportoCarta { get; set; }
    public OrdineState Stato { get; set; }             // Pending=0, Paid=1, Failed=2, Cancelled=3, Expired=4
    public string StripeCheckoutSessionId { get; set; }
    public string IdempotencyKey { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Relations
    public virtual User User { get; set; }
    public virtual Show Show { get; set; }
    public virtual ICollection<Biglietto> Biglietti { get; set; }
    public virtual ICollection<MovimentoCredito> Movimenti { get; set; }
}
```

#### **Biglietto (Digital Ticket)** 🎫
```csharp
public class Biglietto
{
    public int BigliettoId { get; set; }
    public int OrdineId { get; set; }
    public int ShowId { get; set; }
    public int SalaPostoId { get; set; }
    public int UserId { get; set; }
    public string CodiceBiglietto { get; set; }        // CB-XXXXXX, unique
    public string BarcodeValue { get; set; }           // Barcode/QR payload
    public BigliettoState Stato { get; set; }          // Issued=0, Validated=1, Cancelled=2
    public DateTime? ValidatoAtUtc { get; set; }
    public int? ValidatoDaUserId { get; set; }         // Admin validator
    
    // Relations
    public virtual Ordine Ordine { get; set; }
    public virtual Show Show { get; set; }
    public virtual SalaPosto SalaPosto { get; set; }
    public virtual User User { get; set; }
}
```

#### **MovimentoCredito (Credit Audit)** 💰
```csharp
public class MovimentoCredito
{
    public int MovimentoId { get; set; }
    public int UserId { get; set; }
    public MovimentoCreditoTipo Tipo { get; set; }    // TopUp=0, DebitOrder=1, Refund=2, Adjustment=3
    public decimal Importo { get; set; }
    public decimal SaldoPre { get; set; }
    public decimal SaldoPost { get; set; }
    public int? OrdineId { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Relations
    public virtual User User { get; set; }
    public virtual Ordine Ordine { get; set; }
}
```

### Enumerazioni

```csharp
enum UserRole { User=0, PowerUser=1, Admin=2, CinemaStaff=3, Corriere=4, Magazziniere=5 }
enum TipoSala { DueD=0, TreD=1, ISENSE=2, XL=3 }
enum ShowPostoState { Hold=0, Sold=1 }
enum OrdineState { Pending=0, Paid=1, Failed=2, Cancelled=3, Expired=4, CheckoutInProgress=5 }
enum BigliettoState { Issued=0, Validated=1, Cancelled=2 }
enum MovimentoCreditoTipo { TopUp=0, DebitOrder=1, Refund=2, Adjustment=3 }
enum PromotionType { Percentage=0, FixedAmount=1, FreeTicket=2 }
```

### Indici Chiave per Performance

| Tabella | Indice | Scopo |
|---------|--------|-------|
| Sala | (CinemaId, NumeroProgressivo) | Anti-duplicate per sala |
| SalaPosto | (SalaId, Settore, Fila, Numero) | Lookup posto unico |
| Show | (CinemaId, SalaId, StartAtUtc) | Anti-overlap detection |
| ShowPostoStato | (ShowId, SalaPostoId) | Lookup stato posto |
| Ordine | CodiceOrdine, IdempotencyKey | Idempotenza |
| Biglietto | (ShowId, SalaPostoId), CodiceBiglietto | Lookup ticket |

---

## Ruoli Utenti e RBAC

### 1. **User** (Ruolo Base)
**Accesso**: Landing page, catalogo, programmazione, acquisto biglietti, profilo

```
✅ GET /films, /films/{id}
✅ GET /programmazione/*
✅ GET /checkout/shows/{id}/seat-map
✅ POST /checkout/holds
✅ POST /checkout/orders
✅ GET /checkout/orders (propri)
✅ GET /credito/me
✅ POST /auth/register, /auth/login
✅ Shop, Membership, Gift Card, Feste, Food
❌ Admin endpoints
```

### 2. **PowerUser** (Operatore Cinema)
**Accesso**: Admin completo tranne gestione utenti e newsletter

```
✅ CRUD /films, /categorie, /registi
✅ CRUD /cinemas, /sale, /shows
✅ CRUD /promozioni
✅ GET /checkout/orders (tutti)
✅ POST /admin/credito/ricariche
✅ GET /admin/tickets/validate
✅ POST /admin/tickets/validate
✅ CRUD Feste, Food, Merch
✅ Support tickets
✅ Rimborsi
❌ User management
❌ Newsletter, Analytics
```

### 3. **Admin** (Amministratore Piattaforma)
**Accesso**: Tutto, incluso user management e analytics

```
✅ Tutto PowerUser
✅ CRUD /admin/users
✅ POST /admin/users/{id}/promote
✅ CRUD Membership, Newsletter
✅ Analytics dashboard
✅ Export dati
✅ Configurazione piattaforma
```

### 4. **CinemaStaff** (Personale Cinema)
**Accesso**: Supporto operativo cinema

```
✅ POST /admin/credito/ricariche (limitato)
✅ GET /admin/tickets/validate
✅ POST /admin/tickets/validate
✅ Support tickets
✅ View promozioni
✅ View feste, rimborsi
✅ View food, merch
❌ Modifiche catalog/programmazione
❌ User management
```

### 5. **Magazziniere** (Warehouse Staff)
**Accesso**: Gestione pacchi merch

```
✅ View ordini merch pronti per pacchetto
✅ Creare etichetta barcode
✅ Gestire inventario
❌ Pagamenti, vendita
```

### 6. **Corriere** (Delivery Partner)
**Accesso**: Tracking e consegna

```
✅ View pacchi assegnati
✅ Scansione consegna
✅ Aggiornamento tracking
❌ Modifica ordini
```

### Authorization Policies

```csharp
// In appsettings
var adminOnly = context.User.HasRole(UserRole.Admin);
var powerUserOrAdmin = context.User.HasRole(UserRole.PowerUser, UserRole.Admin);
var cinemaStaffOrHigher = context.User.HasRole(
    UserRole.CinemaStaff, UserRole.PowerUser, UserRole.Admin
);
var authenticated = context.User.Identity?.IsAuthenticated == true;
```

---

## Flussi Principali

### 🎫 Flusso Acquisto Biglietti (End-to-End)

#### **Fase 1: Accesso e Visualizzazione**

```
Utente accede a acquista.html
    ↓
GET /checkout/shows/{showId}/seat-map
    ↓ [Response]
    ├─ Mappa posti con stati (Hold, Sold, Free)
    ├─ Prezzo base + supplemento sala
    ├─ Disponibilità posti
    └─ TTL hold rimanente (10 min)
    ↓
Visualizza piantina interattiva
    ├─ Settori: A, B, C, D...
    ├─ File: 1-15
    ├─ Colori: Green=Free, Yellow=Hold (altri utenti), Red=Sold
    ├─ Posti disabili accessibili
    └─ Totale posti selezionati
```

#### **Fase 2: Hold Posti (10 minuti TTL)**

```
Utente seleziona 3 posti → Clicca "Continua"
    ↓
POST /checkout/holds
{
  "showId": 42,
  "salaPostiIds": [101, 102, 103]
}
    ↓ [Response]
{
  "holdToken": "HT_abc123xyz789",
  "expiresAt": "2026-05-16T15:35:00Z",
  "seatDetails": [...]
}
    ↓
Salva holdToken in sessionStorage
    ↓
Attiva countdown visibile (10:00 → 0:00)
    ↓ [Background Keep-Alive]
POST /checkout/holds/{holdToken}/refresh (ogni 4 minuti)
    ↓
Se countdown raggiunge 0:00
    ├─ DELETE /checkout/holds/{holdToken}
    ├─ Mostra "Hold scaduto, seleziona nuovi posti"
    └─ Redirect acquista.html
```

#### **Fase 3: Creazione Ordine**

```
Utente procede a pagamento.html
    ↓
Frontend invia:
POST /checkout/orders
{
  "showId": 42,
  "holdToken": "HT_abc123xyz789",
  "numeroBiglietti": 3,
  "idempotencyKey": "UUID-user-timestamp"
}
    ↓ [Backend Validazione]
    ├─ Verifica holdToken valido e non scaduto
    ├─ Verifica userId owner di hold
    ├─ Verifica posti non venduti nel frattempo
    ├─ Calcola totale: (16.50 + 1.50) × 3 = 54.00 EUR
    └─ Crea Ordine(Pending)
    ↓ [Response]
{
  "ordineId": 1001,
  "codiceOrdine": "ORD-2026051600001",
  "totaleLordo": 54.00,
  "creditoDisponibile": 25.00,
  "statoPagamento": "Pending"
}
    ↓
Salva ordineId in sessionStorage
```

#### **Fase 4: Selezione Metodo Pagamento**

```
Pagina mostra opzioni:

Opzione A: STRIPE CHECKOUT HOSTED
│
├─ POST /checkout/orders/{ordineId}/stripe-checkout-session
├─ [Response] { "sessionId": "cs_test_...", "sessionUrl": "https://checkout.stripe.com/..." }
├─ Redirect a Stripe hosted checkout
├─ (Utente inserisce carta in iframe Stripe)
├─ Stripe effettua 3DS se necessario
└─ Webhook da Stripe: checkout.session.completed
   ├─ Backend: Marca Ordine come Paid
   ├─ Emette Biglietti (Stato=Issued)
   ├─ Genera PDF con QR code
   ├─ Invia email con allegato
   └─ Rilascia hold posti → Sold
    ↓
Opzione B: PAGAMENTO CON CREDITO
│
├─ GET /credito/me → { "saldoCredito": 25.00 }
├─ Se saldoCredito ≥ totaleLordo → Pagamento completo credito
│   └─ POST /checkout/orders/{ordineId}/pay (no paymentMethodId)
├─ Else → Pagamento misto (credito + carta residua 29.00)
│   ├─ POST /checkout/orders/{ordineId}/pay { "paymentMethodId": "pm_..." }
│   └─ Stripe carica saldo residuo
└─ [Response] { "stato": "Paid", "movementId": "MOV-123" }
   ├─ Credito: 25.00 - 25.00 = 0.00 EUR
   ├─ Saldo post: 0.00 EUR
   ├─ Movimento audit: TopUp/DebitOrder/Refund
   └─ Emissione biglietti come sopra
```

#### **Fase 5: Conferma e Download**

```
Redirect a esito-acquisto.html
    ↓
Polling loop: GET /checkout/orders/{ordineId}
    ├─ Verifica Ordine.Stato = Paid
    ├─ Verifica Biglietti count ≥ NumeroBiglietti
    ├─ Timeout polling: 30 secondi
    └─ Se fallisce: Mostra "Verifica manuale"
    ↓
Visualizza recap:
├─ Codice Ordine: ORD-2026051600001
├─ Cinema: Cinema 67 - Roma
├─ Film: Avatar
├─ Data/Ora: 16/05/2026 15:30
├─ Sala: 3 - 3D XL
├─ Posti: A5, A6, A7
├─ Totale: 54.00 EUR
│  ├─ Credito usato: 25.00 EUR
│  └─ Carta: 29.00 EUR
└─ Biglietti:
   ├─ CB-001 (QR code)
   ├─ CB-002 (QR code)
   └─ CB-003 (QR code)
    ↓
Pulsanti:
├─ GET /checkout/orders/{ordineId}/pdf → Download PDF multipagina
├─ Email già spedita a utente@example.com
└─ Aggiungi al profilo (salva Ordine per accesso futuro)
```

---

### 🔐 Flusso Autenticazione (JWT + Device Locking)

```
POST /auth/register
{
  "email": "nuovo@example.com",
  "nomeCompleto": "Mario Rossi",
  "password": "Secure123!@"
}
    ↓
Backend:
├─ Verifica email non già registrato
├─ Hash password con BCrypt
├─ Crea User(Role=0) con CreditoResiduo=0
├─ Genera Auth token pair
└─ Genera Device ID (UUID)
    ↓ [Response]
{
  "userId": 5,
  "email": "nuovo@example.com",
  "accessToken": "eyJhbGc...",        // 15 min expiry
  "refreshToken": "eyJhbGc...",       // 7 giorni expiry
  "deviceId": "550e8400-e29b-41d4-a716-446655440000"
}
    ↓
Frontend:
├─ localStorage.setItem('cb_access_token', accessToken)
├─ localStorage.setItem('cb_refresh_token', refreshToken)
├─ localStorage.setItem('cb_device_id', deviceId)
├─ localStorage.setItem('cb_user', JSON.stringify({userId: 5, email, role: 0}))
└─ Redirect /index.html
    ↓ [Login Successivo]

POST /auth/login
{
  "email": "nuovo@example.com",
  "password": "Secure123!@"
}
    ↓
Backend:
├─ Lookup user by email
├─ BCrypt.Verify(password, passwordHash)
├─ Check LocalCredentialsEnabled
├─ Generate Device ID (se nuovo device)
├─ Create JWT pair + RefreshToken record (device-locked)
└─ Emit accessToken + refreshToken + deviceId
    ↓
Frontend salva tokens + deviceId (come sopra)
    ↓ [Token Refresh - Proactive]

Page load (dopo 10 minuti):
├─ route-guard.js verifica access token scaduto
├─ POST /auth/refresh
│  {
│    "refreshToken": localStorage.refreshToken,
│    "deviceId": localStorage.deviceId
│  }
├─ Backend:
│  ├─ Lookup RefreshToken by token + deviceId
│  ├─ Verifica non è revocato (user.AuthVersion match)
│  ├─ Generate nuova coppia token
│  ├─ Invalidate vecchio RefreshToken
│  └─ Emit nuovi token
├─ Frontend: Update localStorage
└─ Continua sessione silenziosamente
    ↓ [Logout]

POST /auth/logout
    ↓
Backend:
├─ Lookup user
├─ Increment AuthVersion (es: "1" → "2")
├─ Mark tutti RefreshToken come revoked
├─ Response success
    ↓
Frontend:
├─ localStorage.clear()
├─ Redirect /login.html
└─ Tutti device utente risultano disconnessi
    ↓ [Token Refresh con Credenziale Revocata]

(Utente con vecchio token su device diverso tenta refresh)
POST /auth/refresh
{
  "refreshToken": "vecchio_token",
  "deviceId": "device_1"
}
    ↓
Backend:
├─ Lookup RefreshToken
├─ Verifica user.AuthVersion ≠ token.AuthVersion
├─ Return 401 Unauthorized
    ↓
Frontend:
├─ Cattura 401
├─ localStorage.clear()
├─ Redirect /login.html
└─ Device invalidato
    ↓ [OAuth Google]

login.html - Clicca "Accedi con Google"
    ↓
Frontend:
├─ Redirect a: https://accounts.google.com/o/oauth2/v2/auth?...
│  ├─ client_id
│  ├─ scope: email, profile
│  ├─ redirect_uri: http://localhost:5001/social-login-complete.html
│  └─ state: random_nonce
├─ Google: Utente autorizza
├─ Google redirect: /social-login-complete.html?code=auth_code&state=nonce
    ↓
social-login-complete.html:
├─ Extract auth_code da query
├─ POST /auth/google-login { "code": "auth_code" }
├─ Backend:
│  ├─ Verifica nonce (CSRF protection)
│  ├─ Exchange code per Google ID token
│  ├─ Verifica ID token signature
│  ├─ Extract email + name da claims
│  ├─ Lookup/Create user (LocalCredentialsEnabled=false)
│  ├─ Emit JWT pair + device ID
│  └─ Return { accessToken, refreshToken, deviceId }
└─ Frontend: Salva tokens, redirect /index.html
```

---

### ✅ Flusso Validazione Biglietti (QR Scanner)

```
Admin accede validazione-biglietti.html
    ↓
Seleziona cinema da dropdown (es: Cinema 67)
    ↓
Modalità Normal:
│
├─ Camera: Inquadra codice QR biglietto
│  ├─ JavaScript: Barcode Detection API
│  ├─ Auto-detect QR in tempo reale
│  └─ Extract testo: "CB-001XYZ"
│
├─ Backend lookup:
│  GET /admin/tickets/validate/CB-001XYZ
│  ↓ [Response]
│  {
│    "bigliettoId": 5001,
│    "codiceBiglietto": "CB-001XYZ",
│    "stato": "Issued",
│    "show": {
│      "film": "Avatar",
│      "cinema": "Cinema 67",
│      "sala": "3D XL",
│      "orario": "2026-05-16T15:30:00Z"
│    },
│    "utente": "Mario Rossi (mario@example.com)",
│    "posto": "A5",
│    "validatoAt": null
│  }
│
├─ Visualizza dettagli: Film, Cinema, Utente, Posto
├─ Admin: Clicca "Conferma Validazione"
│
├─ POST /admin/tickets/validate
│  {
│    "codiceBiglietto": "CB-001XYZ",
│    "cinemaId": 1
│  }
│  ↓ [Backend]
│  ├─ Lookup Biglietto by codice
│  ├─ Verifica Stato = Issued (not already Validated)
│  ├─ Verifica Biglietto.Show.Cinema = cinemaId (prevent cross-cinema)
│  ├─ Update Stato → Validated
│  ├─ Set ValidatoAtUtc = Now
│  ├─ Set ValidatoDaUserId = admin.UserId
│  ├─ Audit log: (userId, timestamp, biglietto)
│  └─ Return success
│
└─ Visualizza: "✓ Biglietto CB-001XYZ validato!" (green toast)
    ↓
Modalità Auto-Click (rapido):
│
├─ Camera inquadra QR
├─ Estrae "CB-001XYZ"
├─ AUTO: POST /admin/tickets/validate { codice, cinema }
├─ Salta display lookup
├─ Mostra direkt: "✓ Validato!" oppure "✗ Errore"
└─ Adatto per cassa/gate rapida
    ↓
Validazione Fallisce:
│
├─ Biglietto non trovato → "Codice non valido"
├─ Già validato → "Biglietto già validato alle 15:32"
├─ Cinema diverso → "Biglietto per Cinema XYZ, non Cinema 67"
├─ Show cancellato → "Proiezione annullata"
└─ Toast rosso + Suono alert
    ↓
Modalità Manuale (fallback):
│
├─ Input text: "CB-001XYZ"
├─ Enter → POST /admin/tickets/validate
└─ Stesso flusso come scannerizzato
```

---

## Installazione e Setup

### Prerequisiti

```bash
# Verifica requisiti
Windows 10+:
  - .NET 9 SDK → dotnet --version
  - MySQL 8.0+ → mysql --version
  - Git → git --version
  - Node.js 18+ (opzionale) → node --version

macOS / Linux:
  - Docker (opzionale) per MySQL
  - .NET 9 SDK
  - Git
```

### Step 1: Clone Repository

```bash
git clone https://github.com/anomalyco/film-app-main.git
cd film-app-main
```

### Step 2: Setup Database

```bash
# Crea database MySQL
mysql -u root -p -e "CREATE DATABASE \`film-api-db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Copia .env da template
cp backend/.env.example backend/.env

# Edita backend/.env
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=film-api-db
# DB_USER=root
# DB_PASSWORD=<your_password>
# JWT_SECRET=<min 256-bit key>
# STRIPE_SECRET_API_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# SMTP_HOST=smtp.gmail.com
# SMTP_USER=...
# SMTP_PASSWORD=...
```

### Step 3: Apply Migrations

```bash
cd backend/FilmAPI

# Restore dependencies
dotnet restore

# Apply database migrations
dotnet ef database update
# → Applica 71 migrazioni

# Verifica database creato
mysql -u root -p film-api-db -e "SHOW TABLES;"
# → 39 tabelle create
```

### Step 4: Run Backend

```bash
cd backend/FilmAPI

dotnet run
# Output:
# → Now listening on: http://localhost:5000
# → Now listening on: https://localhost:5001
# → Swagger: http://localhost:5000/swagger

# In alternate terminal, verifica health:
curl http://localhost:5000/health
# → {"status":"Healthy"}
```

### Step 5: Run Frontend

```bash
cd frontend/CineBase.Web

dotnet run
# Output:
# → Now listening on: http://localhost:5001
# → Open browser: http://localhost:5001

# Frontend accede API:
# GET http://localhost:5000/config/frontend
# → { "stripePublishableKey": "pk_test_..." }
```

### Step 6: Seed Database (Optional)

```bash
cd backend/scripts/FilmApiSeeder

dotnet run -- --reset-all --force
# → Crea:
#   - 64 film da TMDB
#   - 20 cinema in Italia
#   - 83 sale totali
#   - 1200+ show nel prossimo mese
#   - Admin account (admin@cinebase.it / Admin123!@)

# Tempo: ~2-3 minuti
```

### Step 7: Credenziali Demo

```
Admin Account:
  Email: admin@cinebase.it
  Password: Admin123!@
  Role: Admin

Cinema Staff:
  Email: cinema67staff@cinema67.it
  Password: Staff123!@
  Role: CinemaStaff

PowerUser:
  Email: poweruser@cinema67.it
  Password: PowerUser123!@
  Role: PowerUser
```

### Quick Start Script (Windows)

```bash
# start-cinema67.bat
@echo off
start /D backend\FilmAPI dotnet run
start /D frontend\CineBase.Web dotnet run
start http://localhost:5001
```

### Configurazione Stripe (Test Mode)

```
1. Registrati su https://stripe.com
2. Vai a Dashboard → API Keys (Test mode)
3. Copia Publishable Key (pk_test_...)
4. Copia Secret Key (sk_test_...)
5. Edita backend/.env:
   STRIPE_SECRET_API_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
6. Webhook testing:
   - Installa Stripe CLI: https://stripe.com/docs/stripe-cli
   - stripe login
   - stripe listen --forward-to localhost:5000/payments/stripe/webhook
7. Test carta: 4242 4242 4242 4242 (any future date, any CVC)
```

### Configurazione SMTP (Email)

```
Opzione A: Google Mail SMTP
  - SMTP_HOST=smtp.gmail.com
  - SMTP_PORT=587
  - SMTP_USER=tuo_email@gmail.com
  - SMTP_PASSWORD=<app_password>  [NOT account password]
  - Abilita "Less secure apps" oppure crea App Password

Opzione B: SendGrid
  - SMTP_HOST=smtp.sendgrid.net
  - SMTP_PORT=587
  - SMTP_USER=apikey
  - SMTP_PASSWORD=<sendgrid_api_key>

Opzione C: Locally Test (MailKit)
  - SMTP_HOST=localhost
  - SMTP_PORT=1025
  - Installa MailHog: https://github.com/mailhog/MailHog
  - mailhog.exe
  - Browse: http://localhost:1025
```

### Configurazione OAuth Google (Optional)

```
1. Google Cloud Console: https://console.cloud.google.com
2. Create Project: "Cinema67"
3. APIs & Services → OAuth 2.0 Client IDs
4. Type: Web application
5. Authorized redirect URIs:
   - http://localhost:5001/social-login-callback
   - http://localhost:5001/social-login-complete.html
6. Copy Client ID + Client Secret
7. backend/.env:
   GOOGLE_CLIENT_ID=xyz...
   GOOGLE_CLIENT_SECRET=abc...
8. frontend/config → Stripe key + Google ID
```

---

## Punti di Forza

### ✅ Architettura

1. **Domain-Driven Design**: Modello multisala con anti-overlap, hold TTL, idempotenza integrata
2. **Moderno**: ASP.NET Core 9 Minimal API, HTML5/Vanilla JS zero-build
3. **Scalabile**: 49 entità model, 71 migrazioni, indici optimizzati per query voluminose
4. **Sicuro**: JWT + Device locking, OAuth 2.0, BCrypt password hashing, HMAC webhook validation

### ✅ Funzionalità

5. **Ticketing Completo**: PDF multipagina QR/barcode, email SMTP provider-agnostic, validazione auditata
6. **Pagamenti Flessibili**: Stripe Checkout hosted + credito piattaforma misto, idempotenza garantita
7. **Admin Operativo**: 20+ workspace role-based, piantina editor visuale, paginazione server-side
8. **Autenticazione Moderna**: JWT + refresh token device-locked, OAuth Google/Microsoft, session revocation

### ✅ Quality

9. **Test Coverage**: 231/231 test automatici, RBAC verified, idempotenza tested, concorrenza covered
10. **Documentazione**: Tutorial dettagliati (1301 righe FRONTEND_ARCHITECTURE.md), status aggiornato
11. **Performance**: Template loader con cache, API centralizzato, lazy load componenti
12. **DevOps**: GitHub Actions ready, Docker support, .env config separato

---

## Roadmap e Miglioramenti

### Iterazione 6 (Prossima)

- [ ] **Rimozione Compat Layer**: Elimina Proiezione/Prenotazione legacy (read-only bridge)
- [ ] **Build Tool Frontend**: Integrazione Vite/Webpack per minification + tree-shaking
- [ ] **Caching Layer**: Implementa Redis per query voluminose
- [ ] **Rate Limiting**: Migra a AspNetCore.RateLimit libreria standard
- [ ] **Logging Strutturato**: Serilog con file + cloud appenders

### Iterazione 7 (Q3 2026)

- [ ] **Database Sharding**: Scalabilità orizzontale per big cinema chains
- [ ] **Push Notifications**: Mobile reminder ordine + validazione ticket
- [ ] **Analytics BI**: Dashboard Grafana con business intelligence
- [ ] **Microservices**: Separation pagamenti/ticketing/notification
- [ ] **API Versioning**: /v2/ endpoints con backward compatibility

### Post-MVP (Future)

- [ ] **Mobile Apps**: iOS + Android native clients
- [ ] **AI Recommendations**: Film suggestions basate su preferenze
- [ ] **VR Cinema Selector**: Esperienza immersiva nella selezione sala
- [ ] **Blockchain Tickets**: NFT biglietti per collectibili
- [ ] **Dynamic Pricing**: Prezzo variabile base occupazione sala

---

## Conclusione

**Cinema67** è una **piattaforma completa e production-ready** per cinema multisala:

### Caratteristiche Distintive
✨ Domain-driven multisala con anti-overlap + hold TTL  
✨ Full-stack moderno: ASP.NET Core 9 + HTML5/Vanilla JS  
✨ Autenticazione enterprise con device locking  
✨ Pagamenti integrati Stripe + credito piattaforma  
✨ Ticketing digitale completo (PDF QR/barcode)  
✨ Admin operativo con 20+ workspace role-based  
✨ 231/231 test automatici coverage  
✨ Documentazione professionale  

### Ready to Deploy
✅ Configurazione SMTP/Stripe  
✅ OAuth setup  
✅ Database backup strategy  
✅ API rate limiting  
✅ Security hardening  

---

**Analisi Completata**: 16 Maggio 2026  
**Repository**: `C:\Users\gioel\Documents\GITHUB\INFO\film-app-main`  
**Status**: ✅ Production Ready (v5.0)

---

**📞 Contatti & Support**
- GitHub Issues: https://github.com/anomalyco/opencode/issues
- Documentation: `/docs` folder
- Tutorial: `/docs/TUTORIAL_*.md`

