# 🛠️ Cinema67 - Complete Tech Stack Deep Dive

## Technology Stack Visualized

### Complete Ecosystem Overview

```mermaid
graph TB
    Users["👥 Users<br/>World Wide Web"] -->|HTTPS| CDN["📡 CDN<br/>Cloudflare<br/>DDoS Protection"]

    CDN -->|Traffic| LB["⚖️ Load Balancer<br/>Nginx<br/>- SSL/TLS<br/>- Reverse Proxy<br/>- Rate Limiting"]

    LB -->|Port 5000| API1["🔧 ASP.NET Core 9<br/>Instance 1"]
    LB -->|Port 5001| API2["🔧 ASP.NET Core 9<br/>Instance 2"]
    LB -->|Port 5002| API3["🔧 ASP.NET Core 9<br/>Instance 3"]

    API1 & API2 & API3 -->|REST API| Services["⚙️ SERVICE LAYER"]

    Services -->|Object Mapping| AutoMapper["🔄 AutoMapper"]
    Services -->|Data Validation| FluentVal["✓ FluentValidation"]
    Services -->|Generate QR| QRCoder["📊 QRCoder"]
    Services -->|Generate PDF| QuestPDF["📄 QuestPDF"]
    Services -->|Send Email| MailKit["📧 MailKit"]
    Services -->|Structure Logs| Serilog["📝 Serilog"]

    AutoMapper & FluentVal & QRCoder & QuestPDF & MailKit & Serilog -->|EF Core| Data["💾 DATA ACCESS LAYER"]

    Data -->|LINQ Queries| MySQL["📊 MySQL 8.0+<br/>Primary DB<br/>- 39 Tables<br/>- 71 Migrations<br/>- ACID Compliant"]

    Data -->|Cache| Redis["💾 Redis Cluster<br/>- Sessions<br/>- Cache Layer<br/>- Rate Limiting"]

    MySQL -->|Async Replication| MySQLReplica["📊 MySQL Replica<br/>Read-Only<br/>Backup"]

    MySQLReplica -->|Daily Backup| Backup["🔄 Encrypted Backup<br/>S3-compatible"]

    API1 & API2 & API3 -->|API Call| StripeSDK["💳 Stripe SDK"]
    StripeSDK -->|HTTPS| StripeAPI["💳 Stripe API<br/>- Payment Processing<br/>- Webhook Handling<br/>- 3DS Auth"]

    API1 & API2 & API3 -->|OAuth Token| Google["🔵 Google OAuth<br/>- Authentication<br/>- User Profile"]

    API1 & API2 & API3 -->|OAuth Token| Microsoft["🔵 Microsoft OAuth<br/>- Authentication<br/>- User Profile"]

    API1 & API2 & API3 -->|HTTP GET| TMDB["🎬 TMDB API<br/>- Film Metadata<br/>- Posters<br/>- Descriptions"]

    API1 & API2 & API3 -->|Events| Monitoring["📊 MONITORING STACK"]

    Monitoring -->|Scrape Metrics| Prometheus["📈 Prometheus<br/>- Time-series DB<br/>- Metrics Collection"]

    Prometheus -->|Query| Grafana["📊 Grafana<br/>- Real-time Dashboards<br/>- Alerts"]

    Monitoring -->|Log Shipping| ELK["🔍 ELK Stack<br/>- Elasticsearch<br/>- Logstash<br/>- Kibana"]

    Monitoring -->|Error Tracking| Sentry2["🚨 Sentry<br/>- Exception Tracking<br/>- Stack Traces"]

    style Users fill:#e3f2fd
    style CDN fill:#fff3e0
    style LB fill:#e8f5e9
    style API1 fill:#f3e5f5
    style API2 fill:#f3e5f5
    style API3 fill:#f3e5f5
    style Services fill:#f8bbd0
    style Data fill:#e0f2f1
    style MySQL fill:#ffe0b2
    style Redis fill:#fce4ec
    style MySQLReplica fill:#ffe0b2
    style Backup fill:#fff9c4
    style Monitoring fill:#ffccbc
```

---

## Backend Stack Details

### ASP.NET Core 9 Architecture

```mermaid
graph TD
    Request["📨 HTTP Request<br/>GET /api/films<br/>Authorization: Bearer token"]

    Request -->|Route| Controller["🎯 Controller<br/>FilmController.cs<br/>- Route Mapping<br/>- Auth Check<br/>- Validation"]

    Controller -->|Dependency Injection| Service["⚙️ Service Layer<br/>IFilmService<br/>- Business Logic<br/>- Rules<br/>- Transactions"]

    Service -->|LINQ Query| EFCore["📊 EF Core<br/>DbContext<br/>- Query Building<br/>- Lazy Loading<br/>- Change Tracking"]

    EFCore -->|Compiled Query| MySQL["💾 MySQL<br/>SELECT * FROM Film<br/>WHERE status='ACTIVE'"]

    MySQL -->|Result Set| EFCore
    EFCore -->|Entities| Service
    Service -->|Data| Mapper["🔄 AutoMapper<br/>Entity → DTO"]
    Mapper -->|Serialized| Response["📤 HTTP Response<br/>200 OK<br/>Content-Type: json<br/>[{Film},{Film}]"]

    style Request fill:#e3f2fd
    style Controller fill:#f3e5f5
    style Service fill:#e8f5e9
    style EFCore fill:#f8bbd0
    style MySQL fill:#ffe0b2
    style Response fill:#c8e6c9
```

### Project Structure

```
FilmAPI/
├── 📁 Controllers/              # HTTP Endpoints
│   ├── AuthController.cs
│   ├── FilmsController.cs
│   ├── CheckoutController.cs
│   ├── AdminController.cs
│   └── AnalyticsController.cs
│
├── 📁 Services/                 # Business Logic
│   ├── AuthService.cs
│   ├── CheckoutService.cs
│   ├── PricingService.cs
│   ├── StripePaymentGateway.cs
│   ├── QRService.cs
│   ├── PDFService.cs
│   └── EmailService.cs
│
├── 📁 Model/                    # Domain Models
│   ├── User.cs
│   ├── Film.cs
│   ├── Show.cs
│   ├── Ordine.cs
│   ├── Biglietto.cs
│   └── SalaPosto.cs
│
├── 📁 DTOs/                     # Data Transfer Objects
│   ├── FilmDTO.cs
│   ├── CreateOrderRequest.cs
│   ├── OrderResponse.cs
│   └── PaymentRequest.cs
│
├── 📁 Data/                     # EF Core Context
│   ├── FilmDbContext.cs
│   └── Migrations/
│       ├── Migration001_Initial.cs
│       ├── Migration002_AddAuth.cs
│       └── Migration071_AddAudit.cs
│
├── 📁 Middleware/               # HTTP Middleware
│   ├── ExceptionHandling.cs
│   ├── RateLimiting.cs
│   ├── RequestLogging.cs
│   └── CorsPolicy.cs
│
├── 📁 Security/                 # Auth & Encryption
│   ├── JwtTokenHandler.cs
│   ├── PasswordHasher.cs
│   ├── OAuthProvider.cs
│   └── ColumnEncryption.cs
│
├── 📁 Background/               # Background Services
│   ├── ExpiredHoldCleanupService.cs
│   ├── RefreshTokenCleanupService.cs
│   ├── ShippingTrackerService.cs
│   └── DailyReportService.cs
│
├── 📁 Validators/               # Input Validation
│   ├── RegisterUserValidator.cs
│   ├── CreateOrderValidator.cs
│   └── PaymentValidator.cs
│
├── 📁 Exceptions/               # Custom Exceptions
│   ├── TicketNotFoundException.cs
│   ├── PaymentFailedException.cs
│   ├── HoldExpiredException.cs
│   └── InsufficientCreditException.cs
│
└── Program.cs                   # Entry Point & DI Setup
    ├── AddServices()
    ├── AddDatabase()
    ├── AddAuthentication()
    ├── AddStripePayment()
    └── Configure()
```

---

## Frontend Technology Stack

### React Component Architecture

```mermaid
graph TD
    App["🎬 App.tsx<br/>Root Component"]

    App -->|Router| Home["🏠 HomePage<br/>- Featured Films<br/>- Search Bar<br/>- Filter"]

    App -->|Router| FilmList["🎞️ FilmsPage<br/>- All Films List<br/>- Pagination<br/>- Sorting"]

    App -->|Router| Shows["📺 ShowsPage<br/>- Select Cinema<br/>- Select Date<br/>- Show Times"]

    App -->|Router| Checkout["🛒 CheckoutPage<br/>- Seat Map<br/>- Payment Form<br/>- Order Summary"]

    App -->|Router| Admin["👨‍💻 AdminDashboard<br/>- Films CRUD<br/>- Shows CRUD<br/>- Analytics"]

    App -->|Router| Scanner["📱 ScannerPage<br/>- Camera Access<br/>- QR Detection<br/>- Validation"]

    Home & FilmList & Shows -->|useContext| AuthState["🔐 Auth Context<br/>- User Info<br/>- Token<br/>- Login/Logout"]

    Checkout & Admin -->|useContext| AuthState

    Shows -->|useState| SeatState["🪑 Seat State<br/>- Selected Seats<br/>- Hold Token<br/>- Timer"]

    Checkout -->|useState| PaymentState["💳 Payment State<br/>- Payment Method<br/>- Processing<br/>- Error"]

    Shows -->|useEffect| API["📡 API Hook<br/>fetch /api/shows<br/>GET /api/seat-map"]

    Checkout -->|useEffect| StripeHook["💳 Stripe Hook<br/>loadStripe()<br/>Elements()"]

    Home & FilmList & Shows -->|axios| Backend["🔧 Backend API<br/>REST Endpoints"]

    style App fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style AuthState fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style SeatState fill:#f8bbd0,stroke:#c2185b,stroke-width:2px
    style PaymentState fill:#fff3e0,stroke:#f57f17,stroke-width:2px
    style Backend fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
```

### UI Component Library

```mermaid
graph TB
    Tailwind["🎨 Tailwind CSS<br/>Utility-first Framework"]

    Tailwind -->|Components|
    Button["🔘 Button<br/>- Primary<br/>- Secondary<br/>- Loading"]

    Tailwind -->|Components|
    Card["📇 Card<br/>- Film Card<br/>- Show Card<br/>- Order Card"]

    Tailwind -->|Components|
    Modal["🪟 Modal<br/>- Confirm<br/>- Error<br/>- Success"]

    Tailwind -->|Components|
    Form["📝 Form<br/>- Input<br/>- Textarea<br/>- Select"]

    Tailwind -->|Components|
    Nav["🧭 Navigation<br/>- Header<br/>- Sidebar<br/>- Footer"]

    Tailwind -->|Utilities|
    Responsive["📱 Responsive<br/>- sm: 640px<br/>- md: 768px<br/>- lg: 1024px"]

    style Tailwind fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style Button fill:#c8e6c9
    style Card fill:#c8e6c9
    style Modal fill:#bbdefb
    style Form fill:#f8bbd0
    style Nav fill:#b3e5fc
    style Responsive fill:#ffe0b2
```

---

## Database Technology

### MySQL Data Model

```
DATABASE: FilmDB
├── TABLES: 39
├── STORAGE ENGINE: InnoDB (ACID compliant)
├── CHARACTER SET: utf8mb4 (emoji support)
└── INDEXES: 20+

KEY TABLES:

Users (Primary)
├── PK: id
├── UNIQUE: email
├── INDEX: ruolo
└── FOREIGN KEYS: cinemaPreferito_id

Films (Content)
├── PK: id
├── UNIQUE: codiceIMDB
├── INDEX: regista_id
└── JSON: metadata

Shows (Events)
├── PK: id
├── COMPOSITE INDEX: cinema_id, sala_id, startAt
├── FK: film_id, sala_id
└── FULL-TEXT INDEX: descrizione

Ordini (Orders)
├── PK: id
├── UNIQUE: codiceOrdine
├── UNIQUE: idempotencyKey
├── COMPOSITE INDEX: user_id, createdAt
└── FOREIGN KEYS: user_id, show_id

Biglietti (Tickets)
├── PK: id
├── UNIQUE: codiceBiglietto
├── INDEX: qrCodePayload
├── FK: ordine_id, user_id, show_id
└── FULL-TEXT: codiceBiglietto

ShowPostoStato (Seat Status)
├── COMPOSITE PK: show_id, salaPosto_id
├── INDEX: holdTokenExpiry
└── STATES: AVAILABLE, HOLD, SOLD

AuditLog (Compliance)
├── PK: id
├── INDEX: user_id, entityType, createdAt
└── IMMUTABLE: append-only
```

### Query Performance Optimization

```mermaid
graph TB
    Query["❌ SLOW QUERY<br/>SELECT * FROM Ordini o<br/>JOIN Biglietti b ON o.id = b.ordine_id<br/>JOIN Shows s ON s.id = o.show_id<br/>WHERE o.user_id = 123<br/>Execution Time: 2500ms"]

    Query -->|Problem| Problem["📊 Missing Indexes<br/>- No FK index on Biglietti.ordine_id<br/>- No index on Shows.id<br/>- Table scan on 50K rows"]

    Problem -->|Solution| Solution["✅ ADD INDEXES<br/>CREATE INDEX idx_biglietti_ordine<br/>ON Biglietti(ordine_id);<br/><br/>CREATE INDEX idx_shows_pk<br/>ON Shows(id);"]

    Solution -->|Result| Optimized["✅ OPTIMIZED QUERY<br/>Same query<br/>Execution Time: 45ms<br/>Improvement: 55x faster!"]

    Solution -->|Alternative| Join["✅ OPTIMIZE JOIN<br/>Use COMPOSITE INDEX<br/>(ordine_id, user_id)<br/>Execution Time: 28ms"]

    style Query fill:#ef9a9a,stroke:#c62828,stroke-width:2px
    style Optimized fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style Join fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
```

---

## Caching Strategy

### Multi-Layer Cache

```mermaid
graph TD
    Request["📨 Request<br/>GET /api/films"]

    Request -->|Check| L1["🚀 Redis Cache<br/>TTL: 5 minutes<br/>Key: films:all<br/>Size: 2MB"]

    L1 -->|HIT| Return1["✅ Return Cached<br/>45ms response<br/>Zero DB hit"]

    L1 -->|MISS| L2["💾 Database Query<br/>SELECT * FROM Films<br/>1500ms execution"]

    L2 -->|Result| Cache["💾 Store in Redis<br/>SET films:all<br/>EX 300"]

    Cache -->|Return| Return2["✅ Return Fresh Data<br/>1500ms response"]

    Return1 -->|Next Request| L1
    Return2 -->|Next Request| L1

    Invalidate["🔄 Cache Invalidation<br/>- On POST /films (admin)<br/>- On PUT /films/:id<br/>- Scheduled cleanup"]

    style L1 fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    style L2 fill:#ffe0b2,stroke:#f57f17,stroke-width:2px
    style Return1 fill:#c8e6c9
    style Return2 fill:#c8e6c9
```

### Cache Invalidation Patterns

| Pattern | Trigger | TTL | Use Case |
|---------|---------|-----|----------|
| **Time-based** | 5 minutes | Automatic | Films list, Shows |
| **Event-based** | Data change | N/A | Seat map, Order status |
| **Manual** | Admin action | N/A | Emergency purge |
| **LRU** | Memory limit | N/A | Redis eviction |

---

## Payment Integration

### Stripe SDK Integration

```mermaid
graph TD
    Start["💳 User Checkout"]

    Start -->|Step 1| Intent["Create PaymentIntent<br/>const intent = await stripe.<br/>paymentIntents.create({<br/>amount: 3450,<br/>currency: 'eur',<br/>idempotencyKey: uuid<br/>})"]

    Intent -->|Step 2| ClientSecret["Get Client Secret<br/>clientSecret = intent.<br/>client_secret"]

    ClientSecret -->|Step 3| UISetup["Setup Stripe.js<br/>const elements = stripe.<br/>elements()<br/>cardElement = elements.<br/>create('card')"]

    UISetup -->|Step 4| Mount["Mount Element<br/>cardElement.mount<br/>('#card-element')"]

    Mount -->|Step 5| CardInput["👤 User Enters Card<br/>- Number<br/>- Expiry<br/>- CVC"]

    CardInput -->|Step 6| Confirm["Confirm Payment<br/>const result = await<br/>stripe.confirmCardPayment<br/>(clientSecret, {<br/>payment_method: {<br/>card: cardElement<br/>}})"]

    Confirm -->|3DS Challenge?| 3DS["🔐 3D Secure<br/>Bank sends challenge<br/>User completes auth"]

    3DS -->|Success| Success["✅ Payment Successful<br/>result.paymentIntent.<br/>status = 'succeeded'"]

    Confirm -->|No 3DS| Success

    Success -->|Webhook| Backend["🔧 Backend Webhook<br/>charge.succeeded<br/>Update Order: PAID<br/>Generate Tickets"]

    style Start fill:#e3f2fd
    style Intent fill:#fff3e0
    style UISetup fill:#f8bbd0
    style CardInput fill:#f8bbd0
    style 3DS fill:#ffe0b2,stroke:#f57f17,stroke-width:2px
    style Success fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style Backend fill:#e8f5e9
```

---

## Deployment & DevOps

### CI/CD Pipeline

```mermaid
graph LR
    Push["📤 Git Push<br/>Commit to main"]

    Push -->|Webhook| Trigger["⚡ GitHub Actions<br/>Event: push"]

    Trigger -->|Step 1| Checkout["📥 Checkout Code<br/>git clone"]

    Checkout -->|Step 2| Restore["📦 Restore Packages<br/>dotnet restore<br/>npm install"]

    Restore -->|Step 3| Build["🔨 Build<br/>dotnet build<br/>npm run build"]

    Build -->|Step 4| Test["🧪 Test<br/>dotnet test<br/>Jest tests<br/>Coverage: 85%"]

    Test -->|Step 5| SonarQube["🔍 Code Quality<br/>SonarQube scan<br/>Security check"]

    SonarQube -->|Step 6| Docker["🐳 Docker Build<br/>docker build -t<br/>cinema67:latest<br/>Push to registry"]

    Docker -->|Step 7| Deploy["🚀 Deploy<br/>docker-compose up<br/>Staging → Production"]

    Deploy -->|Step 8| Smoke["✓ Smoke Tests<br/>curl /api/health<br/>Check endpoints"]

    Smoke -->|Success| Complete["✅ Deployment Complete<br/>New version live"]

    Smoke -->|Failure| Rollback["↩️ Rollback<br/>docker stop<br/>Previous version"]

    Complete -->|Monitoring| Metrics["📊 Monitor Metrics<br/>- CPU: 25%<br/>- Memory: 400MB<br/>- Requests: 450/s"]

    style Push fill:#e3f2fd
    style Trigger fill:#fff3e0
    style Complete fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style Rollback fill:#ef9a9a,stroke:#c62828,stroke-width:2px
```

### Docker Configuration

```yaml
version: '3.8'

services:
  api:
    build: ./backend
    image: cinema67:latest
    container_name: api
    ports:
      - "5000:5000"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=...
      - Stripe__SecretKey=${STRIPE_SECRET}
    depends_on:
      - mysql
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    image: cinema67-web:latest
    container_name: web
    ports:
      - "3000:3000"
    depends_on:
      - api

  mysql:
    image: mysql:8.0
    container_name: db
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASS}
    healthcheck:
      test: ["CMD", "mysqladmin", "ping"]

  redis:
    image: redis:7-alpine
    container_name: cache
    ports:
      - "6379:6379"

  nginx:
    image: nginx:latest
    container_name: proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

---

## Performance Benchmarks

### Load Testing Results

```mermaid
graph TB
    Load["📊 Load Test<br/>1000 concurrent users<br/>100 requests/second<br/>Duration: 5 minutes"]

    Load -->|API Endpoint| Endpoint1["GET /api/films<br/>Response Time:<br/>- Avg: 143ms<br/>- P95: 287ms<br/>- P99: 450ms<br/>- Status: ✓ PASS"]

    Load -->|Checkout| Endpoint2["POST /checkout/orders<br/>Response Time:<br/>- Avg: 487ms<br/>- P95: 1250ms<br/>- P99: 2100ms<br/>- Status: ✓ PASS"]

    Load -->|QR Scan| Endpoint3["POST /validate<br/>Response Time:<br/>- Avg: 87ms<br/>- P95: 156ms<br/>- P99: 234ms<br/>- Status: ✓ PASS"]

    Endpoint1 & Endpoint2 & Endpoint3 -->|Resource| CPU["💻 CPU Usage<br/>Peak: 45%<br/>Average: 28%<br/>Headroom: 55%"]

    Endpoint1 & Endpoint2 & Endpoint3 -->|Resource| Memory["💾 Memory<br/>Peak: 680MB<br/>Average: 520MB<br/>Limit: 2GB"]

    Endpoint1 & Endpoint2 & Endpoint3 -->|Resource| DB["🗄️ Database<br/>Query Time: <50ms<br/>Connections: 42/50<br/>Status: Healthy"]

    CPU & Memory & DB -->|Result| Conclusion["✅ PASSED<br/>System can handle<br/>1000+ concurrent users<br/>Ready for production"]

    style Load fill:#fff3e0,stroke:#f57f17,stroke-width:2px
    style Endpoint1 fill:#c8e6c9
    style Endpoint2 fill:#c8e6c9
    style Endpoint3 fill:#c8e6c9
    style Conclusion fill:#bbdefb,stroke:#1976d2,stroke-width:2px
```

### Scalability Strategy

```mermaid
graph TD
    Current["📈 Current Load<br/>500 concurrent users<br/>- 3 API instances<br/>- Single MySQL<br/>- Single Redis"]

    Growth["📊 Expected Growth<br/>Year 2: 2,000 users<br/>Year 3: 5,000 users"]

    Current -->|Scaling Plan| Horizontal["📤 Horizontal Scaling<br/>- Add API instances (3→5)<br/>- MySQL read replicas<br/>- Redis cluster<br/>- CDN for static assets"]

    Horizontal -->|Monitoring| Health["📊 Health Check<br/>- CPU < 60%<br/>- Memory < 70%<br/>- DB connections < 80%"]

    Health -->|Pass| Scale["✅ Scale Up<br/>Auto-add resources"]

    Health -->|Alert| Fail["⚠️ Alert<br/>Manual intervention"]

    Growth -->|Year 3| Vertical["📈 Vertical Scaling<br/>- Upgrade server specs<br/>- Larger MySQL instance<br/>- Better network"]

    style Current fill:#e3f2fd
    style Horizontal fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style Vertical fill:#bbdefb,stroke:#1976d2,stroke-width:2px
```

---

## Security Stack

### Security Layers in Tech Stack

```mermaid
graph TB
    subgraph Layer1["🔐 NETWORK SECURITY"]
        TLS["🔒 TLS 1.3<br/>All traffic encrypted<br/>256-bit keys"]
        WAF["🛡️ Cloudflare WAF<br/>- SQLi prevention<br/>- XSS blocking<br/>- DDoS mitigation"]
        Firewall["🧱 AWS Security Group<br/>- Whitelist IPs<br/>- Port restrictions"]
    end

    subgraph Layer2["🔐 APP SECURITY"]
        JWT["🔑 JWT Tokens<br/>- 15 min expiry<br/>- HS256 signing<br/>- Claims-based"]
        RBAC["👥 RBAC<br/>- 6 roles<br/>- Granular perms<br/>- Role-based auth"]
        Validation["✓ Input Validation<br/>- FluentValidation<br/>- Type safety (C#)<br/>- Whitelist patterns"]
    end

    subgraph Layer3["🔐 DATA SECURITY"]
        Encrypt["🔐 Encryption<br/>- AES-256 (DB)<br/>- Bcrypt pwd<br/>- TLS in transit"]
        GDPR["📋 GDPR<br/>- Data export<br/>- Account delete<br/>- Consent mgmt"]
    end

    subgraph Layer4["🔐 MONITORING"]
        Audit["📝 Audit Logging<br/>- Every action<br/>- Immutable log<br/>- Timestamp+user"]
        Sentry["🚨 Error Tracking<br/>- Exception logs<br/>- Stack traces<br/>- Context info"]
    end

    TLS & WAF & Firewall -->|Protect| JWT
    JWT & RBAC & Validation -->|Protect| Encrypt
    Encrypt & GDPR -->|Protect| Audit
    Sentry -->|Monitor| Audit

    style Layer1 fill:#ffebee,stroke:#c62828,stroke-width:2px
    style Layer2 fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    style Layer3 fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    style Layer4 fill:#fff3e0,stroke:#e65100,stroke-width:2px
```

---

## Technology Comparison Matrix

### .NET vs Alternatives

| Aspect | ASP.NET Core | Node.js | Python/Django | Java Spring |
|--------|------------|---------|---------------|------------|
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Type Safety** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Learning Curve** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Ecosystem** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Async/Await** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Database Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Community** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Enterprise Ready** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Why ASP.NET Core Was Chosen

1. **C# Type Safety** - Catch bugs at compile time, not runtime
2. **Entity Framework Core** - Powerful ORM with LINQ
3. **Async/Await** - Built-in for scalable APIs
4. **Dependency Injection** - Enterprise patterns out-of-box
5. **Performance** - ~10x faster than Node.js in benchmarks
6. **Cross-platform** - Linux, Windows, macOS support
7. **Azure Integration** - Seamless cloud deployment
8. **Microsoft Support** - Enterprise backing and LTS

---

## Technology Timeline & Roadmap

### Current Version (v5.0)

✅ **Implemented:**
- ASP.NET Core 9
- React 18
- MySQL 8.0
- Redis 7
- Stripe Payment
- JWT Authentication
- QR Code Generation
- PDF Reporting

### Planned (v6.0 - Q3 2026)

🔜 **Coming Soon:**
- Native mobile apps (React Native)
- GraphQL API alongside REST
- Kafka event streaming
- Machine learning recommendations
- Blockchain ticket verification
- AR cinema experience

### Future (v7.0+ - 2027)

🚀 **Future Vision:**
- AI-powered pricing optimization
- Metaverse cinema experience
- NFT collectible tickets
- Quantum-safe cryptography
- Decentralized ticketing network

---

## Cost of Technology Stack

### Software Licenses (Annual)

| Technology | License Type | Cost (Annual) | Notes |
|-----------|--------------|--------------|-------|
| **ASP.NET Core** | MIT/Free | €0 | Open source |
| **C# Compiler** | Free | €0 | Roslyn open source |
| **Entity Framework** | MIT/Free | €0 | Open source |
| **React** | MIT/Free | €0 | Open source |
| **Tailwind CSS** | MIT/Free | €0 | Open source |
| **MySQL** | Open source | €0 | GPL license |
| **Redis** | Open source | €0 | BSD license |
| **Docker** | Community | €0 | Free tier |
| **GitHub Actions** | Included | €0 | Free for public repos |
| **Nginx** | Open source | €0 | BSD license |
| **TOTAL** | **100% Open Source** | **€0** | **Zero licensing costs!** |

### Infrastructure Costs (Monthly)

| Service | Provider | Cost | Details |
|---------|----------|------|---------|
| **Compute** | AWS/Azure | €450 | 3 instances + LB |
| **Database** | AWS RDS | €200 | MySQL + backup |
| **Cache** | AWS ElastiCache | €50 | Redis cluster |
| **CDN** | Cloudflare | €50 | DDoS + caching |
| **TOTAL** | | **€750** | **€9,000/year** |

---

## 🎯 Technology Stack Summary

```mermaid
mindmap
  root((Cinema67<br/>Tech Stack))
    Backend
      ASP.NET Core 9
        C# 13
        Entity Framework Core
        REST API
      Services
        Auth
        Payment
        Email
        PDF/QR
    Frontend
      React 18
        Tailwind CSS
        Axios
        Redux
      Browser APIs
        Camera (QR)
        LocalStorage
        Geolocation
    Database
      MySQL 8.0
        39 tables
        ACID compliant
        Encrypted
      Redis Cluster
        Sessions
        Caching
        Rate limiting
    External APIs
      Stripe
        Payments
        Webhooks
      OAuth 2.0
        Google
        Microsoft
      TMDB
        Film metadata
    DevOps
      Docker
        Containerization
        Compose
      GitHub Actions
        CI/CD
        Automated testing
      Nginx
        Load balancer
        Reverse proxy
    Monitoring
      Prometheus
        Metrics
      Grafana
        Dashboards
      ELK Stack
        Logging
      Sentry
        Error tracking
```

---

**Cinema67 v5.0** | Complete Tech Stack Deep Dive | 🎬
