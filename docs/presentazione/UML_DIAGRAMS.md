# 🎬 Cinema67 - Diagrammi UML

## 1. Class Diagram

```mermaid
graph TD
    subgraph Core["🎫 CORE TICKETING"]
        User["👤 User<br/>━━━━━━━━━━━━<br/>email: string<br/>passwordHash: string<br/>creditoResiduo: decimal<br/>ruolo: UserRole"]
        Film["🎬 Film<br/>━━━━━━━━━━━━<br/>titolo: string<br/>durata: TimeSpan<br/>trama: string"]
        Cinema["🏢 Cinema<br/>━━━━━━━━━━━━<br/>nome: string<br/>città: string<br/>indirizzo: string"]
        Sala["🎪 Sala<br/>━━━━━━━━━━━━<br/>numeroProgressivo<br/>tipo: 2D/3D/ISENSE"]
        Show["📽️ Show<br/>━━━━━━━━━━━━<br/>startAtUtc: DateTime<br/>prezzo: decimal<br/>stato: ShowStatus"]
        Ordine["📦 Ordine<br/>━━━━━━━━━━━━<br/>codiceOrdine: string<br/>totaleLordo: decimal<br/>stato: OrderState"]
        Biglietto["🎫 Biglietto<br/>━━━━━━━━━━━━<br/>codiceBiglietto: string<br/>qrCodePayload: string"]
    end

    subgraph Support["💰 SUPPORTO & MARKETING"]
        Credito["💳 MovimentoCredito<br/>━━━━━━━━━━━━<br/>tipo: enum<br/>importo: decimal"]
        Promotion["🎁 Promotion<br/>━━━━━━━━━━━━<br/>codice: string<br/>valore: decimal"]
        GiftCard["🎀 GiftCard<br/>━━━━━━━━━━━━<br/>codiceGiftCard<br/>saldoResiduo"]
        Membership["⭐ Membership<br/>━━━━━━━━━━━━<br/>tipoAbbonamento<br/>beneficiPercentuale"]
    end

    subgraph Operativi["🎉 OPERATIVI"]
        Party["🎉 PartyBooking<br/>━━━━━━━━━━━━<br/>numeroPersone<br/>menuCatering"]
        Food["🍿 FoodItem<br/>━━━━━━━━━━━━<br/>nome: string<br/>prezzo: decimal"]
        Merch["👕 MerchItem<br/>━━━━━━━━━━━━<br/>nome: string<br/>stock: int"]
        Ticket["🆘 SupportTicket<br/>━━━━━━━━━━━━<br/>categoria: string<br/>priorita: enum"]
    end

    User -->|1| Ordine
    User -->|1| Biglietto
    User -->|1| Credito
    Film -->|1| Show
    Cinema -->|1| Sala
    Cinema -->|1| Show
    Sala -->|1| Show
    Show -->|1| Ordine
    Show -->|1| Biglietto
    Ordine -->|1| Biglietto
    Ordine -->|1| Promotion
    Party -->|in| Show

    style Core fill:#e3f2fd,stroke:#667eea,stroke-width:2px,color:#000
    style Support fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#000
    style Operativi fill:#e8f5e9,stroke:#4caf50,stroke-width:2px,color:#000
```

---

## 2. Use-Case Diagram

```mermaid
graph TB
    subgraph Cinema67["🎬 Cinema67 System"]
        A["📖 Catalogo Film"]
        B["🔍 Ricerca Film"]
        C["📅 Programmazione"]
        D["🎫 Acquista Biglietti"]
        E["💳 Pagamento"]
        F["📊 Dashboard"]
        G["✅ Validazione QR"]
        H["👥 Gestione Utenti"]
        I["🎬 CRUD Film"]
        J["🎁 Promozioni"]
        K["📈 Analytics"]
        L["🚚 Traccia Pacchi"]
        M["📦 Prepara Pacchi"]
    end

    Guest["👤 Ospite"]
    User["👤 Utente"]
    Staff["👨‍💼 Staff"]
    Admin["👨‍💻 Admin"]
    Courier["🚚 Corriere"]
    Warehouse["📦 Magazziniere"]

    Guest -.-> A
    Guest -.-> B
    Guest -.-> C

    User -.-> A
    User -.-> D
    User -.-> E

    Staff -.-> F
    Staff -.-> G
    Staff -.-> J

    Admin -.-> H
    Admin -.-> I
    Admin -.-> J
    Admin -.-> K

    Courier -.-> L
    Warehouse -.-> M

    style Cinema67 fill:#f0f4c3,stroke:#9e9e9e,stroke-width:2px,color:#000
```

---

## 3. Sequence Diagram: Acquisto Biglietto Completo

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Browser as 🌐 Browser
    participant Backend as 🔧 Backend API
    participant DB as 💾 MySQL DB
    participant PDF as 📄 PdfService
    participant Email as 📧 EmailService

    User->>Browser: 1️⃣ Seleziona 3 posti<br/>(A1, A2, A3)
    Browser->>Browser: Calcola: EUR 34.50

    Browser->>Backend: POST /checkout/holds
    activate Backend
    Backend->>DB: BEGIN TRANSACTION
    Backend->>DB: SELECT ShowPostoStato FOR UPDATE
    DB-->>Backend: Posti LIBERI ✓
    Backend->>DB: UPDATE stato='HOLD'<br/>holdTokenExpiry=10min
    Backend->>DB: COMMIT
    Backend-->>Browser: {holdToken, expiresAt}
    deactivate Backend

    Browser->>Browser: Countdown TTL: 10:00 → 9:59

    User->>Browser: 2️⃣ Pagamento Credito
    Browser->>Backend: GET /credito/me
    Backend-->>Browser: saldo: EUR 50.00

    User->>Browser: 3️⃣ Conferma Pagamento
    Browser->>Backend: POST /checkout/orders
    activate Backend

    Backend->>DB: BEGIN TRANSACTION
    Backend->>DB: UPDATE User<br/>creditoResiduo=15.50
    Backend->>DB: INSERT MovimentoCredito
    Backend->>DB: UPDATE Ordine stato='PAID'
    Backend->>DB: COMMIT

    Backend->>PDF: GenerateBigliettoPdf
    activate PDF
    PDF->>PDF: Genera 3x QR code
    PDF-->>Backend: byte[] PDF
    deactivate PDF

    Backend->>DB: INSERT Biglietto x3
    Backend->>DB: UPDATE ShowPostoStato='SOLD'
    Backend->>Email: SendBigliettoPdf
    Backend-->>Browser: Ordine Completato ✓
    deactivate Backend

    Browser-->>User: ✓ PDF Email Ricevuta
```

---

## 4. Sequence Diagram: Validazione QR Code

```mermaid
sequenceDiagram
    participant Staff as 👨‍💼 Staff
    participant Mobile as 📱 Mobile
    participant Camera as 📷 Camera API
    participant Barcode as 🔍 Barcode Detection
    participant Backend as 🔧 Backend API
    participant DB as 💾 MySQL DB

    Staff->>Mobile: 1️⃣ Avvia Scanning
    Mobile->>Camera: getUserMedia()
    Camera-->>Mobile: MediaStream

    Staff->>Mobile: 2️⃣ Punta camera a QR
    Mobile->>Barcode: BarcodeDetector.detect()
    Barcode-->>Mobile: QR: CB-A1X2Y3Z4 ✓

    Mobile->>Backend: POST /admin/tickets/validate
    activate Backend
    Backend->>DB: SELECT Biglietto
    DB-->>Backend: Biglietto {stato: ISSUED}

    Backend->>Backend: Validazioni:<br/>✓ Esiste<br/>✓ Stato=ISSUED<br/>✓ Non validato

    Backend->>DB: UPDATE Biglietto<br/>stato='VALIDATED'
    Backend->>DB: INSERT ValidationAudit
    Backend-->>Mobile: {success: true}
    deactivate Backend

    Mobile->>Mobile: Suono success ✓
    Mobile-->>Staff: Toast VERDE:<br/>✓ Validato
```

---

## 5. Sequence Diagram: Stripe Payment

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 🌐 Frontend
    participant Backend as 🔧 Backend API
    participant Stripe as 💳 Stripe API
    participant Webhook as 🔔 Webhook Handler
    participant DB as 💾 MySQL DB

    User->>Frontend: 1️⃣ Paga con Carta
    Frontend->>Backend: POST /payment-intent
    Backend->>Stripe: Create PaymentIntent
    Stripe-->>Backend: {clientSecret}
    Backend-->>Frontend: clientSecret

    User->>Frontend: 2️⃣ Inserisci dati carta
    Frontend->>Stripe: confirmCardPayment()
    Stripe->>Stripe: Verifica 3DS
    Stripe-->>Frontend: ✓ Success

    Frontend->>Backend: POST /confirm-payment
    activate Backend
    Backend->>Stripe: Retrieve PaymentIntent
    Stripe-->>Backend: status: 'succeeded'

    Backend->>DB: BEGIN TRANSACTION
    Backend->>DB: UPDATE Ordine='PAID'
    Backend->>DB: INSERT Biglietti x3
    Backend->>DB: UPDATE ShowPostoStato='SOLD'
    Backend->>DB: COMMIT
    Backend-->>Frontend: {success: true}
    deactivate Backend

    par Webhook Asincrono
        Stripe->>Webhook: payment_intent.succeeded
        Webhook->>DB: UPDATE status='CONFIRMED'
    end

    Frontend-->>User: ✓ Pagamento Completato!
```

---

## 6. State Machine: Ciclo Vita Biglietto

```mermaid
stateDiagram-v2
    [*] --> ISSUED: Create Biglietto<br/>(Ordine pagato)

    ISSUED --> VALIDATED: Scansiona QR<br/>Staff valida
    note right of ISSUED
        ✓ PDF generato
        ✓ QR valido
        ✓ Email inviata
        TTL: Infinito
    end note

    ISSUED --> CANCELLED: Ordine rimosso<br/>Refund ordine

    VALIDATED --> [*]: Spettacolo terminato
    note right of VALIDATED
        ✓ Staff confermato
        ✓ Accesso consentito
        ✓ Audit log registrato
    end note

    CANCELLED --> [*]: Cancellazione completata
    note right of CANCELLED
        ✓ Rimborso processato
        ✓ Credito/Carta
        ✓ Audit log
    end note
```

---

## 7. State Machine: Ciclo Vita Ordine

```mermaid
stateDiagram-v2
    [*] --> PENDING: CreateOrder<br/>(Hold attivo)
    note right of PENDING
        ⏱️ Hold posti: 10 min
        💳 Pagamento non processato
        ⏰ Scadenza automatica
    end note

    PENDING --> PAID: ProcessPayment<br/>Stripe/Credito
    PENDING --> CANCELLED: Hold scaduto<br/>TTL expirato

    PAID --> COMPLETED: Spettacolo<br/>concluso
    note right of PAID
        ✓ Biglietti emessi
        ✓ Email confirmation
        ✓ Posti marcati SOLD
    end note

    COMPLETED --> REFUNDED: Richiesta rimborso
    note right of COMPLETED
        ✓ Spettacolo concluso
        ✓ Biglietti validati
        ❌ Rimborso solo pre-show
    end note

    REFUNDED --> [*]: Rimborso completato
    note right of REFUNDED
        ✓ Credito/Carta
        ✓ Biglietti cancellati
        ✓ Posti resi disponibili
    end note

    CANCELLED --> [*]: Cancellazione
    COMPLETED --> [*]: Show finito
```

---

## 8. Data Flow: Pagamento Stripe

```mermaid
graph LR
    FE["🌐 Frontend<br/>Browser"]
    BE["🔧 Backend<br/>API"]
    DB["💾 MySQL<br/>Database"]
    STRIPE["💳 Stripe<br/>API"]

    FE -->|1. POST /payment-intent| BE
    BE -->|Query Ordine| DB
    DB -->|Ordine data| BE

    BE -->|2. Create PaymentIntent| STRIPE
    STRIPE -->|clientSecret| BE
    BE -->|clientSecret| FE

    FE -->|3. confirmCardPayment| STRIPE
    STRIPE -->|Verifica 3DS| STRIPE
    STRIPE -->|success| FE

    FE -->|4. POST /confirm-payment| BE
    BE -->|5. Retrieve PaymentIntent| STRIPE
    STRIPE -->|status: succeeded| BE

    BE -->|6. BEGIN TRANSACTION| DB
    BE -->|UPDATE Ordine| DB
    BE -->|INSERT Biglietti| DB
    BE -->|UPDATE ShowPostoStato| DB
    DB -->|COMMIT| BE

    STRIPE -.->|7. Webhook asincrono| BE
    BE -.->|UPDATE status| DB

    style FE fill:#e3f2fd,stroke:#667eea,stroke-width:2px,color:#000
    style BE fill:#fff3e0,stroke:#ff8c00,stroke-width:2px,color:#000
    style DB fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#000
    style STRIPE fill:#fce4ec,stroke:#e91e63,stroke-width:2px,color:#000
```

---

## 📊 Sommario dei Diagrammi

| Diagramma | Tipo | Complessità | Elementi |
|-----------|------|------------|----------|
| **Class** | Strutturale | ⭐⭐⭐⭐ | 49 entità, 15+ servizi |
| **Use-Case** | Comportamentale | ⭐⭐⭐⭐ | 6 attori, 70+ use case |
| **Seq: Acquisto** | Interazione | ⭐⭐⭐⭐⭐ | 9 attori, 40+ step |
| **Seq: Validazione** | Interazione | ⭐⭐⭐⭐ | 8 attori, API browser |
| **Seq: Stripe** | Interazione | ⭐⭐⭐ | Payment + webhook |
| **State: Biglietto** | Comportamentale | ⭐⭐ | 4 stati |
| **State: Ordine** | Comportamentale | ⭐⭐ | 6 stati |
| **Data Flow** | Strutturale | ⭐⭐⭐ | Flusso pagamento |

---

## 🚀 Stack Tecnologico

### Backend
- **Runtime**: .NET 9.0 (LTS)
- **Framework**: ASP.NET Core 9 Minimal API
- **ORM**: Entity Framework Core 9
- **Database**: MySQL 8.0+ / MariaDB
- **Servizi**: 64 servizi business logic
- **Endpoints**: 33 route groups (100+ endpoint)

### Frontend
- **Markup**: HTML5 Semantico
- **Styling**: Tailwind CSS + Custom CSS
- **Script**: JavaScript ES2020+ (zero-build)
- **Pagine**: 56 pagine HTML
- **Moduli**: 26+ moduli JavaScript

### Database
- **DBMS**: MySQL 8.0+
- **Tabelle**: 39 entità
- **Migrazioni**: 71 migrazioni EF Core
- **Indici**: 20+ indici ottimizzati
- **Relazioni**: M:1, 1:M, M:M junction tables

---

## 🎯 Funzionalità Principali

### Ticketing
- ✅ Acquisto biglietti con selezione grafica posti
- ✅ Hold posti con TTL 10 minuti
- ✅ Biglietti digitali con QR code
- ✅ Validazione QR scanner con camera
- ✅ PDF biglietti generati automaticamente

### Pagamenti
- ✅ Stripe integrato (PaymentIntent + 3DS)
- ✅ Credito interno piattaforma
- ✅ Split payment (credito + carta)
- ✅ Idempotency protection
- ✅ Webhook handling

### Gestione
- ✅ 6 ruoli RBAC (User → Admin)
- ✅ CRUD film, cinema, sale
- ✅ Editor piantina interattivo
- ✅ Anti-overlap validazione show
- ✅ Rimborsi ordini

### Features Aggiuntive
- ✅ Party booking con catering
- ✅ E-commerce merchandise
- ✅ Food & beverage ordering
- ✅ Membership abbonamenti
- ✅ Promozioni e coupon
- ✅ Support ticket system
- ✅ Newsletter marketing
- ✅ Analytics dashboard
- ✅ GDPR compliance (export/delete)

---

**Generato con Mermaid.js** | Cinema67 v5.0 | 🎬
