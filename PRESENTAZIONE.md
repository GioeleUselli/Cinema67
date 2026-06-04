# Cinema67 — Testo per la Presentazione

---

## Introduzione (1 minuto)

Buongiorno a tutti. Oggi vi presento Cinema67, una piattaforma web full-stack che ho sviluppato per la gestione completa di un cinema multisala. 

L'obiettivo era creare un unico sistema che coprisse tutto il ciclo di vita del cinema: dalla programmazione dei film alla vendita biglietti, dall'e-commerce di merchandise al sistema di membership con carta fedeltà, fino alla gestione di rimborsi automatici e comunicazioni email. Il tutto deployato su cloud Azure con CI/CD automatizzato.

L'architettura si compone di tre container su Azure Container Apps: il backend API in ASP.NET 9, il frontend in vanilla JavaScript con Tailwind CSS, e il database MariaDB. Il sito è raggiungibile all'indirizzo www.cinema67.it e le API rispondono su api.cinema67.it.

---

## Autenticazione e Sicurezza (1 minuto)

Partiamo dall'accesso. La piattaforma supporta tre modalità di autenticazione: classica con email e password, e social login tramite Google OAuth 2.0 e Microsoft OAuth 2.0.

Un aspetto importante che abbiamo risolto è il flusso stateless: inizialmente usavamo un dizionario in memoria per scambiare i codici OAuth, ma ad ogni restart del container i codici venivano persi e il login falliva. Abbiamo quindi eliminato completamente lo stato lato server, passando i token JWT direttamente via URL redirect. Ora il social login funziona al primo colpo, sempre.

Il sistema JWT prevede access token con scadenza di 15 minuti e refresh token persistenti su database per 30 giorni. Il rinnovo è completamente trasparente per l'utente: quando l'access token scade, il frontend chiama automaticamente l'endpoint di refresh.

Per la sicurezza, abbiamo implementato un route guard lato frontend che verifica i permessi di ogni pagina, e policy-based authorization lato backend con quattro livelli: Authenticated, PowerUserOrAdmin, CinemaStaffOrPowerUserOrAdmin, Admin.

Una funzionalità interessante è l'isolamento delle sessioni tra tab. Abbiamo spostato i token da localStorage a sessionStorage, permettendo a ogni tab del browser di avere il proprio account. Questo significa che un amministratore può testare l'esperienza utente rimanendo loggato come admin in un tab e come utente normale in un altro, senza interferenze.

---

## Gestione Film e Programmazione (1 minuto)

Passiamo alla gestione dei contenuti. Il catalogo film offre CRUD completo con tutti i dettagli: titolo, descrizione, durata, cast, regista e data di rilascio.

La funzionalità più potente in questa sezione è l'import da TMDB, il database pubblico di film. L'admin può cercare qualsiasi film su TMDB e importarlo con un click. Il sistema importa automaticamente titolo, descrizione, poster, cast, regista, data di rilascio e durata. Se il regista non esiste nel nostro database, viene creato automaticamente. Per evitare duplicati, ogni film importato salva il suo TmdbId.

Per la programmazione, l'admin crea proiezioni associando cinema, sala, film, data e ora. Ogni proiezione ha un prezzo base e un eventuale supplemento sala. Il sistema supporta una mappa posti interattiva dove l'utente può selezionare visivamente i posti desiderati.

Abbiamo implementato un meccanismo di hold temporaneo: quando un utente seleziona dei posti, questi vengono bloccati per 4 minuti, dando il tempo di completare l'acquisto senza che altri utenti possano prenotarli. Per prevenire ordini duplicati, ogni checkout ha una chiave di idempotenza.

I biglietti emessi hanno un QR code univoco che può essere validato all'ingresso dal personale tramite scansione. I biglietti vengono anche generati in PDF multipagina con QuestPDF e inviati via email all'utente.

---

## E-Commerce — Shop Merchandise (1 minuto)

Lo shop merchandise permette di vendere prodotti brandizzati Cinema67. Il catalogo supporta prodotti con immagini multiple, varianti per taglia e colore con stock e prezzi indipendenti.

La vera innovazione qui è il carrello sincronizzato. A differenza di molti siti che salvano il carrello solo nel browser, noi lo salviamo nel database. Questo significa che se un utente aggiunge prodotti dal telefono e poi apre il sito dal computer con lo stesso account, ritrova esattamente gli stessi prodotti nel carrello. All'apertura della pagina, il carrello viene sempre caricato dal server come fonte primaria, usando localStorage solo come cache.

Il checkout supporta due modalità: ritiro al cinema o spedizione a casa con tracking. Per la spedizione, il sistema calcola automaticamente i costi e i tempi di consegna stimati. Il pagamento avviene tramite Stripe Checkout hosted, che reindirizza l'utente su una pagina sicura di Stripe per l'inserimento dei dati della carta.

La dashboard admin permette di gestire tutti gli ordini con stato spedizione, tracking number e corriere. Abbiamo anche un sistema di pacchi: ogni ordine può generare più pacchi tracciati singolarmente, ognuno con il proprio QR code per facilitare la logistica di magazzino.

---

## Gift Card Digitali (30 secondi)

Le gift card sono completamente digitali. L'utente sceglie un importo tra 25, 50, 100 euro o un valore personalizzato, può acquistare fino a 10 gift card in un unico ordine, e può programmare l'invio email a una data specifica con un messaggio personalizzato.

Anche il carrello delle gift card è sincronizzato server-side, salvato come JSON nel profilo utente per garantire la persistenza cross-device.

Il riscatto è immediato: l'utente inserisce il codice nella pagina dedicata e l'importo viene accreditato sul suo saldo. Per la sicurezza, ogni codice è generato con collision avoidance e ha una scadenza di un anno.

---

## Sistema Pagamenti (1 minuto)

Il sistema pagamenti è uno degli aspetti più complessi della piattaforma. Supportiamo quattro modalità: credito prepagato, carta di credito via Stripe, metodo misto, e PayPal.

Per Stripe utilizziamo chiavi live di produzione. Il flusso prevede Payment Intent per pagamenti diretti e Checkout Session hosted per un'esperienza più sicura. La conferma del pagamento avviene anche via webhook in modo asincrono.

PayPal è configurato in modalità sandbox per il testing, usando le Orders API v2. Il flusso completo è: creazione dell'ordine, redirect dell'utente alla pagina PayPal, conferma e capture del pagamento.

Il credito prepagato è una valuta interna alla piattaforma. L'admin può ricaricare il credito degli utenti, e ogni movimento è tracciato con tipo, importo, saldo prima e dopo l'operazione.

Una funzionalità importante è il metodo misto: se il credito non copre l'intero importo, la differenza viene addebitata sulla carta. Durante il checkout, l'importo credito viene "riservato" per prevenire che lo stesso credito venga speso due volte contemporaneamente. Se il checkout scade, il credito viene automaticamente rilasciato.

---

## Membership e Carta Fedeltà (1 minuto)

Il programma fedeltà si basa su quattro livelli progressivi: Base, Silver a 500 punti, Gold a 2000 punti e Platinum a 5000 punti. Ogni livello ha un moltiplicatore punti crescente: 1x, 1.2x, 1.5x e 2x.

I punti si accumulano automaticamente ad ogni acquisto, che siano biglietti, gift card, feste o prodotti merch. L'utente può vedere in tempo reale il suo progresso verso il livello successivo con una barra di avanzamento.

Il catalogo premi permette di riscattare punti per ottenere biglietti gratis, sconti percentuali, gift card, cibo e bevande, o prodotti merchandise. Il riscatto è immediato: i punti vengono scalati e il premio viene generato con un codice voucher univoco.

Abbiamo anche automatizzato le promozioni: ogni utente riceve un codice sconto per il compleanno, e durante le festività come Natale o Pasqua vengono inviati automaticamente sconti a tutti i membri.

Un dettaglio importante: quando un utente attiva la membership, viene automaticamente iscritto alla newsletter con un codice sconto del 15% sul primo acquisto.

---

## Feste ed Eventi Privati (1 minuto)

La piattaforma permette di prenotare feste private al cinema. Offriamo tre tipi di evento: MovieParty che include film e sala feste, GameRoom per la sala giochi, e Both che combina entrambe le esperienze.

Per ogni tipo, ci sono tre pacchetti: Basic con popcorn e bevande, Premium che aggiunge torta personalizzata e gadget, e VIP con sala privata, catering e fotografo. Ogni pacchetto ha un moltiplicatore sul prezzo base.

Il prezzo viene calcolato dinamicamente: prezzo base per persona, moltiplicato per il numero di ospiti e per il moltiplicatore del pacchetto. L'utente può aggiungere richieste speciali personalizzate.

Alla conferma, il sistema genera automaticamente un QR code per l'ingresso, e dopo l'evento viene inviata una richiesta di feedback.

Un aspetto critico che abbiamo implementato è il rimborso automatico delle feste. Quando l'admin cancella una festa, il sistema rimborsa automaticamente l'utente, accreditando il credito e, se il pagamento era stato fatto con carta, emettendo un rimborso Stripe. L'operazione è idempotente e tracciata con un codice univoco per evitare doppi rimborsi.

---

## Sistema Rimborsi (1 minuto)

Il sistema rimborsi è stato progettato per essere il più automatico possibile. Quando l'admin cancella uno show, il sistema mostra un'anteprima dell'impatto economico e poi processa automaticamente il rimborso per ogni ordine pagato: accredita il credito sul saldo utente e, per la parte pagata con carta, emette un rimborso Stripe.

Per i casi particolari, come ordini con biglietti già validati, il rimborso va in una coda di revisione manuale dove l'admin può approvarlo o rifiutarlo.

Esiste anche la possibilità di rimborsi manuali: l'admin cerca un ordine per codice e può emettere un rimborso specificando il motivo.

La dashboard rimborsi mostra uno storico completo con tutte le cancellazioni, i totali, lo stato dei rimborsi, e permette di riprocessare quelli falliti. I rimborsi delle feste sono integrati nella stessa vista, offrendo una panoramica unificata.

---

## Sistema Email (30 secondi)

Abbiamo creato 19 template email unificati con un design brandizzato Cinema67. L'header scuro con il logo dorato, le card bianche per i dettagli e il footer brandizzato sono coerenti su tutte le comunicazioni.

I template supportano automaticamente dark e light mode in base alle preferenze del dispositivo, con il light mode come default per massima compatibilità con tutti i client email.

Un aspetto tecnico importante: l'invio delle email è fire-and-forget. L'email viene spedita in background senza mai bloccare la risposta HTTP. Se l'SMTP è lento o non raggiungibile, il pagamento dell'utente non viene assolutamente rallentato.

Utilizziamo il server SMTP di Register.it sulla porta 465 con connessione SSL diretta, e il mittente è noreply@cinema67.it.

---

## Infrastruttura e DevOps (30 secondi)

Tutta l'infrastruttura gira su Azure Container Apps con tre container: il backend API, il frontend web e il database MariaDB. Abbiamo configurato domini personalizzati con certificati SSL automatici.

Il deploy è completamente automatizzato con GitHub Actions: ad ogni push sul branch main, il codice viene compilato, l'immagine Docker viene costruita, pushata su Azure Container Registry e deployata automaticamente.

Abbiamo risolto il problema della persistenza dei dati montando un Azure File Share sul container del backend. Le immagini caricate dagli utenti sopravvivono così a qualsiasi restart o rideploy.

Il database ha un sistema di bootstrap intelligente: all'avvio verifica lo stato, e se mancano tabelle critiche le ricrea da zero con tutte le migrazioni. Eventuali colonne mancanti vengono aggiunte in modo automatico e idempotente.

---

## Conclusione (30 secondi)

In sintesi, Cinema67 è una piattaforma completa che integra:
- 137 endpoint API
- 9 flussi di pagamento diversi
- 19 template email brandizzati
- 4 livelli di membership con accumulo punti
- Carrello sincronizzato cross-device
- Rimborsi automatici per show e feste
- Sessioni multi-tab isolate
- Tema automatico in base al dispositivo
- CI/CD completamente automatizzato

Lo stack tecnologico include ASP.NET 9, Entity Framework Core, MariaDB, Stripe, Docker, Azure e molto altro.

Grazie per l'attenzione. Sono a disposizione per domande e per una demo dal vivo della piattaforma.

---

*Documento generato dalla documentazione tecnica del progetto Cinema67 — Giugno 2026*
