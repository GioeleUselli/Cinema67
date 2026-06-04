# Cinema67 — Piattaforma Completa per la Gestione del Cinema

## Panoramica

Cinema67 è una piattaforma web full-stack per la gestione completa di un cinema multisala. Copre l'intero ciclo di vita: dalla programmazione dei film alla vendita biglietti, dall'e-commerce di merchandise al sistema di membership con carta fedeltà, fino alla gestione di rimborsi automatici e comunicazioni email. L'applicazione è deployata su Azure Container Apps con CI/CD automatizzato via GitHub Actions.

- **Frontend:** `www.cinema67.it` — SPA in vanilla JavaScript + Tailwind CSS
- **Backend API:** `api.cinema67.it` — ASP.NET 9 Minimal API
- **Database:** MariaDB containerizzato
- **Infrastruttura:** Azure Container Apps, Azure Container Registry, Azure File Share

---

## Indice

1. [Autenticazione e Sicurezza](#1-autenticazione-e-sicurezza)
2. [Gestione Film e Programmazione](#2-gestione-film-e-programmazione)
3. [Sistema Biglietti e Posti](#3-sistema-biglietti-e-posti)
4. [E-Commerce — Shop Merchandise](#4-e-commerce--shop-merchandise)
5. [Gift Card Digitali](#5-gift-card-digitali)
6. [Sistema Pagamenti](#6-sistema-pagamenti)
7. [Membership e Carta Fedeltà](#7-membership-e-carta-fedeltà)
8. [Feste ed Eventi Privati](#8-feste-ed-eventi-privati)
9. [Sistema Rimborsi](#9-sistema-rimborsi)
10. [Sistema Email](#10-sistema-email)
11. [Newsletter e Promozioni](#11-newsletter-e-promozioni)
12. [Esperienza Multi-Dispositivo](#12-esperienza-multi-dispositivo)
13. [Tema e Accessibilità](#13-tema-e-accessibilità)
14. [Infrastruttura e DevOps](#14-infrastruttura-e-devops)
15. [Stack Tecnologico](#15-stack-tecnologico)

---

## 1. Autenticazione e Sicurezza

### Multi-Provider OAuth
- **Login con email/password** con hash BCrypt e validazione lato client/server
- **Google OAuth 2.0** — autenticazione tramite account Google con verifica email
- **Microsoft OAuth 2.0** — autenticazione tramite account Microsoft (Azure AD / personale)
- **Flusso stateless** — i token JWT passano direttamente via URL redirect, eliminando la necessità di un dizionario in memoria che si azzerava ad ogni restart del container

### JWT e Refresh Token
- Access token JWT con scadenza 15 minuti (firmato HMAC-SHA256)
- Refresh token persistente su database con scadenza 30 giorni
- Rinnovo automatico trasparente: se l'access token scade, il frontend chiama automaticamente `/auth/refresh`

### Protezione Route
- **Route Guard** lato frontend: ogni pagina ha una lista di ruoli autorizzati
- **Policy-based authorization** lato backend: `Authenticated`, `PowerUserOrAdmin`, `CinemaStaffOrPowerUserOrAdmin`, `Admin`
- Reindirizzamento automatico alla login se non autenticato, con parametro `redirect` per tornare alla pagina originale

### Sessioni Multi-Tab
- I token sono salvati in `sessionStorage` (non `localStorage`) per isolare le sessioni tra tab diverse
- Ogni tab del browser può avere un account diverso senza interferenze
- Ideale per testare simultaneamente account admin e utente normale

### GDPR e Privacy
- Sistema di **anonymization** account con `AnonymizedAtUtc`
- **Account Action Tokens** per esportazione dati e cancellazione account
- Conferme via email con link monouso

---

## 2. Gestione Film e Programmazione

### Catalogo Film
- CRUD completo film con dettagli: titolo, descrizione, durata, cast, regista, data rilascio
- Copertine film caricate tramite sistema media
- **Import da TMDB** — ricerca film su The Movie Database e import automatico con:
  - Titolo, descrizione, poster, cast, regista, data rilascio, durata
  - Mappatura automatica regista → database locale
  - Evita duplicati tramite `TmdbId`

### Programmazione Spettacoli
- Creazione proiezioni con: cinema, sala, film, data/ora, prezzo base, supplemento sala
- **Mappa posti interattiva** per ogni sala con selezione visiva
- **Hold temporaneo** dei posti selezionati (timeout configurabile, default 4 minuti)
- **Idempotenza checkout** — `IdempotencyKey` previene doppi ordini

### Sale e Cinema
- Gestione multisala con posti numerati (fila + numero)
- Posti per disabili (`IsWheelchair`)
- Sale con capienza, supplemento, tipo sala
- Cinema con indirizzo, CAP, coordinate geografiche

### Sistema Recensioni
- Recensioni testuali con voto (1-5) associate ai film
- Flusso di approvazione: moderazione admin prima della pubblicazione
- Recensioni pubbliche visibili nella scheda film

---

## 3. Sistema Biglietti e Posti

### Checkout Biglietti
- **Voucher code** per biglietti gratuiti (riscattabili dai premi membership)
- **Codici sconto** da tre fonti:
  - `MerchDiscountCodes` — creati dall'admin (percentuale o fisso)
  - `Promotions` — promozioni attive con validità temporale e limite utilizzi
  - `NewsletterSubscribers` — sconto 15% al primo acquisto per iscritti newsletter
- Calcolo automatico sconto e applicazione all'ordine

### Tipi Biglietto
- Intero, Ridotto, Bambino, Over 65, Militare, Gruppo
- Prezzo calcolato dinamicamente in base al tipo biglietto

### Emissione e Validazione
- **QR Code** univoco per ogni biglietto
- **Validazione all'ingresso** tramite scansione QR (pannello staff)
- **PDF multipagina** generato con QuestPDF e inviato via email
- Biglietti visualizzabili nel profilo utente e recuperabili

---

## 4. E-Commerce — Shop Merchandise

### Catalogo Prodotti
- CRUD prodotti merch con: nome, descrizione, prezzo, categoria, stock
- **Immagini multiple** per prodotto con upload e ordinamento
- **Varianti** (colore, taglia) con stock e prezzo indipendenti
- Categorie: Abbigliamento, Poster, Gadget, Collezionabili

### Carrello Sincronizzato
- **Server-side** — il carrello è salvato nel database (`UserCartItems`)
- **Cross-device** — apri il carrello su un dispositivo e lo ritrovi su un altro con lo stesso account
- **LocalStorage** come cache locale per accesso offline/non autenticato
- Sincronizzazione automatica: all'apertura della pagina, il carrello viene caricato dal server come fonte primaria

### Checkout Merch
- **Ritiro al cinema** o **spedizione a casa** con tracking
- Calcolo costi spedizione e tempi di consegna stimati
- Codici sconto applicabili anche al carrello merch
- **Stripe Checkout** hosted per pagamento sicuro con carta

### Gestione Ordini
- Dashboard admin con tutti gli ordini, filtrabili per stato
- **Stato spedizione**: Pending, Processing, Shipped, Delivered, Cancelled
- Tracking number e corriere
- Sistema **Pacchi**: ogni ordine può generare più pacchi tracciati singolarmente
- QR code per ogni pacco per facilitare la logistica di magazzino

---

## 5. Gift Card Digitali

### Acquisto
- **Valori flessibili**: €25, €50, €100 o importo personalizzato (€5-€500)
- **Quantità multiple** in un singolo acquisto (max 10)
- **Invio programmato**: data e ora specifica per l'invio email
- **Messaggio personalizzato** e **email destinatario**
- Metodi pagamento: Credito prepagato, Carta (Stripe), Misto, PayPal

### Riscatto
- Inserimento codice gift card nell'apposita pagina
- Accredito immediato sul saldo credito dell'utente
- Storico gift card nel profilo: ricevute, riscattate, saldo residuo

### Carrello Gift Card
- **Multi-acquisto** con carrello dedicato (diversi importi e destinatari)
- **Sincronizzato server-side** come il carrello merch
- Salvataggio carrello in `GiftCardCartJson` (JSON column su Users) per persistenza cross-device
- Codici sconto applicabili anche alle gift card

### Sicurezza
- Codice gift card generato con collision avoidance (retry se già esistente)
- Data scadenza 1 anno dall'acquisto
- Disattivazione admin in caso di frode

---

## 6. Sistema Pagamenti

### Stripe (Live)
- **Chiavi Live** (`sk_live_` / `pk_live_`)
- **Payment Intent** per pagamenti diretti con carta
- **Checkout Session** hosted per pagamenti sicuri (reindirizzamento a Stripe)
- **Webhook** per conferma pagamento asincrona
- **Rimborsi** automatici e manuali via `CreateRefundAsync`
- Idempotency key per prevenire doppi addebiti

### PayPal (Sandbox)
- **Orders API v2** per creazione e capture pagamenti
- Flusso: creazione ordine → redirect a PayPal → conferma → capture
- Supporto sandbox per testing con credenziali dedicate
- Client ID e Secret configurabili via environment variables

### Credito Prepagato
- **Ricarica credito** tramite pannello admin/staff con storico movimenti
- Utilizzabile per acquisti biglietti, gift card, membership, feste, merch
- **Saldo sempre visibile** nella navbar e nel profilo
- Storico movimenti (`MovimentiCredito`) con: tipo, importo, saldo pre/post, note

### Metodo Misto
- Pagamento combinato: parte in credito + parte con carta
- L'importo credito viene **riservato** durante il checkout (previene spese doppie)
- Rilascio automatico se il checkout scade o viene annullato

---

## 7. Membership e Carta Fedeltà

### Tier System
- **4 livelli progressivi**: Base → Silver (500pt) → Gold (2000pt) → Platinum (5000pt)
- Moltiplicatore punti: Base 1×, Silver 1.2×, Gold 1.5×, Platinum 2×
- Progress bar verso il tier successivo con percentuale e punti mancanti

### Accumulo Punti
- Automatico ad ogni acquisto (biglietti, gift card, feste, merch)
- Punti totali (storico) e punti disponibili (spendibili)
- **Sconto compleanno** automatico: codice sconto inviato il giorno del compleanno
- **Promozioni festive** automatiche (Natale, Pasqua, Halloween, ecc.)

### Catalogo Premi
- Premi riscattabili con punti: biglietti gratis, sconto %, gift card, cibo/bevande, merchandise
- Ogni premio ha un costo in punti e una tipologia
- **Riscatto immediato**: i punti vengono scalati e il premio viene generato (codice voucher, gift card, ecc.)
- Storico riscatti nel profilo utente

### Pagamento Membership
- **Abbonamento annuale** a €9,99
- 4 metodi pagamento: Credito, Carta (Stripe), Misto, PayPal
- Rinnovo automatico con notifica email

---

## 8. Feste ed Eventi Privati

### Prenotazione
- **3 tipi evento**: MovieParty (film + sala feste), GameRoom (sala giochi), Both
- **3 pacchetti**: Basic (popcorn+bevande, 1×), Premium (torta+gadget, 1.5×), VIP (sala privata+catering, 2.5×)
- Selezione cinema, data, orario, numero ospiti (1-50)
- Richieste speciali personalizzabili
- **Calcolo prezzo dinamico**: prezzo base × ospiti × moltiplicatore pacchetto

### Gestione
- **QR Code** generato automaticamente alla conferma per l'ingresso
- **Feedback post-evento** con modulo di valutazione
- **Max 2 feste contemporanee** per cinema (controllo automatico)

### Rimborso Feste
- Alla cancellazione da parte dell'admin, **rimborso automatico**:
  - Accredito credito all'utente
  - Movimento credito tracciato (`PARTY_CANCEL_REFUND:{id}`)
  - Rimborso Stripe se pagato con carta (`pi_*`)
- **Idempotente**: non rimborsa due volte la stessa festa
- **Visibile in dashboard rimborsi** admin insieme agli show cancellati

---

## 9. Sistema Rimborsi

### Cancellazione Show
- L'admin può cancellare uno show (proiezione) con **anteprima impatto**
- **Rimborso automatico** per tutti gli ordini pagati:
  - Accredito credito sul saldo utente
  - Rimborso Stripe per la parte pagata con carta
  - Movimento credito tracciato con idempotency key

### Rimborsi Manuali
- Ricerca ordine per codice e rimborso manuale
- Motivo rimborso personalizzabile
- Supporta sia accredito credito che rimborso Stripe

### Revisioni Manuali
- Per ordini con biglietti già validati: il rimborso va in **coda di revisione**
- L'admin può approvare (`RefundFullSameMethod`) o rifiutare (`NoRefund`) manualmente

### Dashboard Rimborsi
- **Storico cancellazioni** show con: data, totale, ordini, rimborsi riusciti/falliti
- **Tabella rimborsi** con: ordine, importo, metodo, stato, data
- **Rimborsi feste** integrati nella stessa vista
- Possibilità di riprocessare rimborsi falliti e inviare email di notifica

---

## 10. Sistema Email

### Template Centralizzato
- **19 template email** unificati con `EmailTemplateHelper`
- **Design Cinema67**: header scuro, logo oro (#d4af37), card bianche, footer brandizzato
- **Dark/Light mode**: il tema segue automaticamente le preferenze del dispositivo (`prefers-color-scheme`)
- **Light mode come default** per massima compatibilità con i client email
- Compatibile con Gmail, Outlook, Apple Mail e client mobile

### Tipi di Email
| Tipo | Descrizione |
|------|-------------|
| 🎫 Conferma biglietti | PDF allegato, dettagli spettacolo, QR code |
| 🎁 Gift card | Codice, valore, mittente, messaggio, scadenza |
| 🎉 Conferma festa | QR code, data, cinema, ospiti, totale |
| ❌ Cancellazione festa | Notifica con informazioni rimborso |
| 👑 Attivazione membership | Dettagli carta, tier, punti |
| 🎂 Auguri compleanno | Codice sconto personalizzato |
| 🎄 Promozioni festive | Sconto automatico per festività |
| 📰 Newsletter | Template brandizzato con contenuto custom |
| 🔙 Rimborso show | Importo rimborsato, metodo, dettagli |
| 📦 Tracking spedizione | Link tracking, stato pacco, corriere |
| 🛒 Conferma ordine merch | Riepilogo articoli, totale, consegna |
| 🔐 Azioni account | Export dati, cancellazione account |

### Invio Non-Bloccante
- **Fire-and-forget**: l'email viene inviata in background senza bloccare la risposta HTTP
- Timeout SMTP di 10 secondi per evitare hang
- **IServiceScopeFactory** per creare scope indipendenti per l'invio asincrono
- Se l'SMTP fallisce, il pagamento NON viene bloccato

### Configurazione SMTP
- Server: `authsmtp.securemail.pro`
- Porta: `465` (SSL diretto)
- Mittente: `noreply@cinema67.it`

---

## 11. Newsletter e Promozioni

### Iscrizione
- Popup newsletter per utenti non autenticati (dopo 4 secondi)
- **Iscrizione automatica** all'attivazione della membership
- Codice sconto 15% generato automaticamente al primo acquisto
- Prevenzione doppia iscrizione

### Campagne
- Invio newsletter a tutti gli iscritti o a gruppi selezionati
- **Programmazione** invio a data/ora specifica
- Template email brandizzato Cinema67
- Storico campagne inviate

### Promozioni
- CRUD promozioni con: titolo, descrizione, immagine, date validità, sconto
- Banner promozionali nella homepage in un carosello orizzontale
- Codici sconto con limite utilizzi e tracking conteggio

---

## 12. Esperienza Multi-Dispositivo

### Carrello Cross-Device
- **Shop**: carrello salvato nel database (`UserCartItems`), sincronizzato su tutti i dispositivi
- **Gift Card**: carrello salvato come JSON nel profilo utente (`GiftCardCartJson`)
- All'apertura della pagina, il carrello viene sempre caricato dal server come fonte primaria
- **LocalStorage** usato solo come cache/fallback

### Sessioni Tab Isolate
- Token in `sessionStorage` invece di `localStorage`
- Ogni tab del browser ha la propria sessione indipendente
- Possibile essere loggati come admin in un tab e come utente in un altro
- Il logout in un tab NON influisce sugli altri tab

### Responsive Design
- **Navbar adattiva**: hamburger menu su mobile, barra completa su desktop
- **Menu mobile completo**: Acquista Gift Card, Riscatta Gift Card, Profilo, Membership, Prenotazioni, Logout
- Layout responsive su tutte le pagine (grid 1-4 colonne in base al viewport)

---

## 13. Tema e Accessibilità

### Tema Automatico
- **Rilevamento automatico** delle preferenze di sistema (`prefers-color-scheme`)
- All'apertura, l'app mostra automaticamente light o dark mode in base al dispositivo
- **Override manuale**: l'utente può cambiare tema e la scelta persiste nella sessione

### Palette Colori
| Colore | Light Mode | Dark Mode | Uso |
|--------|-----------|-----------|-----|
| Sfondo | `#fdfaf6` | `#14100c` | Pagina |
| Card | `#ffffff` | `#1c1713` | Contenitori |
| Testo | `#1c1108` | `#f0e8e0` | Testo principale |
| Muted | `#6b5a4e` | `#a89888` | Testo secondario |
| Oro | `#b8860b` | `#d4af37` | CTA, accenti |
| Rosso | `#b91c1c` | `#b91c1c` | Errori, badge |

### Toggle Password
- Icona occhio (emoji 👁/🙈) per mostrare/nascondere la password
- Funziona anche senza Font Awesome (fallback emoji)
- `onclick` diretto per massima compatibilità

---

## 14. Infrastruttura e DevOps

### Azure Container Apps
- **3 container**: `filmapi` (API), `cinema67web` (frontend), `mariadb-server` (database)
- **Custom domain** con certificato SSL: `api.cinema67.it`, `www.cinema67.it`
- **Scaling automatico**: 1-3 repliche in base al carico
- **Resource**: 2 CPU, 4 GB RAM per il backend

### Storage Persistente
- **Azure File Share** montato su `/app/wwwroot/media`
- Le immagini uploadate (merch, copertine) sopravvivono ai restart del container
- Storage account: `cinema67stg`, share: `media`

### CI/CD
- **GitHub Actions** per build e deploy automatizzato
- Build multi-stage Docker: compilazione .NET + bundle frontend
- Push su **Azure Container Registry** (`cinema67acr`)
- Deploy automatico su push al branch `main`
- Tag immagine: `filmapi:main-{sha}` e `cinema67-web:main-{sha}`

### Bootstrap Database
- All'avvio, il backend verifica lo stato del database:
  - Se mancano tabelle critiche → droppa tutto e ricrea da zero con `MigrateAsync`
  - Se tutto OK → applica solo le migrazioni pendenti
  - **Colonne mancanti** aggiunte automaticamente in modo idempotente
- **DataSeeder** resiliente: ogni step di seed è in try/catch indipendente

---

## 15. Stack Tecnologico

### Backend
| Tecnologia | Versione | Uso |
|-----------|---------|-----|
| ASP.NET Core | 9.0 | Minimal API, middleware pipeline |
| Entity Framework Core | 9.0.11 | ORM con Pomelo MySQL provider |
| MariaDB | 10.11 | Database relazionale |
| BCrypt.Net | 4.1.0 | Hash password |
| MailKit | 4.16.0 | Invio email SMTP |
| Stripe.net | 48.2.0 | Pagamenti con carta |
| QuestPDF | 2026.2.4 | Generazione PDF biglietti |
| QRCoder | 1.8.0 | Generazione QR code |
| NSwag | 14.6.3 | Documentazione API |

### Frontend
| Tecnologia | Uso |
|-----------|-----|
| Vanilla JavaScript | Logica applicativa (nessun framework) |
| Tailwind CSS (CDN) | Stili utility-first |
| Font Awesome 6.4 | Icone |
| Google Fonts | Tipografia (Space Grotesk, DM Serif Display) |
| SessionStorage | Isolamento sessioni per tab |

### DevOps
| Tecnologia | Uso |
|-----------|-----|
| Docker | Containerizzazione |
| GitHub Actions | CI/CD pipeline |
| Azure Container Registry | Registry immagini |
| Azure Container Apps | Hosting serverless |
| Azure File Share | Storage persistente |
| Puppeteer | Screenshot automatici per documentazione |
| Remotion | Video presentazione |

### API Esterne
| Servizio | Uso |
|----------|-----|
| TMDB API | Import dati film (titolo, cast, poster, descrizione) |
| Stripe API | Pagamenti live con carta di credito |
| PayPal API | Pagamenti sandbox |
| Google OAuth 2.0 | Login social |
| Microsoft Graph | Login social |
| QR Server API | Generazione QR code feste |

---

## Riepilogo Funzionalità Principali

✅ **137+ endpoint API** RESTful documentati
✅ **9 flussi di pagamento** (credito, carta, misto, PayPal × biglietti, gift card, membership, feste, merch)
✅ **19 template email** brandizzati con dark/light mode
✅ **4 livelli membership** con accumulo punti e catalogo premi
✅ **3 fonti di codici sconto** (merch, promozioni, newsletter)
✅ **Sincronizzazione carrello cross-device** (shop + gift card)
✅ **Rimborsi automatici** per show cancellati e feste cancellate
✅ **Sessioni multi-tab isolate** con sessionStorage
✅ **Tema automatico** luce/scuro in base al dispositivo
✅ **CI/CD automatizzato** con build Docker e deploy su Azure

---

*Ultimo aggiornamento: 4 Giugno 2026*
