# Piano di Lavoro - Iterazione 5

Autore: OpenCode

Documento operativo per l'evoluzione dell'autenticazione CineBase dopo il completamento dell'Iterazione 4.1.

Branch target suggerito: `dev_iteration_5`

---

## Stato Avanzamento Fasi

| Fase | Stato | Data | Note |
| --- | --- | --- | --- |
| FASE 0 - Preflight auth e mappa superfici di sicurezza | **Completata** | 2026-05-09 | Inventario completato; baseline test 198/198 PASS; trovati 3 open redirect (HIGH) in `auth.js:220`, `login.js:25`, `login.js:89-90` |
| FASE 1 - Modello dati credenziali, provider esterni e audit | **Completata** | 2026-05-09 | Migration `AddAccountSecurityAndExternalLogins`; User esteso (PasswordHash nullable, NormalizedEmail, AuthVersion, IsDisabled); 5 nuove entità; 2 nuovi enum; 198/198 PASS |
| FASE 2 - Infrastruttura email account e token temporanei | **Completata** | 2026-05-09 | `AccountTokenService` SHA-256, `AccountEmailService` SMTP, `UserSecurityAuditService`, `RedirectUrlValidator`, 29 nuovi test; 227/227 PASS |
| FASE 3 - Backend cambio password e recupero password | **Completata** | 2026-05-09 | `change-password`, `forgot-password`, `reset-password`, `set-password/request`, `security/me`; rate limiting; revoca sessioni e incremento AuthVersion; 28 nuovi test; 255/255 PASS |
| FASE 4 - Backend social login Google/Microsoft per utenti `User` | **Completata** | 2026-05-10 | OIDC Authorization Code + PKCE; Google aperto a email verificate senza vincolo dominio; Microsoft aperto ad account personali e work/school (authority `common`, `tid`/`oid`/`sub`); exchange code one-time; 20 nuovi test; 275/275 PASS; smoke test reale OK |
| FASE 5 - Backend admin utenti: creazione, invito, elevazione e hardening ruoli | **Completata** | 2026-05-10 | `IUserAdminService` esteso; `UserAdminService` con listing paginato/filtrato, inviti, cambio ruolo hardenizzato e invio setup password; `AdminInvite` supportato in `ResetPasswordAsync`; 5 endpoint admin; 30 nuovi test; 305/305 PASS |
| FASE 6 - Frontend login, recupero password e sicurezza profilo | **Completata** | 2026-05-10 | Bottoni social login/registrazione, pagine recupero/reset/social complete, sezione sicurezza account in profilo, redirect frontend sicuri; fix OIDC reali Google/Microsoft; backend 305/305 PASS; frontend build OK |
| FASE 6.1 - Fix e miglioramenti profilo, cinema preferito e UX account | **Completata** | 2026-05-10 | Recupero password anti-enumerazione rifinito; cinema preferito persistente da `my-cinemas`; profilo riorganizzato in dashboard con accordion chiusi di default; ordini/biglietti paginati; navbar Biglietti apre la sezione dedicata; backend 305/305 PASS; frontend build OK |
| FASE 7 - Frontend admin gestione utenti elevati | **Completata** | 2026-05-10 | `utenti.html` + `utenti.js` creati; tabella paginata/filtrata; modali invito PowerUser/Admin, cambio ruolo, dettaglio sicurezza; sidebar link Admin-only; route guard AdminOnly; UI theme-aware con brand token; 305/305 PASS; frontend build OK |
| FASE 7.1 - GDPR: cancellazione account, portabilità dati e anonimizzazione | **Completata** | 2026-05-10 | `AccountDeletionService` con anonimizzazione selettiva; 7 nuovi endpoint; export JSON; `AnonymizedAtUtc`; colonna Stato in `utenti.html`; pagina `conferma-cancellazione.html`; fix ExternalLogins delete + ExternalAuthService hardening; 22 nuovi test; 327/327 PASS; smoke test ri-registrazione Microsoft OK |
| FASE 7.2 - CinemaStaff scoped per cinema e permessi operativi | **Completata** | 2026-05-10 | Nuovo ruolo operativo `CinemaStaff` con `UserCinemaAssignment`; `ICinemaAccessService` per enforcement scoped; policy `CinemaStaffOrPowerUserOrAdmin`; validazione ticket, ricarica credito e show scoped per cinema; UI admin assegnazioni; route guard aggiornato; fix runtime/UX post-smoke su inviti, ruoli dinamici, redirect staff, navbar, dropdown cinema e filtro sala show; 11 nuovi test; 338/338 PASS |
| FASE 7.3 - Hardening frontend pagine protette e UX route guard | **Completata** | 2026-05-10 | `route-guard-pending`, `auth:ready`, `RouteGuard.whenReady()` e bootstrap differito di shell/API/template fino all'autorizzazione; modello template statico accettato; frontend build OK |
| FASE 7.4 - GDPR web compliance: informative legali, cookie/tecnologie e trasparenza frontend | **Completata** | 2026-05-10 | `privacy.html`, `cookie.html`, `termini-condizioni.html` creati con placeholder centralizzati (`legal-config.js`); inventario `localStorage` documentato in `cookie.html`; geolocalizzazione opt-in in `programmazione.js`, `scheda-film.js`, `my-cinemas.js`; link legali in footer, login, registrazione, pagamento; banner cookie leggero (`cookie-banner.js`); registrazione con checkbox Privacy/Termini e salvataggio versioni (`PrivacyPolicyVersion`, `TermsAcceptedVersion` etc.) su `User`; social login con interstitial se versioni non correnti; `POST /auth/me/legal-acceptance`; endpoint `POST /auth/external/exchange` restituisce `RequiresLegalAcceptance`; `/config/frontend` esteso con versioni legali; migration `AddLegalAcceptanceFields` applicata; 338/338 PASS; build OK |
| FASE 7.5 - Annullamento show, rimborsi e notifiche utenti | **Completata** | 2026-05-10 | `ShowState`, `ShowCancellation`, `OrdineRefund`, `ManualRefundReview`, `RefundStatus`; 8 endpoint `GlobalBackoffice`; `ShowCancellationService`; Stripe refund/expire/CustomerEmail prefill; `RefundPaidOrderCreditAsync` idempotente; `SendShowCancellationAsync`; blocchi acquisto/validazione su show annullati; UI `shows.html` con badge stato, modale annullamento e dettaglio cancellation/retry; `refund-review.html` workspace manuale; review post-implementazione completata con testing aggiuntivo; 370/370 PASS; rebuild test project 0 warning/0 error |
| FASE 8 - Test automatici estesi auth/security | **Completata** | 2026-05-11 | 28 nuovi test (10 CinemaStaff, 3 ExternalAuth, 3 AdminUserSecurity, 3 AccountDeletion, 3 ShowCancellation, 6 LegalAcceptance); nuovo file `LegalAcceptanceIntegrationTests.cs`; 398/398 PASS; build backend/frontend/test OK; node --check OK; grep mirati coerenti |
| FASE 9 - Smoke test runtime e verifica manuale sicurezza | **Pianificata** | - | Verifica browser completa Admin/Power/CinemaStaff/User/anonimo su UX account `FASE 6.1`, GDPR `FASE 7.1`, CinemaStaff `FASE 7.2`, route guard `FASE 7.3`, compliance web `FASE 7.4` e annullamento/rimborsi `FASE 7.5`; provider reali, Stripe test mode ed email reale dove disponibili |
| FASE 10 - Documentazione finale | **Pianificata** | - | Consolidamento finale di `status.md`, `changelog.md`, `.env.example`, tutorial social login, tutorial GDPR completo + quick reference e coerenza documentale finale con `FASE 6.1-7.5` |

---

## 1) Obiettivo Iterazione

L'Iterazione 5 consolida la gestione dell'identità e delle credenziali di CineBase introducendo:

- accesso social per utenti normali `User` tramite Google e Microsoft, con Google aperto agli account Google con email verificata e Microsoft aperto sia ad account personali Microsoft sia ad account work/school, incluso `issgreppi.it`;
- gestione completa delle credenziali locali per tutti gli utenti, inclusi `CinemaStaff`, `PowerUser` e `Admin`;
- cambio password autenticato;
- recupero password tramite email con link e token temporaneo single-use;
- strumenti amministrativi per creare o promuovere `CinemaStaff`, `PowerUser` e `Admin` senza consentire autoregistrazioni privilegiate;
- profilo operativo `CinemaStaff` per i dipendenti CineBase, con permessi espliciti per uno o più cinema senza concedere privilegi globali;
- hardening di sessioni, token, redirect, audit, cambio ruolo e cambio assegnazioni operative per cinema.

L'obiettivo non è sostituire l'RBAC esistente, ma renderlo più robusto nel momento in cui vengono aggiunti provider esterni e flussi di recupero credenziali.

## 1.1 Stato reale di partenza

Da `docs/project/status.md` e `docs/project/changelog.md`:

- Iterazione 4.1 completata al 100%.
- Backend stabile con `198/198 PASS`, `0 FAIL`, `0 SKIP`.
- Dominio legacy `Proiezione`/`Prenotazione` rimosso da runtime backend, frontend, seeder, test, snapshot EF e DB locale.
- Autenticazione attuale basata su JWT access token + refresh token opaco, con rotazione refresh token e `DeviceId`.
- Ruoli attuali: `User = 0`, `PowerUser = 1`, `Admin = 2`.
- Registrazione pubblica locale crea sempre `User`.
- Il modello ruoli attuale non distingue ancora personale operativo locale da backoffice globale: `PowerUser` ha accesso operativo globale su show, sale, catalogo, credito e validazione, mentre `Admin` aggiunge gestione utenti e CRUD cinema.
- Login locale usa email + password BCrypt.
- `PasswordHash` è attualmente obbligatoria in `User`.
- `RefreshToken` è persistito e indicizzato per token, utente e device.
- Endpoint auth esistenti:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /auth/me`
- Endpoint admin utenti esistenti:
  - `GET /admin/utenti`
  - `PUT /admin/utenti/{id}/ruolo`
- Frontend esistente:
  - `login.html` + `js/pages/login.js`
  - `registrazione.html` + `js/pages/registrazione.js`
  - `profilo.html` + `js/pages/profilo.js`
  - `auth.js`, `api.js`, `route-guard.js`, `admin-shell.js`
- Non esiste ancora una pagina frontend dedicata alla gestione utenti admin.
- `route-guard.js` valida già `?redirect=` in alcuni casi, ma `login.js` e `Auth.redirectAfterLogin()` devono essere ricontrollati per evitare qualunque open redirect residuo.
- `IEmailService` esiste per i ticket, ma è specializzato su `SendOrderTicketsAsync`; per email account conviene introdurre un servizio dedicato o estendere in modo pulito l'infrastruttura SMTP.

## 1.2 Scope dell'iterazione

### In scope

- Social login Google per utenti normali `User` con qualunque account Google per cui Google restituisca un ID token valido e il claim `email_verified = true`, senza alcun vincolo sul dominio email (`gmail.com`, `issgreppi.it` o altri domini).
- Social login Microsoft identity platform per utenti normali `User`, consentendo account personali Microsoft (`outlook.com`, `hotmail.com`, `live.com`, `live.it`, ecc.) e account work/school Microsoft Entra ID, incluso `issgreppi.it`.
- Validazione backend dei token OIDC e dei claim provider-specifici: per Google email verificata; per Microsoft issuer/audience/tenant/identificatore stabile e disponibilità di un indirizzo email utilizzabile come contatto applicativo.
- Collegamento sicuro di un provider esterno a un account `User` esistente solo dopo validazione provider-specifica dell'identità e dell'indirizzo usato per il linking.
- Autocreazione account `User` da social login se l'indirizzo applicativo non è ancora registrato e il provider soddisfa le proprie regole: email verificata per Google, identità stabile più email-like disponibile per Microsoft.
- Blocco del social login per account `CinemaStaff`, `PowerUser` e `Admin`.
- Cambio password per utenti con credenziali locali.
- Recupero password via email con token temporaneo, hashato e single-use.
- Possibilità di impostare una password locale per account social-only tramite token email.
- Revoca refresh token e invalidazione token applicativi su reset password, cambio password e cambio ruolo.
- Pagina admin `utenti.html` per creazione/invito di `CinemaStaff`/`PowerUser`/`Admin`, assegnazioni cinema staff e promozione controllata di utenti esistenti.
- Ruolo operativo `CinemaStaff` per dipendenti CineBase, assegnabile solo da `Admin`, con autorizzazioni per cinema specifici e capability distinte: validazione biglietti, ricarica credito e gestione show.
- Enforcement backend dello scope cinema per tutte le operazioni `CinemaStaff`: nessun endpoint deve fidarsi del `CinemaId` inviato dal client senza verificare l'assegnazione attiva dell'operatore.
- UI admin per assegnare, modificare, revocare e visualizzare le assegnazioni `CinemaStaff` per cinema.
- Audit delle operazioni sensibili su credenziali e ruoli.
- Cancellazione account utente con doppia conferma email (GDPR art. 17 — diritto all'oblio / right to erasure).
- Cancellazione/anomizzazione account da admin con vincoli anti-abuso (nessun admin può cancellare un altro admin; ultimo admin non cancellabile).
- Esportazione portabilità dati personali in formato JSON strutturato (GDPR art. 20 — diritto alla portabilità).
- Anonimizzazione selettiva: i dati personali vengono cancellati, ma ordini/biglietti/movimenti credito restano per obblighi fiscali e contabili con userId anonimizzato.
- Disabilitazione/riabilitazione account via toggle `IsDisabled` da admin e da self-service (GDPR art. 18 — diritto di limitazione).
- Pagine legali pubbliche `privacy.html`, `cookie.html` e `termini-condizioni.html`, con sezione diritti dell'interessato, basi giuridiche, tempi di conservazione, destinatari, trasferimenti verso terzi e riferimenti privacy documentati con placeholder da sostituire prima del rilascio.
- Inventario e informativa di cookie e tecnologie assimilate lato client, includendo `localStorage`, geolocalizzazione e qualunque servizio terzo caricato dal frontend prima o dopo l'interazione utente.
- Adeguamento UX di registrazione, social login e checkout per presa visione e accettazione versionata dei documenti legali applicabili.
- Trasparenza esplicita su risorse terze caricate automaticamente (`CDN`, font, immagini remote`) con notice leggero e documentazione nelle informative; eventuale self-hosting rinviabile a hardening futuro non bloccante.
- Annullamento show da parte di `Admin` e `PowerUser`, distinto dalla cancellazione fisica dello show, con preservazione dello storico ordini/biglietti.
- Rimborso degli utenti coinvolti da uno show annullato usando lo stesso metodo di pagamento usato per l'acquisto: refund Stripe per quota carta, riaccredito credito piattaforma per quota credito e gestione split per pagamenti misti.
- Precompilazione dell'email utente nel form hosted di Stripe Checkout quando l'ordine è pagato con carta o metodo misto.
- Notifica email opzionale agli utenti i cui biglietti vengono annullati e/o rimborsati, con template transazionale e tracciamento esito invio.
- Test automatici backend estesi.
- Smoke test frontend e manual verification.
- Aggiornamento documentazione e `.env.example`.

### Out of scope

- Single Sign-On per `CinemaStaff`, `PowerUser` e `Admin` tramite provider esterno.
- Assegnazione automatica dei ruoli applicativi da gruppi Google Workspace o Microsoft Entra ID.
- MFA/TOTP o passkey/WebAuthn.
- Gestione completa del ciclo di vita HR/scuola, disattivazione automatica account o sincronizzazione directory.
- Invio SMS o recupero password via telefono.
- Migrazione a cookie HttpOnly per l'intero modello auth frontend.
- Rework grafico esteso delle pagine auth oltre agli elementi necessari.
- Uso di Microsoft Graph o permessi Microsoft oltre i soli scope OIDC minimi (`openid`, `profile`, `email`) per leggere dati organizzativi, gruppi, ruoli directory o profili estesi.
- Sincronizzazione automatica dipendenti da HR, Active Directory, Google Workspace, Microsoft Entra ID o sistemi paghe/turni.
- Ruoli operativi specializzati ulteriori come `Cassiere`, `Maschera`, `ResponsabileCinema` o workflow approvativi multi-livello: la FASE 7.2 introduce capability per cinema sufficientemente estendibili, ma non una gerarchia HR completa.
- Permessi economici avanzati come storni, rettifiche negative, massimali per operatore o approvazione ricariche: la FASE 7.2 copre solo ricariche positive tracciate.
- Rimborso parziale discrezionale non legato all'annullamento show, chargeback/dispute Stripe, storni manuali fuori piattaforma e gestione contabile/fiscale completa dei rimborsi oltre alla tracciabilità tecnica minima.
- Integrazione di un sistema email marketing/newsletter: le email di annullamento show devono restare transazionali e limitate agli utenti direttamente interessati.
- Validazione legale finale dei testi, nomina formale del DPO/RPD se necessaria, registro dei trattamenti, DPIA, accordi di nomina a responsabile del trattamento e altri adempimenti organizzativi extra software.
- CMP enterprise / framework IAB TCF, analytics o marketing consent management avanzato e portale DSAR automatizzato: la FASE 7.4 copre solo la UX minima coerente con lo stack attuale e con le tecnologie effettivamente usate dal prodotto.

## 1.3 Vincoli di sicurezza vincolanti

1. Il social login non deve mai assegnare `CinemaStaff`, `PowerUser` o `Admin`.
2. Un account `CinemaStaff`, `PowerUser` o `Admin` non deve poter entrare tramite Google/Microsoft: deve usare credenziali locali.
3. Un utente registrato autonomamente, anche via social, nasce sempre `User`.
4. La promozione a `CinemaStaff`, `PowerUser` o `Admin` è solo `AdminOnly`.
5. Un account social-only non può essere promosso a ruolo operativo/elevato finché non ha impostato una password locale.
6. Dopo cambio ruolo, reset password o cambio password, i refresh token devono essere revocati e i JWT esistenti devono diventare non riutilizzabili entro un limite controllato.
7. I token di reset/invito/setup password non devono essere salvati in chiaro nel database.
8. Il flusso `forgot-password` deve restituire sempre una risposta generica per evitare enumerazione email.
9. Tutti i redirect da login, reset, social callback e route guard devono accettare solo path relativi interni.
10. Provider token e access token esterni non devono essere persistiti, salvo esplicita necessità futura.
11. Per Microsoft il backend deve validare firma, `aud`, `iss`, `exp`, `nonce`, `tid` e identificatore stabile (`oid` quando disponibile, altrimenti `sub`) usando metadata OIDC attendibili; l'email Microsoft non deve essere usata come identificatore primario perché `email` e `preferred_username` sono claim mutabili e non sempre presenti.
12. Ogni operazione admin su ruoli/credenziali deve essere auditata.
13. Ogni operazione `CinemaStaff` su biglietti, credito o show deve verificare l'assegnazione attiva del dipendente al cinema interessato e la capability richiesta.
14. `CinemaStaff` non deve poter modificare catalogo globale (`Film`, `Registi`, `Categorie`, `Media`), cinema, sale/layout, utenti, ruoli o assegnazioni.
15. `PowerUser` e `Admin` mantengono capacità operative globali; `CinemaStaff` non è un `PowerUser` ridotto solo lato frontend, ma un ruolo con autorizzazione scoped lato backend.
16. Il cambio ruolo da/verso `CinemaStaff` e qualunque modifica alle assegnazioni cinema deve incrementare `AuthVersion`, revocare refresh token attivi e produrre audit.
17. Le assegnazioni cinema non devono essere incluse come fonte di verità nel JWT: il backend deve leggerle dal database o da cache server-side a TTL breve e invalidabile.
18. Non confrontare i ruoli usando l'ordine numerico dell'enum: usare policy esplicite. Per compatibilità con dati persistiti, non rinumerare i valori esistenti di `UserRole`.

## 1.4 Nomenclatura canonica

| Concetto | Nome consigliato |
| --- | --- |
| Provider esterno | `ExternalLoginProvider` (`Google`, `Microsoft`) |
| Login esterno collegato | `UserExternalLogin` |
| Token recupero/setup/invito | `AccountActionToken` |
| Stato OAuth temporaneo | `ExternalAuthState` |
| Codice scambio social -> app token | `ExternalAuthExchangeCode` |
| Audit sicurezza account | `UserSecurityAuditLog` |
| Ruolo personale operativo cinema | `CinemaStaff` |
| Assegnazione staff a cinema | `UserCinemaAssignment` |
| Capability staff | `CanValidateTickets`, `CanTopUpCredit`, `CanManageShows` |
| Servizio autorizzazione operativa | `ICinemaAccessService` / `CinemaAccessService` |
| Pagina richiesta recupero password | `recupera-password.html` |
| Pagina reset password | `reimposta-password.html` |
| Pagina completamento social login | `social-login-complete.html` |
| Pagina admin gestione utenti | `utenti.html` |

## 1.5 Riferimenti operativi

Per la parte social login, usare come riferimento concettuale il materiale del progetto EducationalGames indicato dal committente:

- `https://github.com/GreppiDev/Info5IA2526WebDev/blob/main/asp.net/api-samples/minimal-api/Esami/2023/EducationalGames/indicazioni-sviluppo-progetto.md#autenticazione-basata-su-microsoft-e-google---minimal-api`
- `https://github.com/GreppiDev/Info5IA2526WebDev/tree/main/asp.net/api-samples/minimal-api/Esami/2023/EducationalGames/EducationalGames`

Adattamento per CineBase:

- EducationalGames usa autenticazione esterna dentro un'app unificata con cookie; CineBase mantiene l'architettura attuale JWT + refresh token opaco.
- Rimane valido il principio di separare provider Google e Microsoft, gestire callback/failure provider-specifici e creare/collegare l'utente locale solo dopo validazione server-side.
- Per CineBase Google è un provider pubblico per utenti `User`: sono ammessi account Google con qualunque dominio email, purché Google certifichi quell'indirizzo con `email_verified = true`. Microsoft è anch'esso un provider pubblico per utenti `User`: sono ammessi account personali Microsoft e account work/school Microsoft Entra ID, incluso `issgreppi.it`, purché il token OIDC sia valido e produca un'identità stabile collegabile all'account applicativo.

## 1.6 Decisione aggiornata su Microsoft identity platform

La restrizione precedente a `issgreppi.it` non è più considerata un requisito funzionale. Dopo verifica della documentazione ufficiale Microsoft, l'Iterazione 5 deve supportare Microsoft come provider generalista, in modo analogo a Google per gli utenti normali, ma con regole di validazione diverse.

Riferimenti Microsoft rilevanti:

- `https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app`
- `https://learn.microsoft.com/en-us/entra/identity-platform/single-and-multi-tenant-apps`
- `https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc`
- `https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference`
- `https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview`
- `https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc`

Conclusione tecnica:

- Microsoft identity platform consente registrazioni applicative per account personali Microsoft e account work/school configurando l'audience `Accounts in any organizational directory and personal Microsoft accounts` (`AzureADandPersonalMicrosoftAccount`).
- L'authority OIDC consigliata per questo scenario è `https://login.microsoftonline.com/common/v2.0`, perché accetta sia account personali sia account work/school.
- Per un login base con scope OIDC minimi (`openid`, `profile`, `email`) non emerge un obbligo generale di publisher verification. La publisher verification resta consigliata per fiducia e adozione, ma diventa più rilevante per app multitenant che chiedono permessi oltre il profilo base o per tenant con policy di consenso restrittive.
- Alcuni tenant Microsoft Entra ID possono comunque impedire il consenso utente o richiedere consenso amministrativo per policy interne. Il sistema deve gestire questi errori in modo chiaro, senza considerarli difetti del flusso applicativo.

Specifiche vincolanti per Microsoft in CineBase:

- La app registration Microsoft deve supportare account personali e account work/school.
- Il backend deve usare Authorization Code Flow + PKCE e validare server-side l'ID token.
- Il backend deve validare firma, `aud`, `iss`, `exp`, `nonce` e coerenza `tid`/issuer secondo metadata OIDC Microsoft.
- Il backend deve conservare come identificatore provider primario `Provider = Microsoft` + `ProviderTenantId = tid` + `ProviderUserId = oid` quando `oid` è presente; se `oid` manca, usare `sub` documentando che è pairwise per client/app.
- Per account personali Microsoft, il `tid` atteso è il tenant consumer Microsoft `9188040d-6c67-4c5b-b112-36a304b66dad`; per account work/school il `tid` identifica il tenant dell'organizzazione.
- `email` e `preferred_username` possono essere usati per mostrare l'indirizzo all'utente e per valorizzare l'email applicativa iniziale, ma non devono essere usati come identificatore stabile o come unica prova di autorizzazione.
- Se Microsoft non restituisce un claim email-like utilizzabile (`email` oppure `preferred_username` in formato email), l'autocreazione deve essere rifiutata con messaggio chiaro o rimandata a un flusso esplicito futuro di raccolta/verifica email.
- Il linking automatico a un account locale esistente con la stessa email è ammesso solo per account `User`, non disabilitati e non ambigui; deve essere auditato. Se si vuole un livello di sicurezza superiore, il piano consente di sostituire il linking automatico Microsoft con una conferma email locale, ma questa conferma non è obbligatoria nell'Iterazione 5 salvo decisione esplicita.
- Il social login Microsoft non deve mai autenticare account applicativi `CinemaStaff`, `PowerUser` o `Admin`.

Parti da controllare durante l'implementazione:

- configurazione `signInAudience` dell'app Microsoft su `AzureADandPersonalMicrosoftAccount`;
- uso dell'authority `common` e non di un tenant specifico;
- validazione issuer multi-tenant con metadata tenant-independent;
- gestione della chiave di firma con `kid` e key rollover;
- mapping stabile `tid + oid/sub` nella tabella `UserExternalLogin`;
- comportamento quando l'email Microsoft non è presente;
- comportamento quando un tenant work/school blocca il consenso utente;
- assenza di qualunque filtro hard-coded su `issgreppi.it` nel provider Microsoft, salvo eventuali filtri opzionali configurati esplicitamente in futuro;
- test con account personale Microsoft (`outlook.com`/`hotmail.com`/`live.*`) e account work/school (`issgreppi.it` o altro tenant disponibile);
- messaggi frontend per errori Microsoft centrati sulla causa reale: token non valido, consenso negato, policy tenant, email assente o account operativo/elevato.

---

## 2) Requisiti Funzionali Consolidati

## 2.1 Social login per utenti normali

Il login social deve supportare:

- Google OpenID Connect.
- Microsoft OpenID Connect per account personali Microsoft e account work/school Microsoft Entra ID.
- Creazione automatica di un account `User` quando il login avviene con Google, l'ID token Google è valido e contiene una email con `email_verified = true`, indipendentemente dal dominio dell'indirizzo.
- Creazione automatica di un account `User` quando il login avviene con Microsoft, l'ID token Microsoft è valido, contiene un'identità stabile (`tid` + `oid`/`sub`) e fornisce un indirizzo email-like utilizzabile come email applicativa.
- Collegamento al profilo esistente se l'indirizzo restituito dal provider corrisponde a un account `User` e soddisfa le regole provider-specifiche: email verificata per Google, email-like disponibile e identità stabile validata per Microsoft.
- Collegamento al profilo esistente da Microsoft solo se l'account applicativo è `User`, non disabilitato, non ambiguo e la policy di linking basata su email è accettata per l'Iterazione 5.
- Rifiuto esplicito del login Microsoft se il token non è valido, l'issuer non è coerente con il tenant, manca un identificatore stabile, manca un indirizzo email-like necessario alla creazione/linking, il consenso viene negato o il tenant esterno applica policy che impediscono il flusso.
- Rifiuto esplicito se l'account applicativo esistente è `CinemaStaff`, `PowerUser` o `Admin`.
- Emissione di JWT e refresh token applicativi esattamente come il login locale, passando da exchange code one-time.
- Conservazione minima dei dati provider: provider, subject/oid, tenant id quando disponibile, email usata nel login/linking, timestamp collegamento e ultimo accesso.

Regole provider:

- Google: validare `iss`, `aud`, firma, `exp`, `email` ed `email_verified == true`; non applicare vincoli su `hd` o sul dominio email. In pratica sono ammessi account Google con `gmail.com`, `issgreppi.it` o altri domini, purché Google dichiari l'email verificata. Se `hd` è presente, può essere registrato a scopo diagnostico ma non deve essere requisito di accesso.
- Microsoft: validare `iss`, `aud`, firma, `exp`, `nonce`, `tid`, `oid`/`sub`, `preferred_username` o `email`; usare l'authority `common` per accettare account personali Microsoft e account work/school. Non imporre vincoli di dominio o tenant in modo predefinito. Usare `tid + oid` o `tid + sub` come identità stabile del provider; usare `email`/`preferred_username` solo come email applicativa e dato di contatto, non come identificatore primario.

Nota Microsoft:

- Il provider Microsoft deve essere configurato come multi-audience (`AzureADandPersonalMicrosoftAccount`). La publisher verification non è un prerequisito generale per un login OIDC base con scope minimi, ma resta consigliata per aumentare fiducia e ridurre attriti di consenso in tenant esterni. I tenant work/school possono applicare policy locali che richiedono admin consent o bloccano l'app: il frontend deve mostrare un errore comprensibile e il backend deve auditare il rifiuto.

## 2.2 Credenziali locali

Tutti gli utenti con credenziali locali devono poter:

- modificare la propria password inserendo la password attuale;
- richiedere il recupero password da form pubblico;
- reimpostare password con token temporaneo ricevuto via email;
- essere disconnessi dalle sessioni esistenti dopo un reset o un cambio password.

Gli utenti social-only devono poter impostare una password locale tramite link email. Questo serve anche per rendere promuovibile un utente social-only a `CinemaStaff`, `PowerUser` o `Admin`.

## 2.3 Recupero password

Flusso richiesto:

1. L'utente clicca "Ho dimenticato la password" dal form login.
2. Viene aperta `recupera-password.html`.
3. L'utente inserisce l'email.
4. Il backend risponde sempre con messaggio generico.
5. Se l'email è registrata, il backend crea un token temporaneo specifico per utente e scopo.
6. Il token viene salvato solo come hash.
7. Viene inviata una email con link a `reimposta-password.html?token=...`.
8. Il token consente una sola reimpostazione entro TTL configurato.
9. Alla reimpostazione riuscita vengono revocati refresh token e invalidati i JWT precedenti.

TTL consigliati:

- reset password utente normale: 30 minuti;
- setup password per account social-only: 60 minuti;
- invito admin/power: 24 ore;
- exchange code social: 2 minuti;
- state OAuth: 10 minuti.

## 2.4 Creazione e promozione utenti operativi/elevati

Nessun utente può registrarsi autonomamente come `CinemaStaff`, `PowerUser` o `Admin`.

Flussi ammessi:

- `Admin` crea un nuovo account `CinemaStaff` tramite invito email assegnandogli obbligatoriamente uno o più cinema con capability operative esplicite.
- `Admin` crea un nuovo account `PowerUser` o `Admin` tramite invito email, senza mostrare o inviare password in chiaro.
- `Admin` promuove un utente `User` già registrato, se quell'utente ha credenziali locali attive.
- `Admin` può inviare a un utente social-only un link per impostare la password locale; la promozione a `CinemaStaff`, `PowerUser` o `Admin` resta bloccata finché la password non è stata impostata.
- `Admin` può modificare le assegnazioni cinema di un `CinemaStaff` senza cambiare ruolo, ma ogni modifica deve invalidare le sessioni attive.

Regole di sicurezza:

- mantenere il vincolo esistente che impedisce la degradazione dell'ultimo admin;
- impedire che un admin degradi sé stesso se è l'ultimo admin;
- revocare sessioni e incrementare `AuthVersion` al cambio ruolo;
- revocare sessioni e incrementare `AuthVersion` al cambio assegnazioni `CinemaStaff`;
- impedire login social a utenti già operativi/elevati;
- registrare audit su creazione, invito, promozione, degradazione, modifica assegnazioni e reset password admin-triggered.

## 2.5 Frontend utente

Le pagine auth devono evolvere così:

- `login.html`:
  - login locale esistente;
  - link "Ho dimenticato la password";
  - bottoni "Continua con Google" e "Continua con Microsoft";
  - messaggi chiari per consenso Microsoft negato, policy tenant, email Microsoft assente/non utilizzabile o account operativo/elevato che deve usare password locale.
- `registrazione.html`:
  - resta registrazione locale solo `User`;
  - può offrire gli stessi bottoni social, specificando che Google è aperto agli account Google verificati e Microsoft è aperto ad account personali e account work/school.
- `recupera-password.html`:
  - form email;
  - messaggio generico dopo submit.
- `reimposta-password.html`:
  - token da query string;
  - nuova password + conferma;
  - redirect a login al successo.
- `social-login-complete.html`:
  - scambia il codice temporaneo backend con token applicativi;
  - salva token usando `Auth.saveTokens` e `Auth.saveUser`;
  - redirige solo a path relativo interno.
- `profilo.html`:
  - sezione "Sicurezza account";
  - cambio password per utenti con password locale;
  - pulsante "Imposta password" per social-only, con invio link email.

## 2.6 Frontend admin

Nuova pagina `utenti.html` protetta da `AdminOnly`:

- tabella utenti con ricerca email/nome e filtro ruolo;
- colonne: email, nome, ruolo, provider collegati, password locale presente, data registrazione, ultimo login;
- creazione/invito nuovo `CinemaStaff`, `PowerUser` o `Admin`;
- promozione/degradazione ruolo con conferma;
- blocco visivo per utenti social-only non promuovibili;
- azione "Invia link imposta password";
- gestione assegnazioni `CinemaStaff`: elenco cinema, capability per cinema, stato attivo/disattivo, audit dell'ultima modifica, con vincolo di almeno un cinema attivo finché il ruolo resta `CinemaStaff`;
- messaggi chiari per ultimo admin, account operativo/elevato, errori di consenso/policy Microsoft e sessioni revocate.

## 2.7 Profilo `CinemaStaff` e permessi per cinema

La piattaforma deve distinguere il backoffice globale dal personale operativo dei singoli cinema.

Gerarchia logica desiderata:

```text
User
CinemaStaff + permessi per cinema
PowerUser globale
Admin globale
```

Questa è una gerarchia concettuale, non un ordine numerico dell'enum. Per non rompere dati persistiti, `UserRole.User`, `UserRole.PowerUser` e `UserRole.Admin` devono mantenere i valori numerici già usati dal database; `CinemaStaff` va aggiunto senza rinumerare i valori esistenti.

Responsabilità `CinemaStaff`:

- validare biglietti solo per cinema assegnati e solo se ha capability `CanValidateTickets`;
- caricare credito solo se ha capability `CanTopUpCredit`, registrando il cinema operativo e l'operatore;
- gestire show solo per cinema assegnati e solo se ha capability `CanManageShows`;
- accedere alle pagine operative necessarie (`dashboard.html`, `shows.html`, `ricarica-credito.html`, `validazione-biglietti.html`) con dati filtrati sui cinema autorizzati;
- visualizzare il proprio profilo e le proprie informazioni di sicurezza come gli altri utenti autenticati.

Limitazioni `CinemaStaff`:

- non può creare, modificare o cancellare film, registi, categorie o media;
- non può creare, modificare o cancellare cinema;
- non può creare, modificare o cancellare sale o layout posti;
- non può accedere a `utenti.html`, creare inviti, cambiare ruoli o assegnare cinema ad altri utenti;
- non può vedere movimenti credito globali o ricariche di cinema non assegnati;
- non può validare biglietti di un cinema diverso da quelli assegnati, anche se conosce il codice biglietto;
- non può usare social login dopo essere stato promosso a `CinemaStaff`.

Regole su capability:

- Un `CinemaStaff` può avere assegnazioni diverse su cinema diversi.
- Un'assegnazione può essere attiva ma con una sola capability, ad esempio solo validazione biglietti.
- Un utente con ruolo `CinemaStaff` deve avere sempre almeno una assegnazione attiva valida.
- Invito, promozione o cambio ruolo verso `CinemaStaff` devono essere rifiutati se non viene fornita almeno una assegnazione attiva.
- Un aggiornamento assegnazioni non può lasciare un `CinemaStaff` con zero assegnazioni attive; se si vuole rimuovere l'ultimo cinema, l'admin deve prima fare downgrade del ruolo oppure eseguire downgrade e revoca assegnazioni in modo coordinato.
- `PowerUser` e `Admin` sono considerati operatori globali: hanno implicitamente tutte le capability su tutti i cinema, senza necessità di righe `UserCinemaAssignment`.
- Il backend deve applicare queste regole anche se il frontend invia manualmente un `CinemaId` non autorizzato.

---

## 3) Decisioni Architetturali

## 3.1 Social login: flusso backend-mediated con exchange code

Scelta raccomandata: Authorization Code Flow + PKCE gestito dal backend, con redirect finale al frontend tramite exchange code temporaneo.

Motivazione:

- il frontend attuale è statico e salva i token applicativi in `localStorage`;
- non bisogna mettere access token applicativi direttamente nella query string;
- il backend deve essere l'unico punto che valida provider, email verificata Google, issuer/tenant/subject Microsoft e linking account;
- il pattern si integra con l'attuale `AuthResponseDTO` e refresh token applicativo.

Flusso:

1. Frontend apre `GET /auth/external/google/start?redirect=/profilo.html` o `GET /auth/external/microsoft/start?...`.
2. Backend valida il redirect relativo.
3. Backend crea `ExternalAuthState` con state hash, provider, redirect, nonce, code verifier PKCE e scadenza.
4. Backend reindirizza al provider.
5. Provider richiama `/auth/external/{provider}/callback`.
6. Backend valida state, scambia code e valida ID token secondo le regole del provider: Google richiede email verificata, Microsoft richiede issuer/audience/tenant/identificatore stabile coerenti e un indirizzo email-like se serve creare o collegare l'utente locale.
7. Backend crea/collega l'utente `User` oppure rifiuta.
8. Backend genera `ExternalAuthExchangeCode` one-time e redirect a `FRONTEND_BASE_URL/social-login-complete.html?code=...&redirect=...`, con redirect già validato e risanitizzato dal frontend.
9. Frontend chiama `POST /auth/external/exchange` con il code.
10. Backend restituisce `AuthResponseDTO` con JWT e refresh token applicativi.

## 3.2 Perché non usare token social direttamente nel frontend

Non usare Google/Microsoft SDK lato frontend come source of truth auth applicativa.

Motivi:

- il provider token non contiene i ruoli applicativi CineBase;
- le regole provider devono essere verificate lato backend: email verificata per Google, issuer/tenant/subject coerenti per Microsoft;
- il linking con account esistenti deve consultare il DB;
- bisogna impedire che provider esterni autentichino account operativi/elevati;
- il ciclo di refresh token applicativo è già custom e deve restare coerente.

## 3.3 Ruoli operativi/elevati e account social

Decisione vincolante:

- `User` può autenticarsi con password locale, Google o Microsoft; Google è consentito su qualunque dominio email se Google restituisce un'identità valida con `email_verified = true`, mentre Microsoft è consentito per account personali e work/school se il token OIDC è valido e contiene un'identità stabile collegabile.
- `CinemaStaff`, `PowerUser` e `Admin` possono autenticarsi solo con password locale.
- Se un account `User` social viene promosso, i provider collegati restano in storico ma non sono più utilizzabili per login finché il ruolo è operativo/elevato.
- La promozione incrementa `AuthVersion` e revoca refresh token.

Ragione:

- riduce il rischio che una compromissione o configurazione errata del provider esterno apra accesso amministrativo;
- mantiene controllo locale sulle credenziali privilegiate;
- evita ambiguità tra ruoli applicativi e identità esterne.

## 3.4 Opzioni valutate per creare `CinemaStaff`, `PowerUser` e `Admin`

| Opzione | Valutazione | Decisione |
| --- | --- | --- |
| Registrazione pubblica con scelta ruolo | Rischio critico di escalation, anche se nascosta nel frontend | **Vietata** |
| Admin crea `CinemaStaff` con assegnazioni cinema e capability esplicite | Rispecchia il personale operativo reale e limita blast radius | **Supportata e consigliata** |
| Admin crea utente con password temporanea mostrata a video | Funziona ma espone segreti e genera abitudini insicure | **Non consigliata** |
| Admin crea invito email e utente imposta password | Sicura, auditabile, nessuna password in chiaro | **Supportata e consigliata per CinemaStaff/PowerUser/Admin** |
| Admin promuove utente esistente con password locale | Utile per utenti già registrati, sicura se auditata | **Supportata** |
| Admin promuove utente social-only senza password locale | Rischio alto: account operativo/elevato dipendente solo da social login | **Vietata** |
| Ruoli automatici da gruppi Google/Microsoft | Potente ma richiede governance directory e test specifici | **Out of scope** |

## 3.5 Password e social-only

`PasswordHash` deve diventare nullable o semanticamente opzionale, perché un account creato via social può non avere password locale.

Regole:

- `PasswordHash == null` significa nessuna credenziale locale attiva.
- `LocalCredentialsEnabled == true` solo se esiste un hash valido.
- Login locale rifiuta account senza password con messaggio generico non enumerativo sul backend e messaggio UX utile sul frontend.
- `CinemaStaff`, `PowerUser` e `Admin` richiedono sempre `LocalCredentialsEnabled == true`.

## 3.6 Invalidazione sessioni e token

L'attuale JWT contiene il ruolo nel token. Se un ruolo cambia, un access token già emesso potrebbe restare valido fino alla scadenza. In questa iterazione va introdotto un meccanismo di invalidazione.

Soluzione consigliata:

- aggiungere `AuthVersion int` o `SecurityStamp string` su `User`;
- includere il valore nel JWT come claim, ad esempio `auth_version`;
- incrementare `AuthVersion` su cambio password, reset password, setup password, cambio ruolo, cambio assegnazioni `CinemaStaff`, disabilitazione account o cambio provider critico;
- in `JwtBearerEvents.OnTokenValidated`, validare che il claim corrisponda al valore DB;
- usare cache breve in memoria solo se serve contenere il costo DB, con TTL massimo 60 secondi;
- revocare comunque tutti i refresh token dell'utente per forzare nuovo login.

Pass condition: un token emesso prima di una promozione/degradazione non deve poter accedere a endpoint con ruolo non più coerente oltre il TTL di cache dichiarato.

## 3.7 Token temporanei

I token per reset password, invito admin e setup password devono essere:

- generati con `RandomNumberGenerator.GetBytes(32+)`;
- codificati URL-safe;
- salvati solo come hash SHA-256 o HMAC-SHA256;
- legati a `UserId`, `Purpose`, scadenza, `CreatedAtUtc`, `UsedAtUtc` e `CreatedByUserId` quando applicabile;
- invalidati dopo uso;
- invalidati se viene creato un nuovo token dello stesso scopo per lo stesso utente;
- mai loggati in chiaro.

## 3.8 Email account

Usare la configurazione SMTP già introdotta nell'Iterazione 4, ma non riusare il servizio ticket in modo improprio.

Scelta consigliata:

- creare `IAccountEmailService` / `AccountEmailService`;
- riusare internamente le impostazioni `SMTP_*`;
- mantenere `IEmailService` per i biglietti finché non viene estratta una base comune;
- nei test sostituire `IAccountEmailService` con fake dedicato.

Email minime:

- reset password;
- setup password account social-only;
- invito `CinemaStaff`/`PowerUser`/`Admin`, includendo per `CinemaStaff` l'indicazione dei cinema assegnati;
- notifica cambio password riuscito;
- notifica cambio ruolo, facoltativa ma consigliata.

## 3.9 Autorizzazione operativa scoped per cinema

La FASE 7.2 deve introdurre un livello di autorizzazione oltre al ruolo JWT. Il ruolo identifica la classe dell'utente; le assegnazioni definiscono dove e cosa può fare.

Decisione vincolante:

- `UserRole` non deve essere usato con confronti numerici (`>= PowerUser`, `> User`, ecc.). Usare sempre policy esplicite o metodi dedicati.
- Per compatibilità con i dati già persistiti, non cambiare i valori numerici esistenti: `User = 0`, `PowerUser = 1`, `Admin = 2`. Aggiungere `CinemaStaff = 3` oppure un valore nuovo non in conflitto, documentando che l'ordine numerico non rappresenta la gerarchia.
- `CinemaStaff` è privilegiato: richiede password locale, non social login, audit e invalidazione sessioni su cambio ruolo/permessi.
- `PowerUser` e `Admin` restano globali per le operazioni già accessibili con `PowerUserOrAdmin`.
- `CinemaStaff` non eredita `PowerUserOrAdmin`: le policy devono distinguere tra backoffice globale e staff operativo.
- Le operazioni staff devono passare da un servizio centralizzato, ad esempio `ICinemaAccessService`, per evitare controlli duplicati e incoerenti.

Servizio consigliato:

```text
ICinemaAccessService
  Task<bool> CanValidateTicketsAsync(int userId, string role, int cinemaId)
  Task<bool> CanTopUpCreditAsync(int userId, string role, int cinemaId)
  Task<bool> CanManageShowsAsync(int userId, string role, int cinemaId)
  Task<IReadOnlyList<OperationalCinemaDTO>> GetOperationalCinemasAsync(int userId, string role)
  Task EnsureCanValidateTicketsAsync(...)
  Task EnsureCanTopUpCreditAsync(...)
  Task EnsureCanManageShowsAsync(...)
```

Regola per ruoli globali:

- Se ruolo è `Admin` o `PowerUser`, il servizio restituisce permesso positivo su tutti i cinema attivi.
- Se ruolo è `CinemaStaff`, il servizio consulta `UserCinemaAssignments` attive.
- Se ruolo è `User` o anonimo, il servizio restituisce sempre permesso negativo.

Cache:

- È ammessa una cache server-side breve per ridurre query ripetute, ma deve avere TTL massimo 60 secondi e deve essere invalidata logicamente tramite `AuthVersion` quando cambiano assegnazioni o ruolo.
- Non includere la lista cinema nel JWT come fonte di verità. Se si inseriscono claim di comodo per la UI, il backend deve comunque ricontrollare il database.

---

## 4) Design Tecnico - Modello Dati

## 4.1 Modifiche a `User`

Estendere `backend/FilmAPI/Model/User.cs`:

```text
User(
  ...campi esistenti,
  PasswordHash string? nullable,
  NormalizedEmail string required unique,
  LocalCredentialsEnabled bool required default true,
  EmailVerifiedAtUtc datetime?,
  PasswordChangedAtUtc datetime?,
  MustChangePassword bool required default false,
  AuthVersion int required default 0,
  LastLoginAtUtc datetime?,
  LastLoginProvider string? max 30,
  IsDisabled bool required default false
)
```

Note:

- `NormalizedEmail` serve a rendere esplicita l'unicità case-insensitive.
- `PasswordHash` diventa nullable per account social-only.
- `IsDisabled` è opzionale ma consigliato perché la gestione utenti admin diventa più completa; se introdotto, tutti i login devono verificarlo.
- Gli utenti esistenti avranno `LocalCredentialsEnabled = true`, `AuthVersion = 0`, `EmailVerifiedAtUtc = null` salvo scelta di considerarli verificati per migrazione dev.
- In FASE 7.2 aggiungere navigation property `CinemaAssignments` verso `UserCinemaAssignment` se utile per query e DTO admin.

### 4.1.1 Estensione `UserRole` per `CinemaStaff`

Estendere `backend/FilmAPI/Model/UserRole.cs` senza rinumerare i valori esistenti:

```csharp
public enum UserRole
{
    User = 0,
    PowerUser = 1,
    Admin = 2,
    CinemaStaff = 3
}
```

Nota critica: l'ordine numerico è solo compatibilità storage, non gerarchia autorizzativa. Qualunque codice che confronta i ruoli numericamente deve essere sostituito da policy esplicite o helper dedicati.

## 4.2 `UserExternalLogin`

Nuova entità:

```text
UserExternalLogin(
  Id int PK,
  UserId int FK,
  Provider ExternalLoginProvider required,
  ProviderUserId string required max 255,
  ProviderTenantId string? max 255,
  EmailAtLogin string required max 255,
  LinkedAtUtc datetime required,
  LastLoginAtUtc datetime?,
  RevokedAtUtc datetime?
)
UNIQUE(Provider, ProviderUserId)
INDEX(UserId, Provider)
INDEX(EmailAtLogin)
```

Enum:

```text
ExternalLoginProvider
- Google = 0
- Microsoft = 1
```

## 4.3 `AccountActionToken`

Nuova entità:

```text
AccountActionToken(
  Id int PK,
  UserId int FK,
  Purpose AccountActionTokenPurpose required,
  TokenHash string required unique max 128,
  ExpiresAtUtc datetime required,
  CreatedAtUtc datetime required,
  UsedAtUtc datetime?,
  RevokedAtUtc datetime?,
  CreatedByUserId int? FK,
  RequestIp string? max 64,
  UserAgent string? max 512
)
INDEX(UserId, Purpose, ExpiresAtUtc)
```

Enum:

```text
AccountActionTokenPurpose
- PasswordReset = 0
- SetPassword = 1
- AdminInvite = 2
```

## 4.4 `ExternalAuthState`

Nuova entità temporanea:

```text
ExternalAuthState(
  Id int PK,
  Provider ExternalLoginProvider required,
  StateHash string required unique max 128,
  CodeVerifier string required max 256,
  Nonce string required max 128,
  RedirectPath string required max 512,
  CreatedAtUtc datetime required,
  ExpiresAtUtc datetime required,
  ConsumedAtUtc datetime?,
  RequestIp string? max 64,
  UserAgent string? max 512
)
```

## 4.5 `ExternalAuthExchangeCode`

Nuova entità temporanea:

```text
ExternalAuthExchangeCode(
  Id int PK,
  UserId int FK,
  CodeHash string required unique max 128,
  RedirectPath string required max 512,
  CreatedAtUtc datetime required,
  ExpiresAtUtc datetime required,
  ConsumedAtUtc datetime?,
  Provider ExternalLoginProvider required
)
```

## 4.6 `UserSecurityAuditLog`

Nuova entità:

```text
UserSecurityAuditLog(
  Id int PK,
  UserId int? FK,
  ActorUserId int? FK,
  EventType string required max 80,
  Provider string? max 30,
  IpAddress string? max 64,
  UserAgent string? max 512,
  MetadataJson string? max 4000,
  CreatedAtUtc datetime required
)
INDEX(UserId, CreatedAtUtc)
INDEX(ActorUserId, CreatedAtUtc)
INDEX(EventType, CreatedAtUtc)
```

Eventi minimi:

- `PasswordChanged`
- `PasswordResetRequested`
- `PasswordResetCompleted`
- `SetPasswordRequested`
- `SetPasswordCompleted`
- `ExternalLoginSucceeded`
- `ExternalLoginRejectedDomain`
- `ExternalLoginRejectedElevatedRole`
- `ExternalLoginLinked`
- `AdminInviteCreated`
- `AdminUserCreated`
- `RoleChanged`
- `RoleChangeRejected`
- `RefreshTokensRevoked`
- `CinemaStaffAssignmentCreated`
- `CinemaStaffAssignmentUpdated`
- `CinemaStaffAssignmentRevoked`
- `CinemaStaffAccessDenied`
- `CinemaStaffOperationalAction`

## 4.7 `UserCinemaAssignment`

Nuova entità per assegnare dipendenti CineBase a uno o più cinema con capability operative granulari.

```text
UserCinemaAssignment(
  Id int PK,
  UserId int FK required,
  CinemaId int FK required,
  CanValidateTickets bool required default false,
  CanTopUpCredit bool required default false,
  CanManageShows bool required default false,
  IsActive bool required default true,
  CreatedAtUtc datetime required,
  CreatedByUserId int? FK,
  UpdatedAtUtc datetime?,
  UpdatedByUserId int?,
  RevokedAtUtc datetime?,
  RevokedByUserId int?,
  Notes string? max 500
)
UNIQUE(UserId, CinemaId)
INDEX(UserId, IsActive)
INDEX(CinemaId, IsActive)
INDEX(CreatedByUserId)
INDEX(UpdatedByUserId)
INDEX(RevokedByUserId)
```

Delete behavior consigliato:

- `UserId` → `Cascade` per coerenza con eventuali cancellazioni fisiche in test/dev; nel flusso GDPR reale l'utente viene anonimizzato e le assegnazioni vanno revocate esplicitamente.
- `CinemaId` → `Cascade` o `Restrict` sono entrambi accettabili; preferire `Restrict` se si vuole impedire cancellazione cinema con personale assegnato, preferire `Cascade` se il progetto tratta la cancellazione cinema come rimozione totale. La scelta va documentata nella migration.
- `CreatedByUserId`, `UpdatedByUserId`, `RevokedByUserId` → `SetNull` o `Restrict` coerente con il resto del modello; evitare che la cancellazione/anomizzazione di un admin blocchi le assegnazioni storiche.

Regole dati:

- `UserId` deve riferirsi preferibilmente a un utente con `Ruolo = CinemaStaff`; non è necessario creare righe per `PowerUser` e `Admin` perché sono globali.
- Se esistono assegnazioni su un utente non `CinemaStaff`, il servizio deve ignorarle salvo uso futuro esplicitamente documentato.
- Almeno una capability deve essere `true` per considerare l'assegnazione utile; se tutte sono `false`, la UI deve mostrare warning e il backend può rifiutare il salvataggio.
- `IsActive = false` o `RevokedAtUtc != null` significa assegnazione non valida per autorizzare operazioni.
- Un utente con ruolo `CinemaStaff` deve avere almeno una riga `UserCinemaAssignment` attiva e valida; il backend deve impedire transizioni o aggiornamenti che lasciano il ruolo `CinemaStaff` senza alcuna assegnazione attiva.
- Ogni modifica deve incrementare `User.AuthVersion`, revocare refresh token e scrivere audit.

DTO consigliati:

```text
CinemaStaffAssignmentDTO
  Id
  UserId
  CinemaId
  CinemaNome
  CinemaCitta
  CanValidateTickets
  CanTopUpCredit
  CanManageShows
  IsActive
  CreatedAtUtc
  UpdatedAtUtc
  RevokedAtUtc

CinemaStaffAssignmentUpsertDTO
  CinemaId
  CanValidateTickets
  CanTopUpCredit
  CanManageShows
  IsActive
  Notes?

CinemaStaffAssignmentsUpdateDTO
  Assignments: List<CinemaStaffAssignmentUpsertDTO>

OperationalCinemaDTO
  CinemaId
  CinemaNome
  CinemaCitta
  CanValidateTickets
  CanTopUpCredit
  CanManageShows
```

---

## 5) API e Permessi

## 5.1 Endpoint auth pubblici

| Endpoint | Auth | Scopo |
| --- | --- | --- |
| `POST /auth/forgot-password` | Anonymous | Richiede email recupero password, risposta sempre generica |
| `POST /auth/reset-password` | Anonymous | Reimposta password tramite token temporaneo |
| `GET /auth/external/providers` | Anonymous | Provider social configurati e regole applicate per ciascun provider |
| `GET /auth/external/google/start?redirect=` | Anonymous | Avvia flusso Google |
| `GET /auth/external/google/callback` | Anonymous | Callback Google lato backend |
| `GET /auth/external/microsoft/start?redirect=` | Anonymous | Avvia flusso Microsoft |
| `GET /auth/external/microsoft/callback` | Anonymous | Callback Microsoft lato backend |
| `POST /auth/external/exchange` | Anonymous | Scambia exchange code con `AuthResponseDTO` |

Endpoint esistenti da mantenere:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

## 5.2 Endpoint auth autenticati

| Endpoint | Auth | Scopo |
| --- | --- | --- |
| `POST /auth/change-password` | `Authenticated` | Cambio password con password attuale |
| `POST /auth/set-password/request` | `Authenticated` | Invia link per impostare password a social-only loggato |
| `GET /auth/security/me` | `Authenticated` | Stato sicurezza account: provider, password locale, ultimo cambio password |

## 5.3 Endpoint admin utenti

| Endpoint | Auth | Scopo |
| --- | --- | --- |
| `GET /admin/utenti?page=&pageSize=&search=&role=` | `AdminOnly` | Listing utenti paginato e filtrabile |
| `POST /admin/utenti/inviti` | `AdminOnly` | Crea invito CinemaStaff/PowerUser/Admin con link setup password |
| `POST /admin/utenti/{id}/password-setup` | `AdminOnly` | Invia link impostazione password a utente esistente |
| `PUT /admin/utenti/{id}/ruolo` | `AdminOnly` | Cambio ruolo controllato, estende endpoint esistente |
| `GET /admin/utenti/{id}/security` | `AdminOnly` | Dettaglio sicurezza utente e provider collegati |
| `GET /admin/utenti/{id}/cinema-assignments` | `AdminOnly` | Lista assegnazioni cinema/capability di un utente `CinemaStaff` |
| `PUT /admin/utenti/{id}/cinema-assignments` | `AdminOnly` | Sostituisce o aggiorna assegnazioni cinema/capability, con audit e revoca sessioni |

## 5.4 Endpoint operativi `CinemaStaff`

Questi endpoint possono continuare a vivere nei path esistenti `/admin/...` per minimizzare il refactor frontend, ma l'autorizzazione non deve più essere solo `PowerUserOrAdmin`: deve ammettere `CinemaStaff` e poi verificare lo scope cinema con `ICinemaAccessService`.

| Endpoint | Auth | Scope richiesto | Scopo |
| --- | --- | --- | --- |
| `GET /staff/me/cinemas` | `CinemaStaffOrPowerUserOrAdmin` | Nessuno; ritorna scope dell'utente | Elenca cinema operativi disponibili e capability correnti |
| `GET /admin/tickets/validate/{code}?cinemaId=` | `CinemaStaffOrPowerUserOrAdmin` | `CanValidateTickets` sul cinema indicato | Lookup biglietto per validazione senza esporre ticket di altri cinema |
| `POST /admin/tickets/validate` | `CinemaStaffOrPowerUserOrAdmin` | `CanValidateTickets` su `dto.CinemaId` | Valida biglietto nel cinema operativo autorizzato |
| `GET /admin/credito/users?email=` | `CinemaStaffOrPowerUserOrAdmin` | `CanTopUpCredit` su almeno un cinema assegnato per staff | Ricerca utente per ricarica; per staff richiede query non vuota e restituisce dati minimi |
| `GET /admin/credito/ricariche?cinemaId=&email=` | `CinemaStaffOrPowerUserOrAdmin` | `CanTopUpCredit` sul cinema richiesto; globale per PowerUser/Admin | Storico ricariche filtrato sui cinema autorizzati |
| `POST /admin/credito/ricariche` | `CinemaStaffOrPowerUserOrAdmin` | `CanTopUpCredit` su `dto.CinemaId` | Ricarica credito positiva tracciata con operatore e cinema |
| `POST /shows` | `CinemaStaffOrPowerUserOrAdmin` | `CanManageShows` su `dto.CinemaId` | Crea show nel cinema autorizzato |
| `PUT /shows/{id}` | `CinemaStaffOrPowerUserOrAdmin` | `CanManageShows` su cinema attuale e, se cambia, nuovo cinema | Modifica show senza consentire spostamenti non autorizzati |
| `DELETE /shows/{id}` | `CinemaStaffOrPowerUserOrAdmin` | `CanManageShows` sul cinema dello show | Elimina show solo se già consentito dalle regole biglietti esistenti |

Regole endpoint importanti:

- `GET /admin/tickets/validate/{code}` senza `cinemaId` non deve essere consentito a `CinemaStaff`, perché permetterebbe di scoprire dati di biglietti di altri cinema. Per semplicità si consiglia di richiedere `cinemaId` per tutti i ruoli e aggiornare il frontend.
- `CreditoTopUpRequestDTO.CinemaId` deve diventare obbligatorio per `CinemaStaff`; per `PowerUser`/`Admin` può restare opzionale solo se serve retrocompatibilità.
- `GET /admin/credito/users` per `CinemaStaff` non deve mai restituire un listing vuoto-query di tutti gli utenti. Richiedere email/query non vuota, preferibilmente almeno 3 caratteri o formato email completo.
- Le query di storico credito per `CinemaStaff` devono filtrare per `MovimentoCredito.CinemaId` incluso negli assegnamenti autorizzati.
- Le operazioni show devono verificare il cinema effettivo sul record DB, non solo il cinema ricevuto nel body.
- `PowerUser` e `Admin` devono continuare a funzionare come operatori globali per non rompere i flussi esistenti.

## 5.5 Matrice pagine frontend aggiornata

| Pagina | Anonimo | User | CinemaStaff | PowerUser | Admin |
| --- | --- | --- | --- | --- | --- |
| `login.html` | SI | - | - | - | - |
| `registrazione.html` | SI | - | - | - | - |
| `recupera-password.html` | SI | SI | SI | SI | SI |
| `reimposta-password.html` | SI | SI | SI | SI | SI |
| `social-login-complete.html` | SI | SI | SI | SI | SI |
| `profilo.html` | - | SI | SI | SI | SI |
| `dashboard.html` | - | - | SI operativa filtrata | SI globale | SI globale |
| `shows.html` | - | - | SI solo cinema assegnati con `CanManageShows` | SI globale | SI globale |
| `ricarica-credito.html` | - | - | SI solo cinema assegnati con `CanTopUpCredit` | SI globale | SI globale |
| `validazione-biglietti.html` | - | - | SI solo cinema assegnati con `CanValidateTickets` | SI globale | SI globale |
| `films.html`, `registi.html`, `categorie.html`, `media` | - | - | - | SI | SI |
| `sale.html` | - | - | - | SI | SI |
| `cinemas.html` | - | - | - | - | SI |
| `utenti.html` | - | - | - | - | SI |

Le altre pagine pubbliche o utente mantengono la matrice dell'Iterazione 4.1. La UI non è fonte di sicurezza: ogni limitazione per `CinemaStaff` deve essere confermata dal backend.

## 5.6 Variabili environment

Aggiornare `backend/.env.example`:

```env
# Account security / password reset
PASSWORD_RESET_TOKEN_TTL_MINUTES=30
SET_PASSWORD_TOKEN_TTL_MINUTES=60
ADMIN_INVITE_TOKEN_TTL_HOURS=24
AUTH_EXTERNAL_STATE_TTL_MINUTES=10
AUTH_EXTERNAL_EXCHANGE_TTL_MINUTES=2

# Google OIDC
GOOGLE_OAUTH_CLIENT_ID=<google_client_id>
GOOGLE_OAUTH_CLIENT_SECRET=<google_client_secret>
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/auth/external/google/callback
GOOGLE_REQUIRE_EMAIL_VERIFIED=true

# Microsoft OIDC / Entra ID
MICROSOFT_OAUTH_CLIENT_ID=<microsoft_client_id>
MICROSOFT_OAUTH_CLIENT_SECRET=<microsoft_client_secret>
MICROSOFT_OAUTH_REDIRECT_URI=http://localhost:5000/auth/external/microsoft/callback
MICROSOFT_AUTHORITY=common
MICROSOFT_ACCEPT_PERSONAL_ACCOUNTS=true
MICROSOFT_ACCEPT_WORK_SCHOOL_ACCOUNTS=true
MICROSOFT_REQUIRE_EMAIL_CLAIM=true

# Frontend URL already present but now required for reset/social links
FRONTEND_BASE_URL=http://localhost:5001
```

Note configurazione Microsoft:

- `MICROSOFT_AUTHORITY=common` indica l'endpoint Microsoft che accetta sia account personali sia account work/school.
- `MICROSOFT_ACCEPT_PERSONAL_ACCOUNTS` e `MICROSOFT_ACCEPT_WORK_SCHOOL_ACCOUNTS` devono restare entrambi `true` per soddisfare il requisito aggiornato.
- `MICROSOFT_REQUIRE_EMAIL_CLAIM=true` significa che, se Microsoft non restituisce `email` o `preferred_username` in formato email, CineBase non autocrea un utente perché non avrebbe un indirizzo locale affidabile da salvare.
- Non introdurre filtri `MICROSOFT_ALLOWED_TENANT_*` o `MICROSOFT_ALLOWED_DOMAIN_*` nell'Iterazione 5: il requisito aggiornato è Microsoft generalista con validazione token, non allowlist di tenant o domini.

---

## 6) Fasi di Implementazione

### FASE 0 - Preflight auth e mappa superfici di sicurezza

**Obiettivo**: evitare modifiche cieche su auth, RBAC e frontend.

**Attività**:

1. Inventariare backend auth e utenti:

   ```bash
   rg -n "AuthService|IAuthService|AuthEndpoints|RefreshToken|PasswordHash|UserRole|AdminUtenti|UpdateUserRole|JWT|JwtBearer|RequireAuthorization|AdminOnly|PowerUserOrAdmin|Authenticated" backend/FilmAPI tests/backend --glob "!bin/**" --glob "!obj/**"
   ```

2. Inventariare frontend auth/redirect:

   ```bash
   rg -n "redirect|login|registrazione|Auth\.|route-guard|cb_access_token|cb_refresh_token|getUserRole|adminPaths|PAGE_PERMISSIONS" frontend/CineBase.Web/wwwroot --glob "!**/*.map"
   ```

3. Inventariare email e SMTP:

   ```bash
   rg -n "SMTP_|IEmailService|EmailService|SendOrderTicketsAsync|FRONTEND_BASE_URL" backend docs --glob "!bin/**" --glob "!obj/**"
   ```

4. Verificare test esistenti:

   ```bash
   dotnet test tests/backend/FilmAPI.Tests.csproj
   ```

5. Annotare eventuali open redirect residui, in particolare in:
   - `frontend/CineBase.Web/wwwroot/js/pages/login.js`
   - `frontend/CineBase.Web/wwwroot/js/auth.js`
   - `frontend/CineBase.Web/wwwroot/js/route-guard.js`

**Verifica fase**:

- elenco file impattati aggiornato;
- baseline test nota;
- rischi auth/redirect mappati prima delle modifiche.

**Checklist fase**:

- [x] Ricerca backend auth eseguita
- [x] Ricerca frontend auth/redirect eseguita
- [x] Ricerca email/SMTP eseguita
- [x] Baseline test backend eseguita (198/198 PASS)
- [x] Open redirect residui annotati (3 trovati: `auth.js:220`, `login.js:25`, `login.js:89-90`)

---

### FASE 1 - Modello dati credenziali, provider esterni e audit

**Obiettivo**: introdurre la base persistente per social login, password opzionale, token temporanei e audit.

**Attività backend**:

1. Estendere `User` con i campi della sezione 4.1.
2. Creare enum:
   - `ExternalLoginProvider`
   - `AccountActionTokenPurpose`
3. Creare model:
   - `UserExternalLogin`
   - `AccountActionToken`
   - `ExternalAuthState`
   - `ExternalAuthExchangeCode`
   - `UserSecurityAuditLog`
4. Aggiornare `FilmDbContext` con `DbSet`, indici, unique constraint e delete behavior.
5. Creare migration `AddAccountSecurityAndExternalLogins`.
6. Ispezionare migration:
   - utenti esistenti mantengono credenziali locali attive;
   - `PasswordHash` viene reso nullable senza perdere hash esistenti;
   - `NormalizedEmail` viene valorizzato da email esistenti;
   - nessuna tabella ticketing/checkout/show viene toccata impropriamente.
7. Aggiornare `DataSeeder` se necessario per valorizzare i nuovi campi sugli utenti seed.

**Verifica fase**:

```bash
dotnet build backend/FilmAPI/FilmAPI.csproj
```

```bash
dotnet ef migrations script --project backend/FilmAPI/FilmAPI.csproj --startup-project backend/FilmAPI/FilmAPI.csproj
```

**Test automatici minimi**:

- migration model snapshot contiene le nuove tabelle;
- utenti seed/admin esistenti riescono ancora a fare login locale;
- `PasswordHash` nullable non rompe `AuthService.LoginAsync`.

**Checklist fase**:

- [x] `User` esteso
- [x] Model external login/token/state/audit creati
- [x] `FilmDbContext` aggiornato
- [x] Migration creata e ispezionata
- [x] Seeder aggiornato se necessario
- [x] Build backend verde

---

### FASE 2 - Infrastruttura email account e token temporanei

**Obiettivo**: creare un'infrastruttura riusabile e testabile per reset password, setup password e inviti admin.

**Attività backend**:

1. Creare DTO per token e email account dove necessario.
2. Creare `IAccountTokenService` / `AccountTokenService` con metodi:
   - `CreateTokenAsync(userId, purpose, ttl, actorUserId, context)`
   - `ValidateTokenAsync(token, purpose)`
   - `ConsumeTokenAsync(token, purpose)`
   - `RevokeActiveTokensAsync(userId, purpose)`
3. Creare `IAccountEmailService` / `AccountEmailService` con metodi:
   - `SendPasswordResetAsync(user, resetUrl)`
   - `SendSetPasswordAsync(user, setupUrl)`
   - `SendAdminInviteAsync(user, inviteUrl, role)`
   - `SendPasswordChangedAsync(user)` facoltativo ma consigliato
4. Implementare hashing token con SHA-256 o HMAC-SHA256.
5. Aggiungere helper centralizzato per costruire URL frontend da `FRONTEND_BASE_URL`.
6. Aggiungere helper centralizzato `RedirectUrlValidator` per path relativi interni.
7. Aggiungere audit service leggero, ad esempio `IUserSecurityAuditService`.
8. Registrare servizi in DI.
9. Estendere `CustomWebApplicationFactory` con fake `IAccountEmailService`.

**Verifica fase**:

```bash
dotnet build backend/FilmAPI/FilmAPI.csproj
```

**Test automatici minimi**:

- token salvato hashato, non in chiaro;
- token valido prima della scadenza;
- token scaduto rifiutato;
- token già usato rifiutato;
- creazione nuovo token revoca i token attivi dello stesso scopo;
- fake email riceve URL corretto e non logga token in chiaro.

**Checklist fase**:

- [x] `AccountTokenService` implementato
- [x] `AccountEmailService` implementato
- [x] Validatore redirect interno creato
- [x] Audit service creato
- [x] Fake email test creato
- [x] Test token/email verdi

---

### FASE 3 - Backend cambio password e recupero password

**Obiettivo**: completare la gestione credenziali locali per tutti gli utenti.

**Attività backend**:

1. Estendere DTO auth, preferibilmente in `DTO/AuthDTO.cs` o file dedicato:
   - `ChangePasswordRequestDTO`
   - `ForgotPasswordRequestDTO`
   - `ResetPasswordRequestDTO`
   - `AccountSecurityDTO`
2. Estendere `IAuthService` / `AuthService` con:
   - `ChangePasswordAsync(userId, dto, deviceId)`
   - `RequestPasswordResetAsync(dto, context)`
   - `ResetPasswordAsync(dto, context)`
   - `RequestSetPasswordAsync(userId, context)`
   - `GetAccountSecurityAsync(userId)`
3. Mappare nuovi endpoint in `AuthEndpoints`.
4. Validare password lato backend:
   - minimo 8 caratteri;
   - almeno maiuscola, minuscola e numero, coerente col frontend attuale;
   - blocco password uguale alla precedente, se verificabile.
5. `POST /auth/forgot-password`:
   - risposta sempre `200 OK` con messaggio generico;
   - crea token solo se utente esiste e non è disabilitato;
   - per social-only usa purpose `SetPassword` o permette reset per creare password locale, in base alla scelta implementativa documentata.
6. `POST /auth/reset-password`:
   - valida token;
   - aggiorna `PasswordHash` con BCrypt;
   - imposta `LocalCredentialsEnabled = true`;
   - aggiorna `PasswordChangedAtUtc`;
   - incrementa `AuthVersion`;
   - revoca refresh token;
   - consuma token;
   - scrive audit.
7. `POST /auth/change-password`:
   - richiede utente autenticato;
   - richiede password attuale se `LocalCredentialsEnabled = true`;
   - rifiuta social-only e suggerisce setup password via email;
   - aggiorna hash e revoca sessioni.
8. Aggiungere rate limiting su login e forgot password.

**Verifica fase**:

```bash
dotnet test tests/backend/FilmAPI.Tests.csproj --filter "FullyQualifiedName~Password"
```

**Test automatici minimi**:

- cambio password con password attuale corretta: OK;
- cambio password con password attuale errata: `400` o `401` coerente;
- login con vecchia password dopo cambio: fallisce;
- login con nuova password: OK;
- forgot password email esistente: risposta generica + email fake inviata;
- forgot password email inesistente: stessa risposta, nessuna email;
- reset token valido: password aggiornata;
- reset token riusato: rifiutato;
- reset token scaduto: rifiutato;
- reset revoca refresh token;
- reset incrementa `AuthVersion`;
- social-only può impostare password via token;
- audit scritto per richiesta e completamento reset.

**Checklist fase**:

- [x] DTO credenziali creati
- [x] Endpoint password mappati
- [x] Cambio password implementato
- [x] Forgot/reset password implementati
- [x] Revoca sessioni implementata
- [x] Rate limiting aggiunto
- [x] Test password/reset verdi

---

### FASE 4 - Backend social login Google/Microsoft per utenti `User`

**Obiettivo**: aggiungere accesso social sicuro per utenti normali, con Google aperto agli account Google verificati e Microsoft aperto ad account personali Microsoft e account work/school Microsoft Entra ID.

**Attività backend**:

1. Aggiungere package OIDC se non già disponibili transitivamente:

   ```bash
   dotnet add backend/FilmAPI/FilmAPI.csproj package Microsoft.IdentityModel.Protocols.OpenIdConnect
   ```

2. Creare DTO:
   - `ExternalProviderDTO`
   - `ExternalExchangeRequestDTO`
   - `ExternalLoginErrorDTO` se utile.
3. Creare servizi:
   - `IExternalAuthService` / `ExternalAuthService`
   - `IExternalAuthProvider`
   - `GoogleExternalAuthProvider`
   - `MicrosoftExternalAuthProvider`
4. Implementare `GET /auth/external/providers`.
5. Implementare start flow provider:
   - genera state e nonce;
   - genera PKCE code verifier/challenge;
   - salva `ExternalAuthState`;
   - valida `redirect` come path relativo;
   - redirect al provider.
6. Implementare callback provider:
   - valida state single-use;
   - scambia authorization code con token endpoint provider;
   - valida ID token con metadata OIDC;
   - per Google, valida `email_verified == true` e non applica vincoli di dominio;
   - per Microsoft, valida `iss`, `aud`, firma, `exp`, `nonce`, `tid`, `oid`/`sub`, coerenza issuer/tenant e indirizzo email-like se necessario a creazione o linking;
   - crea/collega account `User`;
   - rifiuta account esistente `PowerUser`/`Admin`;
   - crea exchange code one-time;
   - redirect a `social-login-complete.html`.
7. Implementare `POST /auth/external/exchange`:
   - consuma exchange code;
   - genera JWT e refresh token applicativi;
   - aggiorna `LastLoginAtUtc`, `LastLoginProvider`;
   - scrive audit.
8. Non salvare provider access token o refresh token.
9. Pulire state/exchange scaduti con hosted service o lazy cleanup.

**Verifica fase**:

```bash
dotnet build backend/FilmAPI/FilmAPI.csproj
```

**Test automatici minimi**:

- fake Google valido `utente@gmail.com`: crea `User`;
- fake Google valido `utente@outlook.com` con account Google e `email_verified = true`: crea `User`;
- fake Google valido `utente@issgreppi.it`: crea `User`;
- fake Microsoft valido account personale `utente@outlook.com`: crea `User`;
- fake Microsoft valido account work/school `utente@issgreppi.it`: crea `User`;
- fake Microsoft valido account work/school di tenant diverso: crea `User` se il token è valido e contiene email-like utilizzabile;
- Google valido con dominio generico: accettato se `email_verified == true`;
- email Google non verificata: rifiutata;
- Microsoft con issuer non coerente con `tid`: rifiutato;
- Microsoft senza `oid` e senza `sub`: rifiutato;
- Microsoft senza `email`/`preferred_username` email-like: rifiutato per autocreazione/linking;
- Microsoft con consenso negato o policy tenant che blocca l'app: rifiutato con errore gestibile;
- account `PowerUser` esistente con stessa email: social login rifiutato;
- account `Admin` esistente con stessa email: social login rifiutato;
- account `User` locale esistente: provider collegato;
- provider già collegato: login ritorna stesso utente;
- state mancante/scaduto/riusato: rifiutato;
- exchange code riusato: rifiutato;
- redirect esterno nel parametro `redirect`: normalizzato o rifiutato;
- ruolo nel token applicativo è sempre `User` per account social creati.

**Checklist fase**:

- [x] Provider service Google creato
- [x] Provider service Microsoft creato
- [x] Start/callback/exchange implementati
- [x] Email Google verificata validata backend senza vincolo dominio
- [x] Casi Google espliciti coperti con `gmail.com`, `outlook.com` e `issgreppi.it`
- [x] Microsoft personale e work/school coperti senza filtro hard-coded su dominio/tenant
- [x] Issuer/tenant/subject Microsoft validati backend
- [x] Casi Microsoft con email assente, consenso negato e policy tenant gestiti
- [x] Ruoli elevati bloccati da social login
- [x] State/exchange single-use implementati
- [x] Test social verdi (20 test, 275/275 PASS)
- [x] Smoke test reale Google e Microsoft OK

---

### FASE 5 - Backend admin utenti: creazione, invito, elevazione e hardening ruoli

**Obiettivo**: completare la gestione sicura degli utenti privilegiati.

**Attività backend**:

1. Estendere DTO admin utenti:
   - `AdminUserListItemDTO`
   - `AdminUserPagedResultDTO`
   - `CreateAdminUserInviteDTO`
   - `AdminUserSecurityDTO`
   - `UpdateRuoloDTO` con eventuali campi di conferma/audit note.
2. Estendere `IUserAdminService` / `UserAdminService`:
   - listing paginato e filtrabile;
   - creazione invito per `PowerUser`/`Admin`;
   - invio setup password a utente esistente;
   - cambio ruolo con validazioni forti.
3. Mantenere compatibilità minima di `GET /admin/utenti` se usato da test esistenti, oppure aggiornare test e frontend in modo coordinato.
4. Regole cambio ruolo:
   - solo `AdminOnly`;
   - vietato creare/promuovere se utente disabilitato;
   - vietato promuovere social-only a `PowerUser`/`Admin`;
   - vietato degradare ultimo admin;
   - cambio a `PowerUser`/`Admin` richiede `LocalCredentialsEnabled = true`;
   - cambio ruolo incrementa `AuthVersion` e revoca refresh token;
   - social login futuro rifiutato per ruoli operativi/elevati.
5. Creazione invito:
   - admin inserisce email, nome, cognome, ruolo target;
   - email deve essere normalizzata;
   - se email già esistente, restituire `409` e suggerire promozione;
   - creare utente con ruolo target, `PasswordHash = null`, `LocalCredentialsEnabled = false`, `MustChangePassword = true` e account non utilizzabile finché non imposta password, oppure creare stato pending documentato;
   - inviare token `AdminInvite`;
   - al completamento invito, impostare password e attivare credenziali locali.
6. Scrivere audit per tutte le operazioni.

**Decisione implementativa consigliata per inviti**:

- se il modello introduce `IsDisabled`, creare l'utente invitato con `IsDisabled = true` e abilitarlo al completamento password;
- se non si introduce `IsDisabled`, bloccare login locale finché `LocalCredentialsEnabled = false` e gestire messaggio chiaro.

**Test automatici minimi**:

- admin crea invito `PowerUser`: OK + email fake;
- admin crea invito `Admin`: OK + email fake;
- power user crea invito: `403`;
- user crea invito: `403`;
- anonimo crea invito: `401`;
- invito email duplicata: `409`;
- completamento invito imposta password e consente login;
- promozione `User` locale a `PowerUser`: OK;
- promozione `User` locale a `Admin`: OK;
- promozione social-only a `PowerUser/Admin`: `409` con codice errore gestibile dal frontend;
- downgrade ultimo admin: bloccato;
- cambio ruolo revoca refresh token e incrementa `AuthVersion`;
- audit scritto.

**Checklist fase**:

- [x] DTO admin utenti estesi
- [x] Listing paginato/filtrato implementato
- [x] Invito Admin/Power implementato
- [x] Promozione controllata implementata
- [x] Social-only elevazione bloccata
- [x] Ultimo admin protetto
- [x] Audit e revoca sessioni implementati
- [x] Test admin utenti verdi

---

### FASE 6 - Frontend login, recupero password e sicurezza profilo

**Obiettivo**: esporre i nuovi flussi credenziali agli utenti finali mantenendo redirect sicuri.

**Attività frontend**:

1. Aggiornare `login.html`:
   - link `recupera-password.html`;
   - bottoni Google/Microsoft;
   - messaggi per errori social.
2. Aggiornare `js/pages/login.js`:
   - sanitizzare sempre `redirect` con helper condiviso;
   - non usare `decodeURIComponent(redirect)` verso `window.location.href` senza validazione;
   - gestire errori backend social riportati via query string.
3. Aggiornare `auth.js`:
   - helper `sanitizeRedirectPath`;
   - `startExternalLogin(provider, redirect)`;
   - metodi `forgotPassword`, `resetPassword`, `changePassword`, `requestSetPassword`;
   - rimuovere ogni redirect non validato.
4. Creare `recupera-password.html` + `js/pages/recupera-password.js`.
5. Creare `reimposta-password.html` + `js/pages/reimposta-password.js`.
6. Creare `social-login-complete.html` + `js/pages/social-login-complete.js`.
7. Aggiornare `registrazione.html` e `registrazione.js` con messaggio o bottoni social opzionali.
8. Aggiornare `profilo.html`:
   - sezione "Sicurezza account";
   - form cambio password;
   - stato provider collegati;
   - pulsante invia link setup password se social-only.
9. Aggiornare `api.js` con i metodi endpoint nuovi.
10. Aggiornare `route-guard.js` per le nuove pagine.
11. Verificare responsive mobile e desktop.

**Verifica fase**:

```bash
dotnet build frontend/CineBase.Web/CineBase.Web.csproj
```

**Smoke manuale fase**:

- login locale continua a funzionare;
- redirect dopo login accetta solo path interni;
- recupero password mostra sempre messaggio generico;
- reset password da link consente nuovo login;
- profilo cambia password e forza nuovo login sugli altri device;
- bottoni social reindirizzano al backend start endpoint;
- `social-login-complete.html` gestisce code valido, code scaduto e code riusato.

**Esito implementazione 2026-05-10**:

- `login.html` aggiornato con link recupero password, bottoni Google/Microsoft e visualizzazione errori social da query string.
- `registrazione.html` aggiornata con bottoni social opzionali e messaggio sui provider supportati.
- `recupera-password.html`, `reimposta-password.html` e `social-login-complete.html` create con rispettivi script pagina.
- `profilo.html` aggiornato con sezione "Sicurezza account": provider collegati, cambio password per credenziali locali e invio link setup password per account social-only.
- `auth.js` contiene `sanitizeRedirectPath`, avvio login esterno e metodi per forgot/reset/change/set password; tutti i redirect login/social usano path relativi interni.
- `api.js`, `route-guard.js` e `template-loader.js` aggiornati per endpoint e pagine nuove.
- Fix runtime social reale: token response Google/Microsoft deserializzati con `JsonNamingPolicy.SnakeCaseLower`; claim provider letti da payload JWT raw dopo validazione per evitare problemi di claim mapping; Microsoft confermato con account personale e account scuola/work-school.
- Hardening SSO provider: Google usa `prompt=select_account&max_age=0`, Microsoft usa `prompt=login&max_age=0` per evitare rientro silenzioso dopo logout CineBase.
- `ExternalAuthService` passa il redirect interno validato a `social-login-complete.html`, che lo risanifica prima del redirect finale.
- Verifica automatica: `dotnet test tests/backend/FilmAPI.Tests.csproj --verbosity minimal` → 305/305 PASS, 0 FAIL, 0 SKIP; `dotnet build frontend/CineBase.Web/CineBase.Web.csproj` → OK, 0 warning, 0 errori.

**Checklist fase**:

- [x] Login UI aggiornata
- [x] Redirect login hardenizzato
- [x] Pagine recupero/reset create
- [x] Pagina social complete creata
- [x] Profilo sicurezza account aggiornato
- [x] `api.js` aggiornato
- [x] `route-guard.js` aggiornato
- [x] Build frontend verde

---

### FASE 6.1 - Fix e miglioramenti profilo, cinema preferito e UX account

**Obiettivo**: consolidare l'esperienza utente dopo la FASE 6 correggendo i problemi emersi su profilo, recupero password, cinema preferito e navigazione verso ordini/biglietti.

**Attività frontend/backend**:

1. Rifinire il recupero password per evitare qualunque enumerazione email:
   - messaggi frontend neutrali dopo submit;
   - risposta backend non distinguibile tra email esistente e non esistente;
   - test aggiornati sul testo non enumerativo.
2. Correggere la gestione del cinema preferito:
   - aggiungere azioni esplicite "Imposta preferito" in `my-cinemas.html` e `js/pages/my-cinemas.js`;
   - chiamare `API.setCinemaPreferito(cinemaId)` invece di limitarsi ad aprire il dettaglio cinema;
   - sincronizzare `localStorage` (`cb_selected_cinema`) con il valore salvato nel profilo.
3. Riorganizzare `profilo.html` per separare le aree funzionali:
   - dati personali;
   - accesso e password;
   - preferenze e credito;
   - ordini;
   - biglietti.
4. Convertire le sezioni profilo in accordion chiusi di default con menu stile dashboard:
   - menu laterale su desktop;
   - apertura di un solo pannello alla volta;
   - stato attivo nel menu;
   - supporto deep-link via hash, ad esempio `profilo.html#tickets-section`.
5. Aggiungere paginazione client-side per ordini e biglietti, mantenendo gli endpoint backend esistenti.
6. Aggiornare la voce "Biglietti" della navbar principale e della shell admin per aprire direttamente la sezione biglietti del profilo.
7. Proteggere i binding JavaScript dinamici da registrazioni multiple degli event listener dopo il render della sezione sicurezza.

**Verifica fase**:

```bash
node --check frontend/CineBase.Web/wwwroot/js/pages/profilo.js
```

```bash
node --check frontend/CineBase.Web/wwwroot/js/pages/my-cinemas.js
```

```bash
node --check frontend/CineBase.Web/wwwroot/js/admin-shell.js
```

```bash
dotnet build frontend/CineBase.Web/CineBase.Web.csproj
```

```bash
dotnet test tests/backend/FilmAPI.Tests.csproj --verbosity minimal
```

**Esito implementazione 2026-05-10**:

- Recupero password aggiornato con messaggio neutro/non enumerativo e test `PasswordCredentialsIntegrationTests` allineati.
- `my-cinemas` ora salva realmente il cinema preferito tramite API, aggiorna lo stato locale e mostra badge/azione coerenti in lista e dettaglio.
- `profilo.html` riorganizzato come dashboard account con sezioni accordion chiuse di default.
- `profilo.js` gestisce apertura/chiusura accordion, deep-link con hash, menu attivo e paginazione locale di ordini/biglietti.
- La voce "Biglietti" della navbar principale e della shell admin punta a `profilo.html#tickets-section` e apre il pannello corretto anche se l'utente è già sulla pagina profilo.
- Verifica automatica: `dotnet test tests/backend/FilmAPI.Tests.csproj --verbosity minimal` → 305/305 PASS, 0 FAIL, 0 SKIP; `dotnet build frontend/CineBase.Web/CineBase.Web.csproj` → OK, 0 warning, 0 errori; `node --check` sugli script modificati → OK.

**Checklist fase**:

- [x] Recupero password anti-enumerazione rifinito
- [x] Cinema preferito salvato da `my-cinemas`
- [x] Profilo riorganizzato in dashboard
- [x] Sezioni profilo trasformate in accordion
- [x] Ordini e biglietti paginati lato client
- [x] Link navbar "Biglietti" collegato a `#tickets-section`
- [x] Binding JavaScript dinamici protetti da duplicazioni
- [x] Build frontend verde
- [x] Test backend verdi

---

### FASE 7 - Frontend admin gestione utenti elevati

**Obiettivo**: fornire agli admin una UI operativa per account privilegiati.

**Attività frontend**:

1. Creare `frontend/CineBase.Web/wwwroot/utenti.html`.
2. Creare `frontend/CineBase.Web/wwwroot/js/pages/utenti.js`.
3. Aggiornare `admin-shell.js`:
   - aggiungere link `Utenti` visibile solo ad `Admin`;
   - evitare che `PowerUser` veda link non utilizzabili.
4. Aggiornare `route-guard.js`:
   - `utenti.html` solo `admin`.
5. Implementare tabella utenti:
   - ricerca;
   - filtro ruolo;
   - paginazione;
   - badge provider social;
   - badge password locale presente/assente;
   - badge ruolo.
6. Implementare modale invito:
   - email;
   - nome;
   - cognome;
   - ruolo `PowerUser` o `Admin`;
   - conferma prima dell'invio.
7. Implementare azioni riga:
   - cambia ruolo;
   - invia link setup password;
   - visualizza stato sicurezza.
8. Gestire errori specifici:
   - ultimo admin;
   - utente social-only non promuovibile;
   - email duplicata;
   - permessi insufficienti;
   - token invito già generato.

**Verifica fase**:

```bash
dotnet build frontend/CineBase.Web/CineBase.Web.csproj
```

**Smoke manuale fase**:

- Admin vede `utenti.html` e link sidebar;
- PowerUser non vede link e viene rediretto se apre URL diretto;
- Admin crea invito PowerUser;
- Admin crea invito Admin;
- Admin promuove utente locale;
- Admin riceve blocco chiaro su utente social-only;
- Admin non può degradare ultimo admin.

**Checklist fase**:

- [x] `utenti.html` creato
- [x] `utenti.js` creato
- [x] Sidebar admin aggiornata
- [x] Route guard aggiornata
- [x] Listing utenti operativo
- [x] Invito Admin/Power operativo
- [x] Promozione/degradazione UI operativa
- [x] Build frontend verde

---

### FASE 7.1 - GDPR: cancellazione account, portabilità dati e anonimizzazione

**Obiettivo**: rendere CineBase conforme agli articoli 15, 17, 18 e 20 del GDPR consentendo all'utente di esportare i propri dati, cancellare il proprio account e all'admin di gestire account con anonimizzazione selettiva per le transazioni soggette a obblighi fiscali e contabili.

**Analisi preliminare del modello dati — comportamento FK su cancellazione User**:

| Entità | FK | DeleteBehavior | Comportamento | Azione richiesta |
| --- | --- | --- | --- | --- |
| `RefreshToken` | `UserId` | **Cascade** | Cancellazione automatica | Nessuna |
| `UserExternalLogin` | `UserId` | **Cascade** | Cancellazione automatica | Nessuna |
| `AccountActionToken` | `UserId` | **Cascade** | Cancellazione automatica | Nessuna |
| `ExternalAuthExchangeCode` | `UserId` | **Cascade** | Cancellazione automatica | Nessuna |
| `AccountActionToken` | `CreatedByUserId` | **Restrict** | Blocca cancellazione | Impostare a NULL prima della cancellazione |
| `Ordine` | `UserId` | **Restrict** | Blocca cancellazione | **Anonimizzare**: mantenere riga, userId → placeholder |
| `Biglietto` | `UserId` | **Restrict** | Blocca cancellazione | **Anonimizzare**: mantenere riga, userId → placeholder |
| `Biglietto` | `ValidatoDaUserId` | **Restrict** | Blocca cancellazione | Impostare a NULL prima della cancellazione |
| `MovimentoCredito` | `UserId` | **Restrict** | Blocca cancellazione | **Anonimizzare**: mantenere riga, userId → placeholder |
| `MovimentoCredito` | `OperatoreUserId` | **Restrict** | Blocca cancellazione | Impostare a NULL prima della cancellazione |
| `ShowPostoStato` | `UserId` | **Restrict** | Blocca cancellazione | Eliminare righe (hold temporanei) |
| `UserSecurityAuditLog` | `UserId` | **SetNull** | Anonimizzazione automatica | Nessuna (già SetNull) |
| `UserSecurityAuditLog` | `ActorUserId` | **SetNull** | Anonimizzazione automatica | Nessuna (già SetNull) |
| `UserCinemaAssignment` | `UserId` | **Cascade/Restrict secondo FASE 7.2** | Staff assignment operativo | Disattivare/revocare assegnazioni prima o durante anonimizzazione |
| `UserCinemaAssignment` | `CreatedBy/UpdatedBy/RevokedByUserId` | **SetNull/Restrict secondo FASE 7.2** | Storico actor admin | Impostare a NULL o gestire coerentemente con FK scelte |
| `User.CinemaPreferitoId` | → `Cinema` | **SetNull** (lato Cinema) | Nessun blocco | Nessuna (FK uscente, non entrante) |

**Conseguenza architetturale**: NON si può fare `DELETE User` diretto perché le entità con `Restrict` (Ordini, Biglietti, MovimentiCredito) bloccano il DB. La strategia corretta è:

1. **Anonimizzare** i dati personali dell'utente (email, nome, cognome, telefono, password hash) sostituendoli con placeholder (`deleted_XXXX@anonymous.invalid`, `Utente`, `Anonimo`, etc.)
2. **Rilasciare** gli hold temporanei (`ShowPostoStato`)
3. **Annullare** i FK che bloccano (`CreatedByUserId`, `ValidatoDaUserId`, `OperatoreUserId`)
4. **Conservare** Ordini, Biglietti e MovimentiCredito con userId intatto (il record User esiste ancora, ma anonimizzato)
5. Le entità Cascade vengono gestite automaticamente dal DB

**Domanda architetturale: quale approccio per ordini/biglietti/credito?** Due strade possibili:

| Approccio | Pro | Contro | Decisione |
| --- | --- | --- | --- |
| **A — User row mantenuta anonimizzata** | Ordini/biglietti/credito restano collegati a un userId valido (tutti i JOIN funzionano); nessuna migration; semplice | Una riga "fantasma" resta nella tabella Users | **Consigliato e adottato** |
| **B — Delete reale + migration FK nullable** | Nessuna riga residua in Users | Richiede migration per rendere nullable `Ordine.UserId`, `Biglietto.UserId`, `MovimentoCredito.UserId`; impatta tutte le query esistenti; rischioso | **Scartato per questa iterazione** |

**Vincoli di cancellazione per ruolo**:

| Ruolo utente da cancellare | Auto-cancellazione | Cancellazione da Admin |
| --- | --- | --- |
| `User` | **Consentita**, con doppia conferma email | **Consentita** |
| `CinemaStaff` | **Consentita**, con doppia conferma email; assegnazioni operative revocate | **Consentita**; assegnazioni operative revocate |
| `PowerUser` | **Consentita**, con doppia conferma email | **Consentita** |
| `Admin` | **Consentita**, con doppia conferma email | **Bloccata se ultimo admin**; consentita altrimenti |
| Qualsiasi ruolo con transazioni attive | **Consentita** (dati anonimizzati, transazioni conservate) | **Consentita** (idem) |

**Regola anti-abuso per admin**: un admin non può cancellare un altro admin se quest'ultimo è l'unico admin rimasto.

---

### 7.1.1 — Backend: servizio cancellazione e anonimizzazione

**Nuovo servizio**: `IAccountDeletionService` / `AccountDeletionService`

```text
IAccountDeletionService
  Task<UserDataExportDTO> ExportUserDataAsync(int userId)
  Task RequestDeletionAsync(int userId, TokenCreationContext context)
  Task ConfirmDeletionAsync(string token, TokenCreationContext context)
  Task AdminDeleteUserAsync(int userId, int requestingUserId, TokenCreationContext context)
  Task AdminToggleDisableAsync(int userId, int requestingUserId)
  Task AdminAnonymizeUserAsync(int userId, int requestingUserId)
```

**Flusso auto-cancellazione utente**:

1. Utente autenticato chiama `POST /auth/me/delete/request`.
2. Backend crea token `AccountActionTokenPurpose.DeleteAccount` (nuovo valore enum), TTL 60 minuti.
3. Backend invia email di conferma con link `conferma-cancellazione.html?token=...`.
4. Utente clicca il link (o visita la pagina e conferma).
5. Frontend chiama `POST /auth/me/delete/confirm` con il token.
6. Backend consuma il token, esegue l'anonimizzazione, revoca tutte le sessioni e risponde `200`.
7. L'utente viene disconnesso. Qualsiasi tentativo di login con la vecchia email fallisce.

**Flusso cancellazione da admin**:

1. Admin autenticato chiama `DELETE /admin/utenti/{id}`.
2. Backend verifica: l'admin non cancella sé stesso se è ultimo admin; il target non è admin se l'operazione lascerebbe zero admin.
3. Backend verifica che l'admin abbia il ruolo `Admin`.
4. Backend esegue anonimizzazione immediata (senza conferma email del target — l'admin agisce come titolare del trattamento).
5. Audit `AdminDeletedUser` con actorUserId = admin, userId = target.
6. Risposta `200` con conferma.

**Algoritmo di anonimizzazione** (`AnonymizeUserAsync`):

1. Carica User con tutte le navigation property rilevanti.
2. Rilascia `ShowPostoStato` dove `UserId == userId` (DELETE).
3. Annulla `AccountActionToken.CreatedByUserId` dove `CreatedByUserId == userId` (SET NULL).
4. Annulla `Biglietto.ValidatoDaUserId` dove `ValidatoDaUserId == userId` (SET NULL).
5. Annulla `MovimentoCredito.OperatoreUserId` dove `OperatoreUserId == userId` (SET NULL).
6. Se esistono `UserCinemaAssignment`, revoca/disattiva le assegnazioni operative attive.
7. Revoca tutti i `RefreshToken` attivi.
8. Sostituisce dati personali:
   - `Email` → `deleted_{userId}@anonymous.invalid`
   - `NormalizedEmail` → `DELETED_{userId}@ANONYMOUS.INVALID`
   - `Nome` → `Utente`
   - `Cognome` → `Anonimo`
   - `Telefono` → `null`
   - `PasswordHash` → `null`
   - `LocalCredentialsEnabled` → `false`
   - `IsDisabled` → `true`
   - `AuthVersion` → incrementato
   - `AnonymizedAtUtc` → `DateTime.UtcNow` (nuovo campo)
9. Audit `AccountAnonymized`.
10. Salva modifiche.

**Nuovo campo su `User`**:

```text
AnonymizedAtUtc datetime?
```

Indica quando l'account è stato anonimizzato. Se valorizzato, tutti i login sono bloccati a prescindere da `IsDisabled`.

**Nuovo valore enum `AccountActionTokenPurpose`**:

```text
DeleteAccount = 3
```

---

### 7.1.2 — Backend: esportazione portabilità dati (GDPR art. 20)

**Nuovo DTO**: `UserDataExportDTO`

```text
UserDataExportDTO
  Profile: UserProfileDTO (email, nome, cognome, telefono, dataRegistrazione, ruolo)
  Security: AccountSecurityDTO (provider, ultimo login, auth version)
  Ordini: List<OrdineSummaryDTO>
  Biglietti: List<BigliettoSummaryDTO>
  Credito: List<MovimentoCreditoExportDTO>
  ExternalLogins: List<ExternalLoginInfoDTO>
  CinemaStaffAssignments: List<CinemaStaffAssignmentDTO>
  RichiestoIl: DateTime
  Formato: "JSON" / "CSV"
```

**Nuovo endpoint**: `POST /auth/me/export` [Authenticated]

- Restituisce JSON strutturato con TUTTI i dati personali dell'utente.
- Non richiede token di conferma (l'utente è già autenticato).
- Audit `UserDataExported`.

**Nuovo endpoint admin**: `POST /admin/utenti/{id}/export` [AdminOnly]

- Stesso comportamento, accessibile solo da Admin.
- Audit con `actorUserId`.

---

### 7.1.3 — Backend: toggle IsDisabled (GDPR art. 18 — limitazione)

**Nuovo endpoint**: `POST /admin/utenti/{id}/disable` e `POST /admin/utenti/{id}/enable` [AdminOnly]

- Abilita/disabilita l'account.
- Se l'utente è anonimizzato (`AnonymizedAtUtc != null`), restituire errore.
- Se si disabilita l'ultimo admin, restituire errore.
- Audit `AccountDisabled` / `AccountEnabled`.
- Disabilitare revoca refresh token; riabilitare non li ripristina.

---

### 7.1.4 — Backend: nuovi endpoint riepilogativi

| Endpoint | Auth | Scopo |
| --- | --- | --- |
| `POST /auth/me/export` | `Authenticated` | Esporta tutti i dati personali in JSON |
| `POST /auth/me/delete/request` | `Authenticated` | Richiede cancellazione account (invia email conferma) |
| `POST /auth/me/delete/confirm` | `Anonymous` | Conferma cancellazione con token email |
| `DELETE /admin/utenti/{id}` | `AdminOnly` | Cancella/anomizza utente (admin) |
| `POST /admin/utenti/{id}/export` | `AdminOnly` | Esporta dati personali utente |
| `POST /admin/utenti/{id}/disable` | `AdminOnly` | Disabilita account |
| `POST /admin/utenti/{id}/enable` | `AdminOnly` | Riabilita account |

---

### 7.1.5 — Modifiche a `AuthService.LoginAsync`

Estendere `LoginAsync` per bloccare login su account anonimizzati:

```csharp
if (user.AnonymizedAtUtc is not null)
    throw new UnauthorizedAccessException("Credenziali non valide");
```

---

### 7.1.6 — Modifiche a `IAccountEmailService` / `AccountEmailService`

Aggiungere metodo:

```csharp
Task<EmailSendResult> SendAccountDeletionConfirmationAsync(string toEmail, string toName, string confirmationUrl)
```

Template email: conferma cancellazione con link monouso, warning su irreversibilità, riferimento a obblighi fiscali per conservazione transazioni.

---

### 7.1.7 — Frontend: sezione "Privacy e dati" nel profilo

Aggiungere a `profilo.html` nella sezione "Sicurezza account":

- **Pulsante "Esporta i miei dati"**: chiama `POST /auth/me/export`, scarica JSON.
- **Pulsante "Cancella il mio account"**: apre modale di conferma con:
  - Warning: "La cancellazione è irreversibile. I dati delle transazioni (ordini, biglietti, credito) saranno conservati in forma anonima per obblighi fiscali (10 anni)."
  - Campo: "Scrivi CANCELLA per confermare" (anti-click accidentale).
  - Bottone "Richiedi cancellazione" che chiama `POST /auth/me/delete/request`.
  - Messaggio: "Abbiamo inviato un'email di conferma. Clicca il link per completare la cancellazione."

---

### 7.1.8 — Frontend: pagina `conferma-cancellazione.html`

Nuova pagina pubblica che:
- Legge `?token=` dalla query string.
- Chiama `POST /auth/me/delete/confirm` con il token.
- Mostra esito: successo ("Account cancellato. Grazie per aver usato CineBase.") o errore ("Token non valido, scaduto o già utilizzato.").
- In caso di successo, cancella token da localStorage e reindirizza a `index.html`.

---

### 7.1.9 — Frontend: azioni admin in `utenti.html`

Aggiungere alla tabella utenti in `utenti.html`:

- **Colonna "Stato"**: badge `Attivo` (verde), `Disabilitato` (grigio), `Anonimizzato` (rosso).
- **Azione "Disabilita/Riabilita"**: toggle con conferma.
- **Azione "Esporta dati"**: scarica JSON dei dati dell'utente.
- **Azione "Cancella utente"**: modale di conferma con:
  - Warning: "Stai per anonimizzare tutti i dati personali di questo utente. Ordini e biglietti saranno conservati in forma anonima. Operazione irreversibile."
  - Campo: "Scrivi il nome utente per confermare."
  - Bottone "Cancella utente" che chiama `DELETE /admin/utenti/{id}`.
- **Blocco UI**: se l'utente target è l'ultimo admin, il pulsante "Cancella" è disabilitato con tooltip "Non puoi cancellare l'ultimo admin".
- **Blocco UI**: se l'utente target è già anonimizzato, tutte le azioni tranne "Esporta dati" sono disabilitate.

---

### 7.1.10 — Variabili environment

```env
# GDPR / Account deletion
ACCOUNT_DELETION_TOKEN_TTL_MINUTES=60
```

---

### 7.1.11 — Test automatici minimi

**Backend** (`tests/backend/Integration/AccountDeletionIntegrationTests.cs`):

- AD1: Export dati utente con ordini e biglietti → OK
- AD2: Export dati utente senza transazioni → OK vuoto
- AD3: Richiesta cancellazione invia email con token
- AD4: Conferma cancellazione con token valido → account anonimizzato
- AD5: Conferma cancellazione con token scaduto → rifiutato
- AD6: Conferma cancellazione con token riusato → rifiutato
- AD7: Login dopo anonimizzazione → rifiutato
- AD8: Admin cancella utente → anonimizzazione immediata
- AD9: Admin non può cancellare ultimo admin
- AD10: Admin non può cancellare admin se rimarrebbe zero admin
- AD11: Toggle IsDisabled → OK
- AD12: Toggle IsDisabled ultimo admin → bloccato
- AD13: Toggle IsDisabled utente anonimizzato → bloccato
- AD14: Anonimizzazione preserva ordini e biglietti (userId intatto)
- AD15: Anonimizzazione cancella refresh token
- AD16: Anonimizzazione cancella show posti stato
- AD17: PowerUser non può accedere a endpoint admin cancellazione
- AD18: User non può accedere a endpoint admin cancellazione
- AD19: Audit scritto per cancellazione e export
- AD20: cancellazione/anomizzazione `CinemaStaff` revoca assegnazioni operative attive
- AD21: export dati `CinemaStaff` include assegnazioni cinema/capability

**Frontend** (manuale/smoke):
- Profilo: pulsante esporta dati scarica JSON
- Profilo: flusso cancellazione con modale e link email
- `conferma-cancellazione.html`: token valido mostra successo
- `conferma-cancellazione.html`: token invalido mostra errore
- `utenti.html`: admin vede colonna stato e azioni
- `utenti.html`: admin cancella utente con modale
- `utenti.html`: admin non può cancellare ultimo admin (pulsante disabilitato)

---

### 7.1.12 — Nuovi file previsti

**Backend**:
- `Services/IAccountDeletionService.cs`
- `Services/AccountDeletionService.cs`
- `DTO/UserDataExportDTO.cs`
- `Model/AccountActionTokenPurpose.cs` (modifica: aggiungere `DeleteAccount = 3`)
- `Model/User.cs` (modifica: aggiungere `AnonymizedAtUtc`)
- `Services/AuthService.cs` (modifica: bloccare login account anonimizzati)
- `Services/IAccountEmailService.cs` (modifica: `SendAccountDeletionConfirmationAsync`)
- `Services/AccountEmailService.cs` (modifica)
- `Endpoints/AuthEndpoints.cs` (modifica: nuovi endpoint `/auth/me/...`)
- `Endpoints/AdminUtentiEndpoints.cs` (modifica: nuovi endpoint disable/enable/delete/export)
- `Data/FilmDbContext.cs` (modifica: nuovo campo User)
- `Migrations/..._AddAccountDeletionFields.cs` (nuova migration)

**Test**:
- `tests/backend/Integration/AccountDeletionIntegrationTests.cs`
- `tests/backend/Integration/CustomWebApplicationFactory.cs` (modifica: helper per utenti anonimizzati)

**Frontend**:
- `frontend/CineBase.Web/wwwroot/conferma-cancellazione.html`
- `frontend/CineBase.Web/wwwroot/js/pages/conferma-cancellazione.js`
- `frontend/CineBase.Web/wwwroot/profilo.html` (modifica: sezione privacy)
- `frontend/CineBase.Web/wwwroot/js/pages/profilo.js` (modifica)
- `frontend/CineBase.Web/wwwroot/utenti.html` (modifica: azioni admin)
- `frontend/CineBase.Web/wwwroot/js/pages/utenti.js` (modifica)
- `frontend/CineBase.Web/wwwroot/js/api.js` (modifica: nuovi metodi)
- `frontend/CineBase.Web/wwwroot/js/route-guard.js` (modifica: nuova pagina)

---

### 7.1.13 — Criteri di accettazione specifici

1. Utente autenticato può esportare tutti i suoi dati personali in JSON.
2. Utente autenticato può richiedere la cancellazione del proprio account.
3. La cancellazione richiede doppia conferma via email (link con token temporaneo single-use).
4. Dopo la cancellazione, i dati personali sono anonimizzati (email → placeholder, nome/cognome → "Utente Anonimo", password hash → null).
5. Dopo la cancellazione, ordini, biglietti e movimenti credito sono conservati con userId intatto ma dati personali non più recuperabili.
6. Dopo la cancellazione, il login con le vecchie credenziali è impossibile.
7. Admin può cancellare/anomizzare un account utente senza conferma email del target.
8. Admin non può cancellare l'ultimo admin.
9. Admin non può cancellare un admin se rimarrebbe zero admin.
10. Admin può disabilitare/riabilitare account.
11. Admin non può disabilitare l'ultimo admin.
12. Admin può esportare i dati personali di qualsiasi utente.
13. Ogni operazione di cancellazione, export, disable/enable produce audit log.
14. Utenti anonimizzati non possono effettuare login né social login.
15. Utenti `CinemaStaff` anonimizzati o disabilitati non mantengono assegnazioni operative attive.
16. Build backend e frontend verdi.
17. Test automatici backend specifici tutti verdi.
18. `backend/.env.example` aggiornato.

---

### 7.1.14 — Stima effort

| Attività | Tempo stimato |
| --- | --- |
| Enum `DeleteAccount`, campo `AnonymizedAtUtc`, migration | 30-45 min |
| `AccountDeletionService` (anonimizzazione, export, cancellazione) | 90-150 min |
| Nuovi endpoint auth/admin (7 endpoint) | 60-90 min |
| Modifiche `AuthService` (blocco login anonimizzati) | 15-30 min |
| Estensione `AccountEmailService` (email conferma cancellazione) | 30-45 min |
| Frontend profilo (export, cancellazione) | 60-90 min |
| Frontend `conferma-cancellazione.html` | 30-45 min |
| Frontend `utenti.html` (azioni admin GDPR) | 60-90 min |
| Test backend (19 test) | 90-120 min |
| Smoke test e verifica manuale | 30-60 min |
| Documentazione e `.env.example` | 15-30 min |
| **Totale realistico** | **1-1.5 giornate tecniche** |

---

### 7.1.15 — Checklist fase

- [x] Enum `DeleteAccount` aggiunto a `AccountActionTokenPurpose`
- [x] Campo `AnonymizedAtUtc` aggiunto a `User` + migration
- [x] `AccountDeletionService` implementato
- [x] Endpoint cancellazione/export/toggle mappati
- [x] `AuthService` blocca login account anonimizzati
- [x] Email conferma cancellazione implementata
- [x] Frontend profilo: export dati e richiesta cancellazione
- [x] Frontend `conferma-cancellazione.html` creato
- [x] Frontend `utenti.html`: azioni admin GDPR
- [x] `api.js`, `route-guard.js` aggiornati
- [x] Test backend account deletion verdi (22 test)
- [x] Build backend verde
- [x] Build frontend verde
- [x] `.env.example` aggiornato
- [x] `ExternalAuthService` hardening (check `AnonymizedAtUtc` su `existingLogin`)
- [x] `AnonymizeUserInternalAsync` elimina fisicamente `UserExternalLogin`
- [x] `showConfirm` usa `innerHTML` per supportare HTML nei modali
- [x] Smoke test ri-registrazione Microsoft post-cancellazione OK

---

### FASE 7.2 - CinemaStaff scoped per cinema e permessi operativi

**Obiettivo**: introdurre un profilo operativo per i dipendenti CineBase che consenta di lavorare solo sui cinema assegnati, senza concedere i privilegi globali di `PowerUser` e senza esporre funzioni amministrative.

Questa fase nasce da una distinzione funzionale importante:

- `User` è cliente finale.
- `CinemaStaff` è personale operativo locale, vincolato a uno o più cinema e a capability esplicite.
- `PowerUser` è backoffice globale non amministrativo.
- `Admin` è amministratore globale con gestione utenti, ruoli, assegnazioni e cinema.

**Decisione vincolante**: `CinemaStaff` non è un `PowerUser` con link nascosti. Deve avere enforcement backend su ogni operazione sensibile.

---

### 7.2.1 — Analisi delle superfici attuali da correggere

| Area | Stato attuale | Rischio | Correzione richiesta |
| --- | --- | --- | --- |
| Validazione biglietti | `/admin/tickets/validate` è `PowerUserOrAdmin`; lookup per codice non richiede scope cinema backend | Un operatore ammesso potrebbe vedere o validare ticket di qualunque cinema se conosce il codice o manipola `CinemaId` | Ammettere `CinemaStaff`, ma richiedere `CanValidateTickets` sul cinema e verificare ticket-cinema lato backend |
| Ricarica credito | `/admin/credito` è `PowerUserOrAdmin`; ricerca utenti e storico sono globali | Un dipendente locale avrebbe visibilità e potere economico troppo ampi | Ammettere `CinemaStaff` solo con `CanTopUpCredit`, `CinemaId` obbligatorio e storico filtrato |
| Gestione show | `POST/PUT/DELETE /shows` sono `PowerUserOrAdmin` globali | Un dipendente potrebbe creare/modificare show in cinema non propri | Ammettere `CinemaStaff` solo con `CanManageShows` sul cinema effettivo dello show |
| Sale/layout | `sale.html` e endpoint sale sono `PowerUserOrAdmin` | Layout posti e sale sono configurazione strutturale, non attività base di staff | Lasciare `PowerUserOrAdmin`; `CinemaStaff` può solo leggere sale pubbliche necessarie agli show |
| Catalogo film/registi/categorie/media | Endpoint globali `PowerUserOrAdmin` | Catalogo condiviso da tutta la piattaforma | Escludere `CinemaStaff` |
| Cinema CRUD | Backend già `AdminOnly`; frontend oggi va ricontrollato | Creare/modificare cinema è amministrazione piattaforma | Restare `AdminOnly` |
| Gestione utenti | `utenti.html` e `/admin/utenti` sono `AdminOnly` | Escalation ruoli/assegnazioni | Restare `AdminOnly`, estendendo la pagina per assegnazioni staff |
| Social login | blocca già `PowerUser/Admin` | `CinemaStaff` sarebbe privilegiato ma potrebbe entrare via provider pubblico | Estendere blocco social anche a `CinemaStaff` |
| GDPR deletion | anonimizza utente e resetta FK operative | Assegnazioni staff potrebbero restare attive su utente anonimizzato/disabilitato | Revocare o disattivare assegnazioni in anonimizzazione e disabilitazione |

---

### 7.2.2 — Backend: modello dati e migration

**Modifiche obbligatorie**:

1. Estendere `UserRole` senza rinumerare valori esistenti:

```csharp
public enum UserRole
{
    User = 0,
    PowerUser = 1,
    Admin = 2,
    CinemaStaff = 3
}
```

2. Creare model `UserCinemaAssignment` come descritto nella sezione 4.7.

3. Aggiornare `User`:

```csharp
public List<UserCinemaAssignment> CinemaAssignments { get; set; } = new();
```

4. Aggiornare `Cinema` se utile:

```csharp
public List<UserCinemaAssignment> StaffAssignments { get; set; } = new();
```

5. Aggiornare `FilmDbContext`:

- `DbSet<UserCinemaAssignment>`;
- unique index `(UserId, CinemaId)`;
- indici `(UserId, IsActive)`, `(CinemaId, IsActive)`;
- vincoli FK e delete behavior documentati nella migration.

6. Creare migration consigliata:

```text
AddCinemaStaffAssignments
```

7. Ispezionare migration verificando:

- nessun cambio ai valori esistenti `UserRole` in DB;
- nessuna modifica distruttiva a utenti esistenti;
- nessun impatto su ordini, biglietti, credito e show esistenti;
- tabella `UserCinemaAssignments` creata con unique constraint e indici.

8. Aggiornare `DataSeeder` solo se utile per sviluppo locale:

- creare un utente `CinemaStaff` demo con password locale;
- assegnarlo a 1-2 cinema seed con capability differenziate;
- non rendere obbligatorio il seed se complica test esistenti.

**Nota delicata**: non convertire automaticamente utenti `PowerUser` esistenti a `CinemaStaff`. La fase introduce il nuovo ruolo, ma la classificazione di account reali deve essere decisione amministrativa esplicita.

---

### 7.2.3 — Backend: policy, helper e servizio autorizzazione cinema

**Policy consigliate in `Program.cs`**:

```csharp
options.AddPolicy("CinemaStaffOrPowerUserOrAdmin", policy =>
    policy.RequireAssertion(context => HasAnyRole(context, "CinemaStaff", "PowerUser", "Admin")));

options.AddPolicy("GlobalBackoffice", policy =>
    policy.RequireAssertion(context => HasAnyRole(context, "PowerUser", "Admin")));
```

`PowerUserOrAdmin` può restare per compatibilità, ma non deve essere riutilizzata per endpoint che ora ammettono `CinemaStaff`.

**Servizio obbligatorio**: `ICinemaAccessService` / `CinemaAccessService`.

Responsabilità:

- leggere ruolo corrente e userId;
- trattare `PowerUser` e `Admin` come globali;
- trattare `CinemaStaff` come autorizzato solo se esiste assegnazione attiva sul cinema con la capability richiesta;
- rifiutare `User`, anonimo, account disabilitati o anonimizzati;
- fornire lista cinema operativi per la UI;
- centralizzare messaggi/exception per evitare controlli duplicati nei servizi.

Metodi consigliati:

```text
Task<IReadOnlyList<OperationalCinemaDTO>> GetOperationalCinemasAsync(int userId, UserRole role)
Task<bool> CanValidateTicketsAsync(int userId, UserRole role, int cinemaId)
Task<bool> CanTopUpCreditAsync(int userId, UserRole role, int cinemaId)
Task<bool> CanManageShowsAsync(int userId, UserRole role, int cinemaId)
Task EnsureCanValidateTicketsAsync(int userId, UserRole role, int cinemaId)
Task EnsureCanTopUpCreditAsync(int userId, UserRole role, int cinemaId)
Task EnsureCanManageShowsAsync(int userId, UserRole role, int cinemaId)
```

Eccezioni consigliate:

- `UnauthorizedAccessException` o errore applicativo mappato a `403` per permesso mancante;
- `ArgumentException` mappato a `400` per `CinemaId` invalido;
- `KeyNotFoundException` mappato a `404` solo quando la risorsa non esiste, non quando esiste ma fuori scope.

Regola anti information disclosure:

- Se una risorsa esiste ma il `CinemaStaff` non è autorizzato, preferire `403` con messaggio generico oppure `404` coerente per non confermare l'esistenza. Scegliere una strategia e testarla.
- Per validazione ticket, messaggi troppo specifici possono aiutare l'operatore ma anche rivelare dati. Per `CinemaStaff`, evitare di mostrare dettagli del ticket finché il cinema non è autorizzato.

---

### 7.2.4 — Backend: estensione admin utenti e assegnazioni staff

Estendere `UserAdminService` e DTO esistenti.

**DTO da aggiornare/creare**:

- `AdminUserListItemDTO`: aggiungere ruolo `CinemaStaff`, `StaffAssignmentsCount`, `StaffAssignedCinemaNames` sintetico.
- `AdminUserSecurityDTO`: includere assegnazioni staff attive/revocate.
- `CreateAdminUserInviteDTO`: consentire `Ruolo = CinemaStaff` e lista assegnazioni iniziali opzionale/obbligatoria secondo decisione UI.
- `UpdateRuoloDTO`: consentire cambio a/da `CinemaStaff`.
- `CinemaStaffAssignmentDTO`, `CinemaStaffAssignmentsUpdateDTO`.

**Endpoint admin da aggiungere**:

```text
GET /admin/utenti/{id}/cinema-assignments
PUT /admin/utenti/{id}/cinema-assignments
```

**Regole creazione/invito `CinemaStaff`**:

- Solo `AdminOnly`.
- Email duplicata → `409` come inviti esistenti.
- Account creato come `IsDisabled = true`, `LocalCredentialsEnabled = false`, `MustChangePassword = true`, coerente con inviti PowerUser/Admin.
- Completamento invito via token `AdminInvite` abilita account.
- Social-only non può essere promosso a `CinemaStaff` finché non imposta password locale.
- L'invito `CinemaStaff` deve includere obbligatoriamente almeno una assegnazione attiva con almeno una capability.
- Se il payload non contiene almeno una assegnazione attiva valida, il backend deve rifiutare la richiesta con `400` o `409` coerente.

**Regole modifica ruolo**:

- `User -> CinemaStaff`: richiede `LocalCredentialsEnabled = true`, `IsDisabled = false`, almeno una assegnazione valida o assegnazione contestuale.
- `CinemaStaff -> User`: revocare o disattivare tutte le assegnazioni staff.
- `CinemaStaff -> PowerUser/Admin`: le assegnazioni possono restare come storico ma non devono limitare il ruolo globale; documentare se vengono revocate o ignorate.
- `PowerUser/Admin -> CinemaStaff`: rimuove privilegi globali; richiede assegnazioni staff valide.
- Ogni cambio ruolo incrementa `AuthVersion`, revoca refresh token e audit `RoleChanged`.

**Regole modifica assegnazioni**:

- Solo `AdminOnly`.
- Cinema deve esistere.
- Non permettere duplicati nella lista inviata.
- Non salvare assegnazione con tutte le capability false, salvo se `IsActive = false` e usata come storico.
- Se l'utente target ha ruolo `CinemaStaff`, il payload finale deve contenere almeno una assegnazione attiva valida; in caso contrario, rifiutare l'update.
- Aggiornare righe esistenti invece di eliminarle quando possibile, per mantenere storico audit.
- Se una assegnazione viene rimossa dalla UI, impostare `IsActive = false`, `RevokedAtUtc`, `RevokedByUserId` invece di cancellare fisicamente.
- Incrementare `AuthVersion` dell'utente target e revocare refresh token.
- Audit `CinemaStaffAssignmentCreated`, `CinemaStaffAssignmentUpdated`, `CinemaStaffAssignmentRevoked` con metadata JSON: cinemaId, capability prima/dopo, actor.

---

### 7.2.5 — Backend: validazione biglietti scoped

File coinvolti:

- `Endpoints/ValidazioneBigliettiEndpoints.cs`
- `Services/ValidazioneBigliettoService.cs`
- `Services/BigliettoService.cs` se il lookup resta centralizzato lì
- `DTO/BigliettoDTO.cs`

Modifiche richieste:

1. Cambiare authorization group da `PowerUserOrAdmin` a `CinemaStaffOrPowerUserOrAdmin`.
2. Modificare lookup per richiedere `cinemaId` almeno per `CinemaStaff`:

```text
GET /admin/tickets/validate/{code}?cinemaId=123
```

3. Prima di restituire dettagli ticket, verificare:

- operatore autenticato valido;
- cinema richiesto valido;
- operatore ha `CanValidateTickets` su quel cinema;
- ticket appartiene a quel cinema.

4. In `POST /admin/tickets/validate`, prima di validare:

- normalizzare codice;
- verificare `dto.CinemaId`;
- chiamare `EnsureCanValidateTicketsAsync`;
- poi verificare che il ticket appartenga al cinema richiesto.

5. Scrivere audit operativo facoltativo ma consigliato:

- successo: `CinemaStaffOperationalAction` con action `TicketValidated`;
- rifiuto scope: `CinemaStaffAccessDenied`.

Test minimi:

- staff con `CanValidateTickets` valida biglietto del proprio cinema: OK;
- staff senza capability su quel cinema: `403`;
- staff assegnato a cinema A tenta ticket cinema B: `403` o `409` coerente, ma non deve validare;
- staff con solo `CanTopUpCredit` non valida ticket: `403`;
- PowerUser/Admin validano qualunque cinema come prima;
- User/anonimo bloccati;
- lookup senza `cinemaId` per staff bloccato;
- lookup ticket altro cinema non espone dettagli a staff non autorizzato.

---

### 7.2.6 — Backend: credito scoped

File coinvolti:

- `Endpoints/CreditoEndpoints.cs`
- `Services/CreditoService.cs`
- `DTO/CreditoDTO.cs`

Modifiche richieste:

1. Cambiare group `/admin/credito` da `PowerUserOrAdmin` a `CinemaStaffOrPowerUserOrAdmin`.
2. `POST /admin/credito/ricariche`:

- per `CinemaStaff`, `dto.CinemaId` deve essere obbligatorio;
- verificare `CanTopUpCredit` su `dto.CinemaId`;
- importo deve restare positivo;
- movimento credito deve salvare `OperatoreUserId` e `CinemaId`;
- audit operativo consigliato.

3. `GET /admin/credito/ricariche`:

- per `CinemaStaff`, filtrare sempre per cinema assegnati con `CanTopUpCredit`;
- se viene passato `cinemaId`, verificare che sia autorizzato;
- se non viene passato `cinemaId`, restituire solo movimenti dei cinema autorizzati, non globale;
- PowerUser/Admin mantengono vista globale o filtro opzionale.

4. `GET /admin/credito/users?email=`:

- per `CinemaStaff`, richiedere query email non vuota;
- preferire almeno 3 caratteri o formato email completo;
- non restituire listing globale degli utenti;
- restituire solo campi minimi necessari alla ricarica: id, email, nome, cognome, saldo;
- PowerUser/Admin possono mantenere comportamento esistente se necessario.

Test minimi:

- staff con `CanTopUpCredit` ricarica utente su cinema assegnato: OK;
- staff tenta ricarica con `CinemaId = null`: `400`;
- staff tenta cinema non assegnato: `403`;
- staff senza capability top-up: `403`;
- staff vede storico solo dei cinema autorizzati;
- staff search utenti senza email/query: `400`;
- PowerUser/Admin ricaricano come prima;
- movimento credito registra operatore e cinema corretti;
- audit scritto o, se non implementato, motivazione documentata.

---

### 7.2.7 — Backend: gestione show scoped

File coinvolti:

- `Endpoints/ShowsEndpoints.cs`
- `Services/ShowService.cs`
- `DTO/ShowDTO.cs` se serve aggiungere metadata di permesso

Modifiche richieste:

1. Lasciare `GET /shows` e `GET /shows/{id}` pubblici come oggi.
2. Cambiare `POST/PUT/DELETE /shows` da `PowerUserOrAdmin` a `CinemaStaffOrPowerUserOrAdmin`.
3. `POST /shows`:

- verificare `CanManageShows` su `dto.CinemaId`;
- verificare che la sala appartenga al cinema come già avviene;
- mantenere anti-overlap esistente.

4. `PUT /shows/{id}`:

- caricare lo show esistente prima di applicare update;
- verificare `CanManageShows` sul cinema attuale dello show;
- se `dto.CinemaId` cambia, verificare anche `CanManageShows` sul nuovo cinema;
- impedire a staff di spostare show tra cinema non autorizzati;
- mantenere controlli sala/cinema e anti-overlap.

5. `DELETE /shows/{id}`:

- caricare show e verificarne il cinema;
- verificare `CanManageShows`;
- mantenere blocco se esistono biglietti emessi.

6. Listing UI per `CinemaStaff`:

- il backend pubblico può restare globale, ma la pagina `shows.html` per staff deve usare i cinema autorizzati come filtro;
- se si introduce un endpoint dedicato filtrato, preferire `GET /staff/me/cinemas` + `GET /shows?cinemaId=`.

Test minimi:

- staff con `CanManageShows` crea show nel proprio cinema: OK;
- staff tenta cinema non assegnato: `403`;
- staff con solo validazione non crea show: `403`;
- staff modifica show del proprio cinema: OK;
- staff modifica show di altro cinema: `403`;
- staff tenta di spostare show verso cinema non assegnato: `403`;
- staff cancella show del proprio cinema senza biglietti: OK;
- staff non cancella show con biglietti emessi: conflict esistente;
- PowerUser/Admin comportamento globale invariato;
- User/anonimo non possono creare/modificare/cancellare show.

---

### 7.2.8 — Frontend: route guard, shell e pagine operative

File coinvolti:

- `frontend/CineBase.Web/wwwroot/js/auth.js`
- `frontend/CineBase.Web/wwwroot/js/route-guard.js`
- `frontend/CineBase.Web/wwwroot/js/admin-shell.js`
- `frontend/CineBase.Web/wwwroot/js/template-loader.js`
- `frontend/CineBase.Web/wwwroot/js/api.js`
- `frontend/CineBase.Web/wwwroot/js/pages/shows.js`
- `frontend/CineBase.Web/wwwroot/js/pages/ricarica-credito.js`
- `frontend/CineBase.Web/wwwroot/js/pages/validazione-biglietti.js`
- `frontend/CineBase.Web/wwwroot/js/pages/utenti.js`

Modifiche richieste:

1. Normalizzare ruolo `CinemaStaff`:

- `auth.js` e `route-guard.js` devono riconoscere stringa `CinemaStaff`, eventuale valore numerico `3` e forma normalizzata `cinemastaff`.

2. Aggiornare `PAGE_PERMISSIONS`:

- `dashboard.html`: `cinemastaff`, `poweruser`, `admin`;
- `shows.html`: `cinemastaff`, `poweruser`, `admin`;
- `ricarica-credito.html`: `cinemastaff`, `poweruser`, `admin`;
- `validazione-biglietti.html`: `cinemastaff`, `poweruser`, `admin`;
- `films.html`, `registi.html`, `categorie.html`, `sale.html`: solo `poweruser`, `admin`;
- `utenti.html`: solo `admin`;
- `cinemas.html`: consigliato solo `admin`, coerente con backend `AdminOnly` su CRUD cinema; `CinemaStaff` non deve accedere.

3. Aggiornare `admin-shell.js`:

- nascondere link non autorizzati tramite `data-admin-roles`;
- mostrare a `CinemaStaff` solo Dashboard, Show, Ricarica Credito, Validazione e Profilo/Biglietti;
- se `CinemaStaff` non ha capability per una pagina, nascondere link o mostrare stato disabilitato con spiegazione;
- mantenere `Utenti` solo Admin.

4. Aggiungere API:

```javascript
API.getOperationalCinemas()
API.getUserCinemaAssignments(userId)
API.updateUserCinemaAssignments(userId, assignments)
```

5. `shows.js`:

- per `CinemaStaff`, caricare cinema operativi da `/staff/me/cinemas`;
- mostrare solo cinema con `CanManageShows`;
- pre-selezionare il primo cinema autorizzato;
- impedire submit se nessun cinema autorizzato;
- non mostrare dropdown globale dei cinema per staff;
- gestire `403` mostrando messaggio chiaro.

6. `ricarica-credito.js`:

- per `CinemaStaff`, caricare solo cinema con `CanTopUpCredit`;
- rendere cinema obbligatorio e non manipolabile fuori elenco;
- search utente richiede email/query;
- storico ricariche filtrato sui cinema autorizzati.

7. `validazione-biglietti.js`:

- per `CinemaStaff`, caricare solo cinema con `CanValidateTickets`;
- inviare sempre `cinemaId` anche nella lookup `GET`;
- mantenere modalità Auto Click, ma solo dopo cinema autorizzato selezionato;
- se nessun cinema autorizzato, disabilitare scanner/input e mostrare messaggio.

8. `utenti.js`:

- aggiungere ruolo `CinemaStaff` nei filtri e nelle modali;
- modale invito staff con selezione cinema/capability;
- modale gestione assegnazioni per utenti esistenti;
- dettaglio sicurezza mostra assegnazioni attive/revocate;
- cambio ruolo verso `CinemaStaff` richiede assegnazioni o mostra warning bloccante;
- visualizzare badge `CinemaStaff` distinto da `PowerUser`.

Verifiche frontend minime:

- `node --check` sugli script modificati;
- `dotnet build frontend/CineBase.Web/CineBase.Web.csproj`;
- smoke manuale con account staff con 0, 1 e più cinema assegnati.

---

### 7.2.9 — Integrazione con GDPR/account deletion

La FASE 7.2 viene dopo la FASE 7.1, quindi deve integrarsi con cancellazione/anomizzazione.

Aggiornare `AccountDeletionService`:

- se target è `CinemaStaff`, disattivare tutte le assegnazioni attive (`IsActive = false`, `RevokedAtUtc`) durante anonimizzazione;
- se target è actor storico (`CreatedByUserId`, `UpdatedByUserId`, `RevokedByUserId`), gestire `SetNull` o comportamento coerente con FK;
- export dati personali deve includere assegnazioni staff se l'utente è/era `CinemaStaff`;
- disabilitazione account deve revocare refresh token e impedire uso operativo, anche se assegnazioni restano in storico.

Aggiornare vincoli admin:

- Admin può cancellare/anomizzare `CinemaStaff` come gli altri utenti non-admin;
- dopo anonimizzazione, nessuna assegnazione staff deve restare attiva;
- riabilitare un account disabilitato non deve riattivare automaticamente assegnazioni revocate.

Test minimi:

- cancellazione `CinemaStaff` revoca assegnazioni;
- export `CinemaStaff` include assegnazioni;
- staff disabilitato non può usare endpoint operativi;
- account anonimizzato con vecchie assegnazioni non può autenticarsi né operare.

---

### 7.2.10 — Test automatici minimi

Nuovo file consigliato:

```text
tests/backend/Integration/CinemaStaffAuthorizationIntegrationTests.cs
```

Copertura obbligatoria:

**Modello e ruolo**:

- CS1: enum `CinemaStaff` non rinumera `User`, `PowerUser`, `Admin`.
- CS2: migration crea `UserCinemaAssignments` con unique `(UserId, CinemaId)`.
- CS3: admin può creare invito `CinemaStaff` con assegnazione iniziale.
- CS4: invito `CinemaStaff` completato imposta password e abilita login locale.
- CS5: social-only non può essere promosso a `CinemaStaff`.
- CS6: social login rifiuta account `CinemaStaff` esistente.
- CS6B: invito `CinemaStaff` senza almeno una assegnazione attiva valida viene rifiutato.

**Assegnazioni admin**:

- CS7: Admin legge assegnazioni staff.
- CS8: Admin aggiorna assegnazioni staff e incrementa `AuthVersion`.
- CS9: aggiornamento assegnazioni revoca refresh token.
- CS10: non-admin non può modificare assegnazioni.
- CS11: assegnazione con cinema inesistente rifiutata.
- CS12: assegnazione con tutte le capability false rifiutata o salvata inattiva secondo decisione documentata.
- CS13: audit scritto su create/update/revoke assegnazione.
- CS13B: update assegnazioni che lascerebbe un `CinemaStaff` con zero assegnazioni attive viene rifiutato.

**Validazione biglietti**:

- CS14: staff con `CanValidateTickets` valida ticket del cinema assegnato.
- CS15: staff senza capability validazione riceve `403`.
- CS16: staff di cinema A non valida ticket di cinema B.
- CS17: lookup ticket richiede cinema autorizzato e non espone dettagli fuori scope.
- CS18: PowerUser/Admin validano globalmente.

**Credito**:

- CS19: staff con `CanTopUpCredit` ricarica credito nel cinema assegnato.
- CS20: staff non può ricaricare con `CinemaId` null.
- CS21: staff non può ricaricare cinema non assegnato.
- CS22: staff vede storico solo dei cinema autorizzati.
- CS23: staff search utenti senza query rifiutato.
- CS24: movimento credito contiene operatore e cinema corretti.

**Show**:

- CS25: staff con `CanManageShows` crea show nel cinema assegnato.
- CS26: staff senza capability show riceve `403`.
- CS27: staff non crea show in cinema non assegnato.
- CS28: staff modifica show del proprio cinema.
- CS29: staff non modifica show di altro cinema.
- CS30: staff non sposta show verso cinema non assegnato.
- CS31: staff elimina show autorizzato senza biglietti.
- CS32: staff non elimina show con biglietti emessi, mantenendo conflict esistente.

**RBAC frontend/backend indiretto**:

- CS33: `CinemaStaff` non accede a endpoint film write.
- CS34: `CinemaStaff` non accede a endpoint registi/categorie/media write.
- CS35: `CinemaStaff` non accede a endpoint sale write/layout.
- CS36: `CinemaStaff` non accede a `/admin/utenti`.
- CS37: `User` non accede agli endpoint operativi staff.
- CS38: `PowerUser` conserva accesso globale esistente.
- CS39: `Admin` conserva accesso globale e gestione assegnazioni.

**GDPR/disable integration**:

- CS40: disabilitare `CinemaStaff` blocca endpoint operativi.
- CS41: anonimizzare `CinemaStaff` revoca assegnazioni attive.
- CS42: export dati include assegnazioni staff.

Comandi verifica:

```bash
dotnet build backend/FilmAPI/FilmAPI.csproj
dotnet build tests/backend/FilmAPI.Tests.csproj
dotnet test tests/backend/FilmAPI.Tests.csproj --filter "FullyQualifiedName~CinemaStaff"
dotnet test tests/backend/FilmAPI.Tests.csproj --verbosity minimal
```

---

### 7.2.11 — Nuovi file previsti

**Backend**:

- `Model/UserCinemaAssignment.cs`
- `DTO/CinemaStaffDTO.cs` oppure estensione `DTO/UserAdminDTO.cs`
- `Services/ICinemaAccessService.cs`
- `Services/CinemaAccessService.cs`
- `Migrations/..._AddCinemaStaffAssignments.cs`

**Backend modificati**:

- `Model/UserRole.cs`
- `Model/User.cs`
- `Model/Cinema.cs` se si aggiunge navigation
- `Data/FilmDbContext.cs`
- `Program.cs`
- `Services/AuthService.cs`
- `Services/ExternalAuthService.cs`
- `Services/UserAdminService.cs`
- `Services/AccountDeletionService.cs`
- `Endpoints/AdminUtentiEndpoints.cs`
- `Endpoints/ValidazioneBigliettiEndpoints.cs`
- `Endpoints/CreditoEndpoints.cs`
- `Endpoints/ShowsEndpoints.cs`
- `Services/ValidazioneBigliettoService.cs`
- `Services/CreditoService.cs`
- `Services/ShowService.cs`
- `DTO/UserAdminDTO.cs`
- `DTO/CreditoDTO.cs`
- `DTO/BigliettoDTO.cs`

**Frontend modificati**:

- `js/auth.js`
- `js/api.js`
- `js/route-guard.js`
- `js/admin-shell.js`
- `js/template-loader.js`
- `utenti.html`
- `js/pages/utenti.js`
- `shows.html`
- `js/pages/shows.js`
- `ricarica-credito.html`
- `js/pages/ricarica-credito.js`
- `validazione-biglietti.html`
- `js/pages/validazione-biglietti.js`

**Test**:

- `tests/backend/Integration/CinemaStaffAuthorizationIntegrationTests.cs`
- `tests/backend/Integration/CustomWebApplicationFactory.cs` (helper utenti staff e assegnazioni)

---

### 7.2.12 — Criteri di accettazione specifici

1. Esiste ruolo `CinemaStaff` senza rinumerare `User`, `PowerUser`, `Admin`.
2. `CinemaStaff` richiede credenziali locali e non può autenticarsi via Google/Microsoft.
3. Admin può invitare o promuovere utenti a `CinemaStaff` solo se hanno password locale o completano invito con password.
4. Admin può assegnare uno o più cinema a `CinemaStaff` con capability distinte.
5. Un utente con ruolo `CinemaStaff` non può esistere senza almeno una assegnazione cinema attiva valida.
6. Cambio ruolo e cambio assegnazioni revocano refresh token, incrementano `AuthVersion` e producono audit.
7. `CinemaStaff` può validare solo biglietti dei cinema assegnati con `CanValidateTickets`.
8. `CinemaStaff` può ricaricare credito solo indicando un cinema assegnato con `CanTopUpCredit`.
9. `CinemaStaff` può creare/modificare/cancellare show solo nei cinema assegnati con `CanManageShows`.
10. `CinemaStaff` non può accedere a gestione utenti, ruoli, assegnazioni, catalogo globale, cinema CRUD, sale/layout o media.
11. `PowerUser` e `Admin` mantengono accesso globale operativo esistente.
12. La UI mostra a `CinemaStaff` solo le pagine operative consentite e filtra i cinema selezionabili.
13. Il backend blocca manipolazioni manuali di `CinemaId` anche se la UI è bypassata.
14. Account disabilitati o anonimizzati non possono usare assegnazioni staff residue.
15. Suite backend completa verde.
16. Build frontend verde.

---

### 7.2.13 — Checklist fase

- [x] `UserRole.CinemaStaff` aggiunto senza rinumerare ruoli esistenti
- [x] `UserCinemaAssignment` model + DbContext + migration creati
- [x] DTO staff/assegnazioni creati
- [x] `ICinemaAccessService` implementato e registrato in DI
- [x] Policy `CinemaStaffOrPowerUserOrAdmin` aggiunta
- [x] Social login bloccato per `CinemaStaff`
- [x] Admin invite/promozione `CinemaStaff` implementati
- [x] Endpoint admin assegnazioni implementati
- [x] Cambio assegnazioni incrementa `AuthVersion`, revoca refresh token e scrive audit
- [x] Validazione biglietti scoped per cinema implementata
- [x] Ricarica credito scoped per cinema implementata
- [x] Gestione show scoped per cinema implementata
- [x] Frontend route guard riconosce `cinemastaff`
- [x] Sidebar mostra a `CinemaStaff` solo pagine operative autorizzate
- [x] `shows.js` riconosce CinemaStaff con endpoint scoped
- [x] `ricarica-credito.js` riconosce CinemaStaff con endpoint scoped
- [x] `validazione-biglietti.js` riconosce CinemaStaff con endpoint scoped
- [x] `utenti.js` gestisce invito e assegnazioni `CinemaStaff`
- [x] Integrazione GDPR/disable aggiornata per revocare assegnazioni
- [x] Test `CinemaStaffAuthorizationIntegrationTests` aggiunti
- [x] Build backend verde
- [x] Build frontend verde
- [x] Suite backend completa verde

### 7.2.14 — Aggiornamenti post-FASE 7.2: smoke runtime CinemaStaff

Data: 2026-05-10

- Applicata la migration reale `AddCinemaStaffAssignments` al database locale `film-api-db`.
- Corretto il listing utenti admin: `GetUsersPagedAsync` non usa più `string.Join` o proiezioni EF non traducibili nella query SQL; i nomi cinema assegnati allo staff vengono composti in memoria.
- Migliorato `apiFetch`: gli errori JSON `{ error }` restituiti dal backend vengono mostrati correttamente nel frontend, evitando messaggi generici tipo `Errore di rete`.
- Rafforzato il flusso invito `CinemaStaff`: se l'email esiste già come account social-only, il backend restituisce un messaggio operativo per inviare prima il link setup password, poi assegnare cinema e cambiare ruolo.
- Rifatto il modale invito utenti: i ruoli arrivano da `GET /admin/utenti/roles`; i cinema arrivano dall'API; la UI permette prima la selezione compatta di uno o più cinema tramite ricerca/dropdown e poi la scelta delle capability solo per i cinema selezionati.
- Aggiunto endpoint `GET /admin/utenti/roles` come source of truth backend per i ruoli assegnabili, con metadati `RequiresCinemaAssignments`, `CanInvite`, `CanAssignExisting`.
- Corretto il redirect post-login `CinemaStaff`: l'utente operativo atterra su `dashboard.html`; `route-guard.js`, `auth.js`, `login.js` e `api.js` sono stati allineati per evitare loop su `index.html?forbidden=true`.
- Il pulsante `Area Admin` in navbar/footer è ora visibile anche a `CinemaStaff`; nel footer lo staff vede solo l'accesso all'area admin e non i link globali non autorizzati.
- `shows.html` carica per `CinemaStaff` solo i cinema in cui l'utente ha `CanManageShows`; `validazione-biglietti.html` carica solo i cinema in cui ha `CanValidateTickets`; entrambi usano `GET /staff/me/cinemas`.
- La lookup biglietto passa `cinemaId` a `GET /admin/tickets/validate/{code}` per rispettare lo scope staff richiesto dal backend.
- Corretto il filtro sala in `shows.html`: il frontend ora invia `salaId` a `API.getShows`; `GET /shows` e `ShowService.GetPagedAsync` supportano il filtro `salaId` server-side.
- Verifiche finali: `node --check` sui file JS modificati, build frontend OK, build backend OK (con possibile warning MSB3026 se il runtime backend è già acceso), test backend `338/338 PASS`.

---

### FASE 7.3 - Hardening frontend pagine protette e UX route guard

**Obiettivo**: eliminare il flicker delle pagine non autorizzate e impedire il rendering visibile prematuro di shell/layout/componenti protetti, mantenendo esplicitamente accettato il modello attuale di pagina/template statico servito da `wwwroot`.

**Esito dell'analisi attuale**:

- `frontend/CineBase.Web/Program.cs` serve `wwwroot` come static files tramite `UseStaticFiles()`.
- Le pagine protette (`utenti.html`, `dashboard.html`, `shows.html`, ecc.) vengono quindi scaricate dal browser prima di qualunque controllo client-side.
- I token applicativi sono salvati in `localStorage` e vengono letti solo dagli script frontend (`auth.js`, `route-guard.js`, `api.js`).
- Il server che espone i file statici non può leggere `localStorage`, quindi non può decidere server-side se restituire o negare `/*.html` in base all'utente.
- `route-guard.js` esegue oggi il redirect dopo il download del file HTML e, in molti casi, dopo `DOMContentLoaded`, causando il flicker del markup iniziale.
- La sicurezza reale oggi è sugli endpoint backend autorizzati; il template statico può essere scaricato, ma i contenuti dinamici e le operazioni dipendono dal codice JS e dai controlli backend.

**Decisione di fase**:

- Questa fase copre hardening UX/client-side e sequencing corretto del bootstrap frontend.
- Non richiede di impedire il download del template statico, perché questo non è considerato un problema nel modello adottato.
- L'obiettivo è evitare che un utente non autorizzato veda o monti visivamente la pagina applicativa prima del redirect, non cambiare il paradigma di hosting.

**Attività frontend minime**:

1. Introdurre uno stato globale tipo `route-guard-pending` applicato prima del rendering visibile sulle pagine protette.
2. Modificare `frontend/CineBase.Web/wwwroot/js/route-guard.js` affinché:
   - riconosca immediatamente se la pagina corrente è protetta;
   - nasconda il contenuto prima del `DOMContentLoaded`;
   - rimuova lo stato pending solo dopo autorizzazione confermata;
   - usi `window.location.replace(...)` per tutti i redirect del guard;
   - esponga un evento o hook semplice per segnalare che la pagina è autorizzata.
3. Aggiornare le pagine protette (`dashboard.html`, `films.html`, `registi.html`, `cinemas.html`, `shows.html`, `categorie.html`, `sale.html`, `ricarica-credito.html`, `validazione-biglietti.html`, `utenti.html`, `profilo.html`, `acquista.html`, `pagamento.html`, `esito-acquisto.html`) per partire in stato hidden o con loader neutro fino al via libera del guard.
4. Aggiornare `admin-shell.js`, `template-loader.js` e gli script pagina che montano UI sensibile affinché attendano l'autorizzazione prima di renderizzare il layout finale.
5. Dove il costo è basso, alleggerire il markup iniziale delle pagine più sensibili e lasciare ai file JS il popolamento delle sezioni dinamiche dopo autorizzazione.
6. Uniformare messaggi, toast e redirect di accesso negato per evitare doppio redirect o rendering intermedio.

**Criteri di accettazione**:

- apertura diretta anonima di una pagina protetta non mostra contenuti protetti riconoscibili prima del redirect a login;
- apertura diretta da utente autenticato ma non autorizzato non mostra contenuti protetti riconoscibili prima del redirect a `/index.html?forbidden=true`;
- su connessioni lente non si vede la shell admin completa prima del redirect;
- `admin-shell.js` e i principali script pagina non montano la UI finale finché il guard non autorizza la pagina;
- resta esplicitamente accettato che il template statico sia scaricabile; il requisito di sicurezza riguarda il contenuto dinamico e le API, non il blocco del file HTML.

**Comandi verifica**:

```bash
node --check frontend/CineBase.Web/wwwroot/js/route-guard.js
node --check frontend/CineBase.Web/wwwroot/js/admin-shell.js
node --check frontend/CineBase.Web/wwwroot/js/template-loader.js
dotnet build frontend/CineBase.Web/CineBase.Web.csproj
```

- Verifica manuale browser su aperture dirette anonime/non autorizzate: esito positivo dichiarato in sessione.

**Checklist fase**:

- [x] `route-guard.js` nasconde subito le pagine protette fino all'esito del controllo
- [x] Redirect del guard uniformati con `window.location.replace(...)`
- [x] Pagine protette coperte da stato iniziale hidden globale o loader neutro
- [x] `admin-shell.js` e `template-loader.js` attendono l'autorizzazione
- [x] Ridotta la quantità di markup protetto visibile in `dashboard.html`, `shows.html`, `utenti.html`
- [x] Build frontend verde
- [x] Smoke manuale anonimo/user non autorizzato su `dashboard.html`, `shows.html`, `utenti.html` OK
- [x] Modello accettato "template statico + contenuto dinamico protetto" documentato

---

### FASE 7.4 - GDPR web compliance: informative legali, cookie/tecnologie e trasparenza frontend

**Obiettivo**: completare la copertura GDPR e Privacy lato web che la FASE 7.1 non copre ancora direttamente, portando CineBase a uno stato coerente e documentabile su informative legali pubbliche, diritti dell'interessato, cookie e tecnologie assimilate, risorse esterne, geolocalizzazione, accettazione dei documenti legali e collegamenti pubblici nel frontend, senza introdurre in questa fase una CMP completa e senza rendere obbligatorio il self-hosting delle dipendenze esterne già in uso.

**Nota di contesto**: la FASE 7.1 ha già coperto soprattutto i diritti di export, cancellazione/anonimizzazione e parte della limitazione del trattamento. Restano però aperte le superfici di compliance lato sito e lato UX: pagine legali mancanti, footer con link placeholder, uso esteso di `localStorage`, richiesta geolocalizzazione in background e caricamento automatico di risorse terze. La decisione di questa fase e` adottare un modello intermedio di trasparenza rafforzata: informative complete, notice leggero, geolocalizzazione opt-in e accettazione documenti, senza passare a un CMP enterprise e senza imporre la rimozione immediata di `Google Fonts`, CDN o `Unsplash`.

**Decisione di fase sintetica**:

- nessun CMP completo in questa fase;
- nessun obbligo di self-hosting immediato per `Google Fonts`, `cdnjs`, `Tailwind CDN` e `Unsplash`;
- obbligo di trasparenza documentale e notice leggero sulle risorse esterne attuali;
- geolocalizzazione solo su azione esplicita dell'utente;
- registrazione, social login e checkout allineati alla presa visione dei documenti legali.

---

### 7.4.1 — Gap analysis residua dopo FASE 7.1

| Area | Stato attuale | Gap residuo | Correzione richiesta |
| --- | --- | --- | --- |
| Privacy policy / diritti interessato | FASE 7.1 copre export, cancellazione e parte della limitazione; esiste `profilo.html` con azioni privacy | Manca una pagina pubblica che espliciti articoli 13-14 GDPR: finalità, basi giuridiche, tempi di conservazione, destinatari, trasferimenti, diritti, contatti e reclamo al Garante | Creare `privacy.html` e collegarla da footer, registrazione, login, profilo e checkout |
| Cookie e tecnologie assimilate | Non emerge uso di `document.cookie`, ma il frontend usa `localStorage` per token, device id e preferenze | Manca una cookie policy/informativa tecnica; manca inventario chiavi e classificazione tecnico/funzionale | Creare `cookie.html` e mappare esplicitamente le chiavi `localStorage` e le tecnologie browser usate |
| Risorse terze passive | Le pagine caricano automaticamente `cdn.tailwindcss.com`, `fonts.googleapis.com`, `cdnjs.cloudflare.com` e, in home, un'immagine da `images.unsplash.com` | Ogni apertura pagina invia dati di connessione a terzi prima di una scelta esplicita dell'utente | Documentare esplicitamente le risorse esterne, introdurre notice leggero e registrare il self-hosting come hardening futuro consigliato ma non bloccante |
| Terze parti attivate dall'utente | Stripe, Google e Microsoft sono usati solo su azione dell'utente; SMTP è usato lato backend | Le informative pubbliche non descrivono ancora chiaramente finalità, basi giuridiche, ruoli e tempi di conservazione | Documentare tali integrazioni nella privacy policy e nei testi contestuali |
| Geolocalizzazione | `programmazione.js`, `scheda-film.js` e `my-cinemas.js` chiamano `navigator.geolocation.getCurrentPosition()` in background | La richiesta di posizione è troppo implicita e non è accompagnata da un testo informativo contestuale prima del prompt browser | Rendere la geolocalizzazione esplicitamente opt-in con CTA dedicata e fallback neutro |
| Registrazione locale | `registrazione.html` non richiede alcuna presa visione di privacy/termini | Manca evidenza minima della presa visione dei documenti legali al momento della creazione account | Aggiungere checkbox obbligatorie e memorizzare versione/data di accettazione |
| Registrazione/social login | Il social login può auto-creare un account `User` senza uno step legale dedicato | Un nuovo account social potrebbe nascere senza accettazione della versione corrente dei documenti legali | Introdurre uno step obbligatorio di accettazione o un interstitial prima dell'emissione finale dei token applicativi |
| Checkout / pagamento | `pagamento.html` gestisce il pagamento ma non richiede presa visione di termini/privacy | Mancano link e presa visione esplicita delle condizioni di vendita e del trattamento connesso all'acquisto | Aggiungere riepilogo legale, link pubblici e checkbox prima del pagamento |
| Footer / link pubblici | In `footer-landing.html` i link “Termini e Condizioni” e “Privacy” puntano a `#` | La documentazione legale non è raggiungibile dal sito | Aggiornare footer, pagine auth e checkout con link reali |
| Dati del titolare e figure privacy | Non esistono riferimenti pubblici centralizzati | Mancano i dati del titolare, dell'ufficio privacy, dei responsabili esterni e del DPO/RPD se nominato | Centralizzare placeholder documentati e poi sostituirli con i valori reali prima del rilascio |
| Limitazione del trattamento self-service | In pratica oggi esistono `disable/enable` admin; il self-service non è ancora una UX completa e visibile | La parte art. 18 lato utente non è chiaramente esposta né documentata nelle pagine pubbliche | Documentare il canale privacy e valutare il completamento del self-service come sotto-attività della fase |

---

### 7.4.2 — Decisione vincolante su cookie, `localStorage` e terze parti

Decisioni di fase:

1. CineBase può restare senza CMP completo anche nella configurazione transitoria attuale, purché non introduca analytics, marketing, profiling o altri strumenti di consenso granulare e purché dichiari in modo esplicito le risorse esterne gia` caricate automaticamente dal frontend.
2. `localStorage` e tecnologie assimilate devono essere trattate nella stessa informativa di trasparenza del tema cookie, anche se non sono cookie HTTP tradizionali.
3. Finche' restano chiamate automatiche a terzi al primo paint (`Google Fonts`, `Cloudflare CDN`, `Tailwind CDN`, `Unsplash`), la comunicazione pubblica non deve limitarsi a “usiamo solo cookie tecnici”: e` preferibile parlare di “tecnologie tecniche/funzionali e risorse esterne di presentazione attualmente in uso”, rinviando a `cookie.html` e `privacy.html`.
4. In questa fase non si migra l'intero modello auth a cookie HttpOnly; si documenta invece correttamente l'uso attuale di JWT + refresh token in `localStorage`.
5. In questa fase non si introducono analytics, pixel marketing, reCAPTCHA o strumenti di profilazione.
6. `Google Fonts`, `cdnjs`, `Tailwind CDN` e `Unsplash` possono restare nella fase 7.4 se vengono esplicitamente dichiarati nelle informative e nel notice leggero.
7. Il self-hosting di font, asset statici e dipendenze CDN resta raccomandato come miglioramento futuro, ma non è criterio bloccante di completamento della FASE 7.4.

**Inventario minimo delle chiavi `localStorage` già presenti da documentare**:

| Chiave | Dove | Finalità | Categoria | Persistenza attuale / nota |
| --- | --- | --- | --- | --- |
| `cb_access_token` | `auth.js`, `route-guard.js` | JWT applicativo per autenticazione | Tecnica strettamente necessaria | Fino a logout o scadenza token |
| `cb_refresh_token` | `auth.js`, `route-guard.js` | Refresh token applicativo | Tecnica strettamente necessaria | Fino a logout o revoca |
| `cb_user` | `auth.js` | Cache profilo utente e ruolo | Tecnica/funzionale per UX auth | Fino a logout o refresh dati |
| `cb_device_id` | `auth.js` | Correlazione sessione/device e rotazione refresh token | Tecnica di sicurezza | Persistente tra sessioni |
| `cb_selected_cinema` | `profilo.js`, `my-cinemas.js`, `scheda-film.js`, `programmazione.js` | Cinema preferito dell'utente | Funzionale/preferenza | Persistente finché non cambiato |
| `cinebase-theme` | `theme.js` | Tema chiaro/scuro scelto dall'utente | Funzionale/preferenza | Persistente finché non cambiato |
| `cb_validation_mode` | `validazione-biglietti.js` | Modalità operativa scanner (`Normale` / `Auto Click`) | Funzionale operativa | Persistente finché non cambiata |
| `cb_validation_cinema` | `validazione-biglietti.js` | Cinema operativo selezionato dallo staff | Funzionale operativa | Persistente finché non cambiato |
| `cb_cookie_notice_dismissed` | **Nuova chiave consigliata** | Nascondere l'informativa breve su cookie/tecnologie/risorse esterne | Tecnica/funzionale | Da introdurre solo se si usa notice breve e non CMP completo |

**Release gate vincolante**:

- In questa fase e` accettabile mantenere le risorse terze passive gia` presenti, purche' siano inventariate, descritte nelle informative e richiamate in un notice leggero.
- Il blocco preventivo stile CMP completo non è richiesto finché CineBase non introduce analytics, marketing, profilazione o ulteriori terze parti non strettamente legate alla presentazione del sito.
- Il mancato self-hosting va registrato come rischio residuo/documento di hardening futuro, non come difetto bloccante della fase.

---

### 7.4.3 — Pagine legali pubbliche da aggiungere

**Pagine nuove consigliate**:

1. `frontend/CineBase.Web/wwwroot/privacy.html`
2. `frontend/CineBase.Web/wwwroot/cookie.html`
3. `frontend/CineBase.Web/wwwroot/termini-condizioni.html`

**Contenuti minimi di `privacy.html`**:

- identità del titolare del trattamento;
- recapiti privacy e canale per l'esercizio dei diritti;
- DPO/RPD solo se effettivamente nominato;
- categorie di dati trattati: anagrafica account, dati autenticazione, log sicurezza, ordini, biglietti, credito, dati di pagamento indiretti, dati di geolocalizzazione se usati, dati da provider social;
- finalità e basi giuridiche: esecuzione del contratto, obblighi legali, sicurezza/prevenzione abusi, consenso o richiesta esplicita per geolocalizzazione, login social su iniziativa dell'utente;
- tempi di conservazione distinti per account, audit, ordini/biglietti, movimenti credito, token e log sicurezza;
- categorie di destinatari / responsabili esterni;
- eventuali trasferimenti verso paesi terzi e relativa base di garanzia, da compilare con i fornitori reali usati in produzione;
- diritti dell'interessato: accesso, rettifica, cancellazione, limitazione, portabilità, opposizione, reclamo al Garante;
- riferimenti espliciti alle funzionalità già implementate in piattaforma: export dati, cancellazione account, anonimizzazione, cambio password, gestione profilo;
- data di efficacia e versione del documento.

**Contenuti minimi di `cookie.html`**:

- chiarire se CineBase usa solo tecnologie tecniche/funzionali o se esistono anche tecnologie soggette a consenso;
- spiegare che il sito usa anche `localStorage` / tecnologie assimilate oltre ai cookie HTTP, se presenti;
- tabella puntuale delle chiavi attuali con finalità e persistenza;
- spiegazione del notice breve adottato da CineBase in questa fase e di quando sarebbe necessario un banner/CMP piu strutturato;
- elenco delle risorse terze caricate automaticamente, se ancora presenti dopo la fase;
- istruzioni per cancellazione locale dei dati browser;
- nota che la geolocalizzazione non è un cookie ma una funzionalità browser opzionale, attivata solo su richiesta dell'utente.

**Contenuti minimi di `termini-condizioni.html`**:

- condizioni d'uso della piattaforma;
- regole di creazione e gestione account;
- obblighi dell'utente e corretto uso del servizio;
- sezione dedicata alle condizioni di vendita dei biglietti: acquisto, conferma ordine, annullamenti, rimborsi, validità dei titoli, accesso in sala;
- clausole su disponibilità del servizio, limitazioni di responsabilità, sospensione account e aggiornamenti dei documenti;
- richiami alla privacy policy e alla cookie policy;
- data di efficacia e versione del documento.

**Linking obbligatorio nel frontend**:

- footer pubblico;
- pagine `login.html` e `registrazione.html`;
- `pagamento.html`;
- `profilo.html` nella sezione privacy e dati;
- eventuali email account principali dove ha senso inserire un riferimento al centro privacy.

---

### 7.4.4 — Dati legali e figure privacy: placeholder centralizzati e documentati

Per evitare testo hardcoded incoerente in più file, introdurre una configurazione centralizzata, ad esempio `frontend/CineBase.Web/wwwroot/js/legal-config.js` oppure un endpoint pubblico `/config/legal`, con placeholder espliciti da sostituire prima del rilascio.

**Set minimo di riferimenti placeholder da usare nei documenti**:

```text
Titolare del trattamento
- Ragione sociale: CineBase S.r.l. (placeholder)
- Sede: Via delle Arti 25, 20121 Milano (MI), Italia (placeholder)
- P.IVA: IT00000000000 (placeholder)
- Email privacy: privacy@cinebase.example (placeholder)
- PEC: cinebase@pec.example (placeholder)

Ufficio privacy / diritti dell'interessato
- Referente: Dott.ssa Martina Rinaldi (placeholder)
- Email: diritti@cinebase.example (placeholder)
- Telefono: +39 02 0000 0000 (placeholder)

DPO / RPD
- Referente: Avv. Luca Ferri (placeholder)
- Email: dpo@cinebase.example (placeholder)
- Nota: mostrare questa sezione solo se il DPO è stato davvero nominato

Responsabili esterni del trattamento (placeholder documentali iniziali)
- CineCloud Hosting S.r.l. (placeholder) — hosting e backup
- MailRelay Italia S.r.l. (placeholder) — email transazionali
- PayFlow Europe S.r.l. (placeholder) — gestione pagamenti
```

**Nota importante**:

- I placeholder servono solo per sviluppare e integrare le pagine; prima del rilascio vanno sostituiti con i soggetti reali.
- Nel testo finale di produzione devono essere mappati almeno i fornitori effettivamente attivi: pagamento (`Stripe`), provider email/SMTP reale, `Google`/`Microsoft` se social login è abilitato e qualunque CDN/font/provider esterno rimasto dopo la fase.

---

### 7.4.5 — Registrazione, social login e presa visione dei documenti legali

**Obiettivo specifico**: impedire che un account nuovo, locale o social, venga creato senza una presa visione tracciabile della versione corrente dei documenti legali applicabili.

**Modifiche minime consigliate**:

1. Estendere la registrazione locale con checkbox obbligatorie:
   - `Ho letto l'Informativa Privacy`;
   - `Accetto i Termini e Condizioni`.
2. Estendere DTO/backend per salvare almeno:
   - `PrivacyPolicyAcceptedAtUtc`;
   - `PrivacyPolicyVersion`;
   - `TermsAcceptedAtUtc`;
   - `TermsAcceptedVersion`.
3. Definire una `LegalDocumentsVersion` unica o due versioni separate (`PRIVACY_POLICY_VERSION`, `TERMS_VERSION`) che siano source of truth lato backend.
4. Aggiornare `AuthService.RegisterAsync` per rifiutare la registrazione se le checkbox obbligatorie non risultano accettate.
5. Gestire il social login in modo che la presa visione non venga bypassata:
   - se il provider sta autenticando un utente già esistente che ha già accettato l'ultima versione, il flusso resta lineare;
   - se il provider sta auto-creando un nuovo `User` o se l'utente non ha ancora accettato l'ultima versione, il backend deve imporre uno step aggiuntivo prima dell'emissione finale dei token applicativi.
6. Implementazione consigliata per il punto precedente:
   - introdurre una pagina/interstitial `accettazione-documenti-legali.html` oppure estendere `social-login-complete.html` con uno stato “accetta i documenti prima di completare l'accesso”; 
   - il flusso salva le versioni correnti dei documenti e completa l'accesso solo dopo conferma esplicita.
7. Per gli utenti già esistenti al momento della migration:
   - mostrare un prompt bloccante o una schermata post-login una tantum finché non accettano la versione corrente;
   - evitare di lasciare i nuovi campi a `null` senza una strategia di riallineamento.

**Endpoint/DTO suggeriti**:

- `POST /auth/legal-acceptance` [Authenticated] per utenti già loggati che devono riallinearsi all'ultima versione;
- endpoint dedicato per il completamento della presa visione nel flusso social, se il token applicativo non è ancora stato emesso;
- estensione di `RegisterRequestDTO` con flag/versione documenti.

---

### 7.4.6 — Checkout, condizioni di vendita e presa visione prima del pagamento

`pagamento.html` oggi mostra il riepilogo ordine e il reindirizzamento a Stripe, ma non contiene ancora una presa visione esplicita delle condizioni di vendita e dei riferimenti privacy.

**Modifiche richieste**:

1. Aggiungere in `pagamento.html` un box legale compatto con link a:
   - `termini-condizioni.html#condizioni-di-vendita` oppure sezione equivalente;
   - `privacy.html`;
   - `cookie.html`.
2. Aggiungere una checkbox obbligatoria prima del bottone di pagamento, ad esempio:
   - `Dichiaro di aver letto e accettato le Condizioni di Vendita e l'Informativa Privacy`.
3. Disabilitare il submit pagamento finché la checkbox non è selezionata.
4. Tracciare sul backend, almeno per finalità probatoria minima, versione e timestamp della presa visione associata all'ordine o all'audit del pagamento.
5. Allineare eventuali email di conferma ordine con almeno un link alla privacy policy / centro privacy.

**Nota**: questa presa visione non sostituisce la base giuridica GDPR; serve a chiudere correttamente il lato contrattuale/UX del checkout e a rendere il flusso pubblicamente documentato.

---

### 7.4.7 — Geolocalizzazione: opt-in esplicito e minimizzazione del dato

Le pagine `programmazione.html`, `scheda-film.html` e `my-cinemas.html` oggi tentano la geolocalizzazione in background. Questo va corretto.

**Decisione vincolante**:

- la geolocalizzazione non deve più essere richiesta automaticamente al caricamento pagina;
- il browser deve ricevere la richiesta di posizione solo dopo un'azione esplicita dell'utente, ad esempio un bottone `Usa la mia posizione`;
- le coordinate non devono essere persistite in `localStorage`; possono restare solo in memoria per la sessione di pagina, salvo futura esigenza esplicita e documentata;
- il fallback senza geolocalizzazione deve essere completamente utilizzabile.

**File frontend da aggiornare**:

- `js/pages/programmazione.js`
- `js/pages/scheda-film.js`
- `js/pages/my-cinemas.js`

**UX minima**:

- testo breve che spieghi perché la posizione è utile (`ordinare i cinema per distanza`);
- pulsante opt-in esplicito;
- stato “permesso negato” non bloccante;
- link contestuale a `privacy.html#geolocalizzazione` o sezione equivalente.

---

### 7.4.8 — Risorse terze caricate automaticamente e strategia transitoria

**Stato attuale da correggere**:

- `cdn.tailwindcss.com` viene caricato in molte pagine;
- `fonts.googleapis.com` viene caricato in molte pagine;
- `cdnjs.cloudflare.com` viene caricato in molte pagine per Font Awesome;
- `images.unsplash.com` è usato nella hero della home.

**Correzione richiesta**:

1. Inventariare e classificare le risorse remote oggi presenti:
   - `Tailwind CDN` runtime;
   - `Google Fonts` remoti;
   - `cdnjs` per Font Awesome;
   - immagine hero da `Unsplash` remoto.
2. Documentare tali risorse in `cookie.html` e `privacy.html`, spiegando che oggi sono usate come risorse esterne di presentazione/UI e non come strumenti di analytics o marketing.
3. Introdurre un notice leggero che segnali l'uso di tecnologie tecniche/funzionali e di alcune risorse esterne attualmente utilizzate dalla presentazione del sito, con link ai documenti legali.
4. Chiarire esplicitamente nel piano e nei documenti che il mantenimento di tali risorse e` accettato nella fase 7.4 e non richiede, da solo, l'adozione di un CMP completo.
5. Mantenere come miglioramento consigliato, ma non bloccante in questa fase, la futura sostituzione con equivalenti first-party/self-hosted:
   - CSS compilato locale al posto di `Tailwind CDN` runtime;
   - font locali o fallback system al posto di `Google Fonts` remoti;
   - asset icone locali al posto di `cdnjs` se il bundle lo consente;
   - immagine hero locale al posto di `Unsplash` remoto.
6. Se in futuro verranno aggiunti analytics, marketing, profiling, mappe embed, video embed automatici o ulteriori vendor passivi, rivalutare la necessità di un vero banner di consenso o di una CMP più strutturata.
7. Mantenere come esplicitamente user-triggered soltanto:
   - `Stripe` al momento del pagamento;
   - `Google`/`Microsoft` al momento del social login;
   - geolocalizzazione solo dopo click utente.
8. Se in futuro saranno introdotti trailer embedded o altri media terzi, usare approccio click-to-load e non auto-embed all'apertura pagina.

**Release gate**:

- build completata con riferimenti automatici a CDN/font/media terzi ancora presenti = fase comunque completabile, purche' la situazione sia resa trasparente nelle informative, sia presente il notice leggero e il residuo sia documentato come hardening futuro.

---

### 7.4.9 — Informativa breve cookie / banner frontend

**Strategia raccomandata**: introdurre una informativa breve/non invasiva, non un CMP completo, anche nello scenario transitorio in cui restano alcune risorse esterne di presentazione.

**Implementazione consigliata nel caso CineBase attuale**:

- barra o toast iniziale con testo breve, ad esempio: “CineBase usa tecnologie tecniche/funzionali necessarie al funzionamento, alcune preferenze browser e alcune risorse esterne di presentazione attualmente in uso. Maggiori dettagli nella Cookie Policy e nella Privacy Policy.”;
- link diretto a `cookie.html` e `privacy.html`;
- pulsante `Ho capito` / `Chiudi`;
- persistenza opzionale con `cb_cookie_notice_dismissed`.

**Decisione di piano**: per CineBase, in questa fase, e` accettato un modello intermedio: no CMP completo, no gestione granulare dei consensi, nessun obbligo di rimuovere subito `Google Fonts`, CDN o `Unsplash`, ma notice leggero + informative complete + inventario delle risorse esterne + geolocalizzazione opt-in. Il self-hosting resta consigliato ma rinviabile.

---

### 7.4.10 — Backend e configurazione di supporto

**Modifiche backend/config minime consigliate**:

1. Aggiungere su `User` i campi di accettazione documenti legali.
2. Introdurre una source of truth per la versione dei documenti:
   - environment (`PRIVACY_POLICY_VERSION`, `TERMS_VERSION`) oppure
   - endpoint pubblico dedicato (`GET /config/legal`) oppure
   - estensione di `GET /config/frontend`.
3. Aggiungere eventi audit minimi:
   - `LegalDocumentsAccepted`;
   - `CheckoutTermsAccepted`;
   - eventuale `LegalDocumentsAcceptanceRequired` per flussi social/interstitial.
4. Tracciare come minimo a livello audit la presa visione checkout; l'eventuale estensione di `Ordine` con campi dedicati resta facoltativa se l'audit e` gia` sufficiente al requisito probatorio minimo.
5. Se si decide di tracciare la presa visione checkout in modo forte, estendere `Ordine` o il metadata audit con:
   - versione documenti;
   - timestamp;
   - userId / orderId correlato.
6. Non duplicare versioni e testi in più punti del codice: un solo source of truth.

**Variabili/config suggerite**:

```env
PRIVACY_POLICY_VERSION=2026-05-10-draft-01
TERMS_CONDITIONS_VERSION=2026-05-10-draft-01
COOKIE_POLICY_VERSION=2026-05-10-draft-01
LEGAL_DPO_ENABLED=false
```

Se le figure privacy vengono esposte lato frontend via configurazione, i valori reali non devono essere hardcodati in documenti sparsi o file client non governati.

---

### 7.4.11 — Test e verifiche minime della fase

**Verifiche frontend/integrazione minime**:

- `privacy.html`, `cookie.html` e `termini-condizioni.html` rispondono `200` e sono navigabili da anonimo;
- footer pubblico non contiene più link `#` per privacy/termini;
- `registrazione.html` blocca submit senza checkbox legali;
- il social login non può creare un nuovo account senza presa visione della versione corrente dei documenti;
- un utente già esistente ma privo di accettazione aggiornata viene riallineato con prompt/interstitial;
- `pagamento.html` blocca il submit finché la presa visione non è selezionata;
- geolocalizzazione non viene più richiesta al caricamento pagina;
- devtools/network: le chiamate passive a CDN/font/media terzi attualmente presenti sono riconosciute, documentate nelle informative e coerenti con il notice leggero esposto all'utente;
- non esistono banner o testi che promettano l'assenza totale di risorse esterne se tali risorse sono ancora presenti;
- `cookie.html` riporta tutte le chiavi `localStorage` effettivamente presenti nel codice;
- `privacy.html` include riferimenti al Garante Privacy, basi giuridiche, retention e diritti dell'interessato;
- la sezione DPO/RPD è visibile solo se abilitata/configurata.

**Comandi di verifica utili**:

```bash
rg -n "https://cdn.tailwindcss.com|https://fonts.googleapis.com|https://cdnjs.cloudflare.com|https://images.unsplash.com" frontend/CineBase.Web/wwwroot
```

```bash
dotnet build frontend/CineBase.Web/CineBase.Web.csproj
```

```bash
dotnet build backend/FilmAPI/FilmAPI.csproj
```

```bash
dotnet test tests/backend/FilmAPI.Tests.csproj --verbosity minimal
```

Se si decide di aggiungere copertura automatica backend per l'accettazione legale, aggiungere test dedicati in FASE 8.

---

### 7.4.12 — Nuovi file previsti

**Frontend**:

- `frontend/CineBase.Web/wwwroot/privacy.html`
- `frontend/CineBase.Web/wwwroot/cookie.html`
- `frontend/CineBase.Web/wwwroot/termini-condizioni.html`
- `frontend/CineBase.Web/wwwroot/accettazione-documenti-legali.html` oppure estensione di `social-login-complete.html`
- `frontend/CineBase.Web/wwwroot/js/legal-config.js` oppure configurazione equivalente

**Frontend modificati**:

- `components/footer-landing.html`
- `components/navbar-landing.html` se si vuole un accesso rapido al centro privacy
- `registrazione.html`
- `login.html`
- `pagamento.html`
- `profilo.html`
- `js/pages/registrazione.js`
- `js/pages/login.js`
- `js/pages/pagamento.js`
- `js/pages/profilo.js`
- `js/pages/programmazione.js`
- `js/pages/scheda-film.js`
- `js/pages/my-cinemas.js`
- `js/template-loader.js`
- eventuali asset locali per font/icone/immagini hero solo se si decide di anticipare parte dell'hardening futuro

**Backend / config**:

- `Model/User.cs`
- `DTO/AuthDTO.cs` o DTO dedicati per acceptance
- `Services/AuthService.cs`
- `Services/ExternalAuthService.cs`
- `Endpoints/AuthEndpoints.cs`
- `Program.cs` oppure endpoint config pubblico
- `Migrations/..._AddLegalAcceptanceFields.cs`
- `.env.example` se si usa versioning via environment

---

### 7.4.13 — Criteri di accettazione specifici

1. Esistono pagine pubbliche `privacy.html`, `cookie.html` e `termini-condizioni.html` raggiungibili da anonimo.
2. Footer e pagine auth/checkout non usano più link placeholder `#` per i documenti legali.
3. `privacy.html` descrive finalità, basi giuridiche, tempi di conservazione, categorie di destinatari, diritti dell'interessato, reclamo al Garante e contatti privacy.
4. `cookie.html` documenta sia eventuali cookie HTTP sia `localStorage` e tecnologie assimilate realmente usate da CineBase.
5. CineBase espone in modo trasparente l'uso di tecnologie tecniche/funzionali e delle risorse esterne di presentazione attualmente presenti, senza introdurre analytics o marketing e senza richiedere un CMP completo in questa fase.
6. La presenza di `Google Fonts`, `cdnjs`, `Tailwind CDN` e `Unsplash` non impedisce il completamento della fase se tali risorse sono dichiarate correttamente nelle informative e nel notice leggero.
7. La geolocalizzazione non viene più richiesta in background al caricamento pagina.
8. La geolocalizzazione è attivabile solo tramite azione esplicita dell'utente e ha fallback neutro.
9. La registrazione locale richiede presa visione dei documenti legali e la salva con versione/timestamp.
10. Il social login non può auto-creare un nuovo utente bypassando la presa visione legale.
11. Gli utenti esistenti senza versione accettata aggiornata vengono riallineati tramite prompt/interstitial.
12. `pagamento.html` richiede presa visione esplicita prima del submit.
13. I riferimenti a titolare, ufficio privacy, responsabili esterni e DPO/RPD se nominato sono centralizzati e documentati con placeholder espliciti da sostituire.
14. La sezione DPO/RPD non compare se il DPO non è stato realmente nominato.
15. Build frontend e backend verdi.
16. La documentazione finale può dichiarare in modo veritiero lo stato reale di cookie/tecnologie e dei diritti privacy esposti dal prodotto.

---

### 7.4.14 — Stima effort

| Attività | Tempo stimato |
| --- | --- |
| Gap analysis finale e inventario storage/terze parti | 45-60 min |
| Pagine `privacy.html`, `cookie.html`, `termini-condizioni.html` | 120-180 min |
| Configurazione centralizzata placeholder legali/versioni | 45-90 min |
| Registrazione locale + persistence acceptance | 90-150 min |
| Gestione acceptance nel social login | 120-240 min |
| Checkout con presa visione condizioni | 60-120 min |
| Geolocalizzazione opt-in | 60-90 min |
| Inventario risorse esterne + notice leggero + documentazione rischio residuo | 60-120 min |
| Notice breve cookie oppure banner con blocco preventivo | 60-150 min |
| Smoke test browser e verifica network | 60-120 min |
| **Totale realistico** | **2-3 giornate tecniche** |

---

### 7.4.15 — Checklist fase

- [x] Gap analysis residuale documentata nel piano
- [x] `privacy.html` creata e collegata
- [x] `cookie.html` creata e collegata
- [x] `termini-condizioni.html` creata e collegata
- [x] Placeholder legali centralizzati e documentati
- [x] Footer pubblico aggiornato con link legali reali
- [x] Registrazione locale richiede presa visione legale
- [x] Versione/timestamp documenti legali persistiti su utente
- [x] Social login non bypassa la presa visione per nuovi account
- [x] Utenti esistenti riallineati alla versione corrente dei documenti
- [x] Checkout richiede presa visione condizioni/privacy
- [x] Geolocalizzazione resa opt-in esplicita
- [x] Risorse terze passive inventariate e documentate nelle informative
- [x] Notice/banner leggero attivo e coerente con le risorse esterne effettivamente presenti
- [x] Hardening futuro self-hosted documentato come follow-up non bloccante
- [x] Informativa breve cookie/tecnologie coerente con lo stato tecnico reale
- [x] Build frontend verde
- [x] Build backend verde
- [x] Smoke test browser + verifica network completati

---

### FASE 7.5 - Annullamento show, rimborsi e notifiche utenti

**Obiettivo**: introdurre un flusso operativo completo e sicuro per annullare uno show senza cancellarne lo storico, bloccare nuovi acquisti e validazioni, annullare i biglietti già emessi, rimborsare gli utenti con lo stesso metodo di pagamento usato in acquisto e gestire anche i casi eccezionali che non possono essere decisi automaticamente. La fase include quindi sia il percorso automatico sia un workspace manuale per `Admin`/`PowerUser`, oltre al miglioramento del checkout hosted Stripe con email utente precompilata e all'aggiunta di un badge ruolo in navbar per `Admin`, `PowerUser` e `CinemaStaff`.

**Decisione sul quesito Stripe email**: nel codice attuale `StripePaymentGateway.CreateCheckoutSessionAsync` crea `SessionCreateOptions` senza valorizzare `CustomerEmail`; di conseguenza Stripe Checkout non può precompilare l'email dell'utente. Non emerge una scelta funzionale documentata per lasciarla vuota. La correzione consigliata è passare l'email dell'utente autenticato nella richiesta gateway e valorizzare `SessionCreateOptions.CustomerEmail`, evitando di impostarla solo se in futuro verrà introdotto un `Customer` Stripe persistente, perché Stripe non consente sempre di combinare liberamente `Customer` e `CustomerEmail`.

**Principio guida**: annullare uno show non equivale a fare `DELETE /shows/{id}`. Il delete fisico deve restare limitato a show privi di storico economico; l'annullamento è un cambio stato tracciato, reversibile solo tramite nuova programmazione manuale, con audit e storico rimborsi.

---

### 7.5.1 — Analisi dello stato attuale

| Area | Stato attuale verificato | Gap |
| --- | --- | --- |
| Modello `Show` | `Show` contiene cinema, sala, film, orario, durata, prezzo e navigation verso posti/biglietti/ordini; non ha stato operativo | Non esiste `Scheduled/Cancelled`; uno show annullato non può essere rappresentato senza cancellarlo fisicamente |
| Delete show | `ShowService.DeleteAsync` blocca la cancellazione se esistono biglietti non `Cancelled` | Non c'è un flusso di annullamento con storico; dopo avere cancellato tutti i biglietti si rischia di rendere cancellabile fisicamente uno show che invece dovrebbe restare storico |
| Ordini | `OrdineState` copre `Pending`, `Paid`, `Failed`, `Cancelled`, `Expired`, `CheckoutInProgress` | Non distingue ordine pagato e poi rimborsato; non ha stato/metadata di refund |
| Biglietti | `BigliettoState` copre `Issued`, `Validated`, `Cancelled` | Manca metadata di annullamento: data, operatore, motivo, riferimento refund/cancellation |
| Pagamenti Stripe | `StripeGateway` crea `PaymentIntent`, `Checkout Session`, legge sessioni e parse webhook pagamento | Non esiste API refund Stripe; non esiste sync/metadata refund; Checkout Session non riceve email utente |
| Credito piattaforma | `MovimentoCreditoTipo.Refund` esiste ed è usato per rilasciare credito riservato (`RELEASE:`) | Non esiste un metodo esplicito e idempotente per rimborsare credito di un ordine pagato annullato |
| Email ticket | `IEmailService.SendOrderTicketsAsync` invia biglietti PDF; `IAccountEmailService` è per account/security | Non esiste template email per show annullato, biglietti annullati o rimborso avviato |
| Frontend show | `shows.html` gestisce creazione/modifica/eliminazione show per operatori autorizzati | Non ha azione “Annulla show”, preview impatto, refund, retry o comunicazione utenti |
| Navbar | `navbar-landing.html` e `admin-shell.js` mostrano nome utente, ma non badge ruolo accanto al nome | `Admin`, `PowerUser` e `CinemaStaff` non sono immediatamente distinguibili nell'interfaccia |

Conclusione tecnica: la FASE 7.5 deve introdurre uno stato applicativo nuovo e un workflow economico idempotente. Non è sufficiente cambiare `BigliettoState` a `Cancelled`, perché il sistema deve anche impedire nuovi acquisti, gestire sessioni Stripe ancora aperte, rimborsare importi già incassati e tracciare comunicazioni.

---

### 7.5.2 — Ruoli e perimetro autorizzativo

Regole vincolanti:

1. Solo `Admin` e `PowerUser` possono annullare show e avviare rimborsi collegati all'annullamento.
2. `CinemaStaff` resta escluso dal flusso di annullamento/rimborso anche se ha `CanManageShows`, perché il rimborso è un'operazione economica globale e non solo operativa di sala.
3. L'enforcement deve essere backend, non solo UI: usare policy esplicita, ad esempio `GlobalBackoffice` oppure una nuova policy dedicata `ShowCancellationOperator` che ammette solo `Admin` e `PowerUser`.
4. Non usare confronti numerici sull'enum ruoli; continuare con policy/metodi espliciti.
5. Ogni annullamento, refund, retry refund, invio email e fallimento deve essere auditato con actor, show, ordine e utente interessato quando disponibile.
6. La UI deve nascondere l'azione a `CinemaStaff`, ma un tentativo manuale via API deve ricevere `403`.

---

### 7.5.3 — Use case supportati

**UC1 - Annullamento show senza biglietti venduti**:

- `Admin`/`PowerUser` apre `shows.html` e seleziona “Annulla show”.
- Backend verifica che lo show non sia già annullato.
- Backend imposta lo stato show ad annullato, salva motivo e actor.
- Non vengono creati refund.
- Lo show sparisce dalla programmazione acquistabile oppure viene mostrato come “Annullato” solo dove serve per storico/admin.

**UC2 - Annullamento show con ordini pending o checkout in corso, ma non pagati**:

- Per ordini `Pending`: rimuovere hold posti, impostare ordine `Cancelled`, azzerare eventuali importi non consolidati.
- Per ordini `CheckoutInProgress`: rilasciare `CreditoRiservato`, rimuovere hold posti, impostare ordine `Cancelled` o `Expired` con motivo “Show annullato”.
- Se esiste `StripeCheckoutSessionId` aperta, provare a scadere la sessione Stripe tramite gateway (`SessionService.ExpireAsync`) per ridurre il rischio di pagamento tardivo.
- Non creare refund se non c'è pagamento completato.

**UC3 - Annullamento show con biglietti pagati e non validati**:

- Backend annulla lo show e marca i biglietti `Issued` come `Cancelled` con metadata di annullamento.
- Per ogni ordine `Paid` crea una riga refund idempotente.
- Se l'operatore sceglie “Rimborsa ora”, il backend processa i refund dopo avere persistito l'annullamento.
- Se l'operatore sceglie “Rimborsa più tardi”, lo show e i biglietti sono annullati, ma i refund restano `Pending` e visibili in UI con azione retry/process.

**UC4 - Pagamento misto carta + credito**:

- L'importo carta (`Ordine.ImportoCarta`) viene rimborsato tramite Stripe verso il metodo carta originale.
- L'importo credito (`Ordine.ImportoCredito`) viene riaccreditato sul credito piattaforma dell'utente con un movimento `Refund` dedicato.
- Il sistema non deve permettere all'operatore di scegliere manualmente un metodo diverso, perché il requisito è “stesso metodo di pagamento usato per l'acquisto”.

**UC5 - Pagamento solo credito piattaforma**:

- Nessuna chiamata Stripe.
- Creazione movimento credito `Refund` idempotente collegato a `OrdineId`, show cancellation e actor.
- Aggiornamento saldo utente.

**UC6 - Pagamento solo carta Stripe**:

- Creazione refund Stripe usando il `PaymentIntent` dell'ordine.
- Salvataggio `StripeRefundId`, stato refund e messaggio errore se la chiamata fallisce.
- Nessun movimento credito, salvo eventuale caso futuro di compensazione manuale che resta out of scope.

**UC7 - Biglietti già validati o show già iniziato/passato**:

- Non deve esistere annullamento silenzioso.
- La preview deve evidenziare quanti biglietti sono `Validated` e se `StartAtUtc <= now`.
- La `FASE 7.5` adotta la policy conservativa sul percorso automatico: se esistono biglietti `Validated` o se lo show è già iniziato/passato, il bottone di annullamento automatico non deve procedere con refund bulk.
- In questi casi il sistema deve restituire un esito `RequiresManualReview = true` e offrire a `Admin`/`PowerUser` l'accesso a un workspace manuale dedicato della stessa fase.
- Il workspace manuale non deve essere un override nascosto dello stesso endpoint automatico: deve essere un percorso separato, esplicito, auditato e con riepilogo chiaro dei rischi prima di permettere decisioni economiche.

**UC8 - Retry refund o retry email**:

- Un refund fallito non deve richiedere di annullare di nuovo lo show.
- L'operatore deve poter ritentare solo gli item `Failed` o `Pending`.
- L'email fallita deve essere ritentabile separatamente dal refund.
- Retry sempre idempotente: nessun doppio rimborso carta e nessun doppio riaccredito credito.

**UC9 - Race con webhook Stripe tardivo**:

- Se una sessione Stripe viene completata mentre lo show è stato annullato, il webhook non deve emettere biglietti validi.
- Il backend deve rilevare show annullato/ordine annullato e tentare prima la chiusura automatica: non emettere ticket validi, creare refund se i dati di pagamento sono sufficienti e marcare l'ordine con stato refund coerente.
- Se il pagamento è stato catturato ma il rimborso non può essere completato automaticamente, il caso deve finire nella stessa coda di revisione manuale del workspace eccezioni, con reason esplicita tipo `LateStripeWebhook`, `MissingPaymentIntent` o `RefundFailedAfterCapture`.
- Questo caso deve avere test perché è il rischio economico principale del flusso.

**UC10 - Workspace manuale per casi eccezionali**:

- Deve esistere un percorso dedicato per `Admin`/`PowerUser` che gestisca i casi non coperti dall'automazione sicura.
- Il workspace deve coprire almeno questi ingressi:
  - show con biglietti `Validated`;
  - show già iniziati/passati;
  - refund automatici falliti;
  - webhook Stripe tardivi con pagamento catturato ma refund non chiuso;
  - ordini con dati insufficienti per decidere automaticamente il rimborso.
- Nel workspace l'operatore vede il dettaglio show, ordini, ticket, stato validazione, importi carta/credito, stato refund corrente, warning e storico audit.
- La prima implementazione del workspace manuale lavora **per ordine**, non per singolo biglietto, per contenere la complessità della fase 7.5. Se un ordine contiene ticket con stato misto, `Admin`/`PowerUser` decide se rimborsare integralmente quell'ordine o non rimborsarlo, con nota obbligatoria.
- Le azioni minime per ordine nel workspace sono:
  - `Rimborsa integralmente con lo stesso metodo di pagamento`;
  - `Non rimborsare` con motivazione obbligatoria;
  - `Rinvia decisione` lasciando l'ordine in coda manuale.
- Il workspace non deve consentire di cambiare arbitrariamente il metodo di rimborso: resta vincolato a Stripe per la quota carta e a credito piattaforma per la quota credito.
- Ogni decisione manuale deve essere auditata con actor, motivo, ordine e stato finale.

---

### 7.5.4 — Modello dati consigliato

**Estensione `Show`**:

```text
Show(
  ...campi esistenti,
  State ShowState required default Scheduled,
  CancelledAtUtc datetime?,
  CancelledByUserId int?,
  CancellationReason string? max 500,
  CancellationPublicMessage string? max 1000
)
```

Enum consigliato:

```csharp
public enum ShowState
{
    Scheduled = 0,
    Cancelled = 1
}
```

Note:

- evitare `IsDeleted` o delete fisico per rappresentare l'annullamento;
- `ShowDTO`, `ProgrammazioneDTO` e DTO admin devono esporre almeno `State`, `CancelledAtUtc` e messaggio pubblico quando serve;
- filtri pubblici devono escludere `Cancelled` dalla programmazione acquistabile, salvo viste storico/profilo.

**Nuova entità `ShowCancellation`**:

```text
ShowCancellation(
  Id int PK,
  ShowId int FK required unique,
  CancelledAtUtc datetime required,
  CancelledByUserId int required,
  Reason string required max 500,
  PublicMessage string? max 1000,
  InternalNotes string? max 1000,
  RefundMode string required max 40,        -- SamePaymentMethod / ProcessLater
  EmailRequested bool required,
  EmailSubject string? max 200,
  EmailBody string? max 4000,
  CreatedAtUtc datetime required,
  UpdatedAtUtc datetime?
)
UNIQUE(ShowId)
INDEX(CancelledAtUtc)
INDEX(CancelledByUserId)
```

**Nuova entità `OrdineRefund`**:

```text
OrdineRefund(
  Id int PK,
  ShowCancellationId int FK required,
  OrdineId int FK required,
  UserId int FK required,
  Status RefundStatus required,             -- Pending / Processing / Completed / Failed / Partial
  Metodo string required max 30,            -- Card / Credit / Mixed
  ImportoCarta decimal(10,2) required,
  ImportoCredito decimal(10,2) required,
  ImportoTotale decimal(10,2) required,
  StripePaymentIntentId string? max 120,
  StripeRefundId string? max 120,
  StripeRefundStatus string? max 40,
  CreditRefundMovementId int?,
  FailureMessage string? max 1000,
  RetryCount int required default 0,
  CreatedAtUtc datetime required,
  ProcessedAtUtc datetime?,
  CompletedAtUtc datetime?,
  LastAttemptAtUtc datetime?,
  CreatedByUserId int required
)
UNIQUE(OrdineId)
INDEX(ShowCancellationId, Status)
INDEX(UserId, CreatedAtUtc)
INDEX(StripeRefundId)
```

**Nuova entità `ManualRefundReview`**:

```text
ManualRefundReview(
  Id int PK,
  ShowCancellationId int FK required,
  OrdineId int FK required,
  UserId int FK required,
  ReasonCode string required max 80,       -- ValidatedTickets / StartedShow / LateStripeWebhook / RefundFailed / MissingPaymentData
  Status string required max 40,           -- Pending / InReview / Resolved
  Resolution string? max 40,               -- Refunded / NotRefunded / Deferred
  ResolutionNotes string? max 1000,
  CreatedAtUtc datetime required,
  CreatedByUserId int required,
  ReviewedAtUtc datetime?,
  ReviewedByUserId int?
)
UNIQUE(ShowCancellationId, OrdineId)
INDEX(Status, CreatedAtUtc)
INDEX(ReasonCode, CreatedAtUtc)
```

Enum consigliati:

```csharp
public enum RefundStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3,
    Partial = 4
}
```

**Estensione `Biglietto`**:

```text
Biglietto(
  ...campi esistenti,
  CancelledAtUtc datetime?,
  CancelledByUserId int?,
  CancellationReason string? max 500,
  OrdineRefundId int?
)
```

**Decisione su `ShowPostoStato`**:

- Non è obbligatorio aggiungere `ShowPostoState.Cancelled` nella prima implementazione.
- Per show annullato, la source of truth deve essere `Show.State == Cancelled` più `Biglietto.State == Cancelled`.
- Gli stati `Sold` storici possono restare per preservare l'occupazione originaria, ma checkout/seat-map devono rifiutare lo show annullato prima ancora di considerare i posti.

**Eventi audit minimi**:

- `ShowCancellationCreated`
- `ShowCancellationRejected`
- `ShowTicketsCancelled`
- `ShowRefundCreated`
- `ShowRefundSucceeded`
- `ShowRefundFailed`
- `ShowRefundRetried`
- `ShowCancellationEmailSent`
- `ShowCancellationEmailFailed`
- `StripeCheckoutEmailPrefilled`

---

### 7.5.5 — Gateway Stripe e rimborsi

**Prefill email Checkout**:

Estendere `StripeCreateCheckoutSessionRequest`:

```text
CustomerEmail string?
```

In `PagamentoService.CreateCheckoutSessionAsync`, passare `ordine.User.Email` dopo `LoadOrderAsync`, se non vuota e se l'utente non è anonimizzato. In `StripePaymentGateway.CreateCheckoutSessionAsync`, valorizzare:

```text
SessionCreateOptions.CustomerEmail = request.CustomerEmail
```

Opzionale ma utile: valorizzare anche `PaymentIntentData.ReceiptEmail` se supportato dal binding Stripe in uso e se non confligge con Checkout.

**Nuove capability gateway**:

```text
IStripePaymentGateway
  Task<StripeRefundSnapshot> CreateRefundAsync(StripeCreateRefundRequest request, string? idempotencyKey, CancellationToken ct = default)
  Task<StripeRefundSnapshot> GetRefundAsync(string refundId, CancellationToken ct = default)
  Task<StripeCheckoutSessionSnapshot> ExpireCheckoutSessionAsync(string sessionId, CancellationToken ct = default)
```

`StripeCreateRefundRequest` consigliato:

```text
StripeCreateRefundRequest(
  OrderId,
  OrderCode,
  UserId,
  ShowId,
  ShowCancellationId,
  PaymentIntentId,
  Amount,
  Currency = "eur",
  Reason = "requested_by_customer"
)
```

`RefundCreateOptions` deve includere:

- `PaymentIntent = request.PaymentIntentId`;
- `Amount = ToStripeAmount(request.Amount)`;
- `Reason` compatibile con Stripe, consigliato `requested_by_customer` se non esiste un valore più adatto;
- metadata `orderId`, `orderCode`, `userId`, `showId`, `showCancellationId`, `source = show_cancellation`.

Idempotency key consigliata:

```text
refund-show-{showCancellationId}-order-{orderId}-card
```

Regole tecniche:

1. Mai creare refund Stripe senza `StripePaymentIntentId` valido se `ImportoCarta > 0`.
2. Se `StripePaymentIntentId` manca ma esiste `StripeCheckoutSessionId`, provare prima a recuperare la sessione e il suo `PaymentIntentId`.
3. Se il `PaymentIntentId` non è recuperabile, segnare `OrdineRefund` come `Failed` con errore operativo chiaro.
4. Non tenere una transazione DB aperta durante una chiamata Stripe lunga: persist prima il piano di refund, poi processa item idempotenti.
5. Se Stripe restituisce refund `pending`, considerare il rimborso “avviato” ma non promettere all'utente accredito immediato.
6. Se si decide di gestire webhook refund, estendere `ParseWebhookEvent` per riconoscere eventi refund/charge refund e aggiornare `OrdineRefund.StripeRefundStatus`.

---

### 7.5.6 — Rimborso credito piattaforma

Estendere `ICreditoService` con un metodo idempotente distinto dal rilascio riserva:

```text
Task<MovimentoCredito> RefundPaidOrderCreditAsync(
  int userId,
  int orderId,
  decimal importo,
  int operatorUserId,
  int? cinemaId,
  string note,
  CancellationToken cancellationToken = default)
```

Regole:

1. Usare `MovimentoCreditoTipo.Refund`.
2. Distinguere nel campo `Note` i refund reali da annullamento show, ad esempio `SHOW_CANCEL_REFUND:{showCancellationId}:...`, senza riusare il prefisso `RELEASE:` riservato al rilascio di credito prenotato.
3. Impedire doppio rimborso controllando `UserId + OrdineId + Tipo == Refund + Note.StartsWith("SHOW_CANCEL_REFUND:{showCancellationId}:")` oppure collegando `CreditRefundMovementId` su `OrdineRefund`.
4. Aggiornare `SaldoPre`, `SaldoPost`, `OperatoreUserId`, `CinemaId` e `OrdineId`.
5. Se l'utente è disabilitato, il rimborso credito può comunque avvenire perché riguarda un debito economico verso l'utente.
6. Se l'utente è anonimizzato o non ha più un canale account utilizzabile, il piano deve definire una policy esplicita: consigliato marcare il refund credito come `Failed`/`ManualReviewRequired` invece di creare saldo non comunicabile. Se si introduce questo stato, documentarlo nei test.

---

### 7.5.7 — Servizio applicativo di annullamento

Nuovo servizio consigliato:

```text
IShowCancellationService
  Task<ShowCancellationPreviewDTO> PreviewCancellationAsync(int showId, int actorUserId, UserRole actorRole)
  Task<ShowCancellationResultDTO> CancelShowAsync(int showId, ShowCancellationRequestDTO request, int actorUserId, UserRole actorRole)
  Task<ShowCancellationResultDTO> ProcessRefundsAsync(int cancellationId, ProcessShowRefundsRequestDTO request, int actorUserId, UserRole actorRole)
  Task<ShowCancellationResultDTO> RetryFailedRefundsAsync(int cancellationId, int actorUserId, UserRole actorRole)
  Task<ShowCancellationResultDTO> RetryFailedEmailsAsync(int cancellationId, int actorUserId, UserRole actorRole)
```

`PreviewCancellationAsync` deve restituire almeno:

- dati show: film, cinema, sala, data/ora, stato;
- numero ordini `Pending`, `CheckoutInProgress`, `Paid`;
- numero biglietti `Issued`, `Validated`, `Cancelled`;
- importo totale carta da rimborsare;
- importo totale credito da rimborsare;
- numero utenti destinatari email;
- warning su biglietti validati, show già iniziato, payment intent mancanti, utenti senza email o anonimizzati;
- indicazione se l'annullamento è bloccato, consentito o consentito solo con conferma rafforzata per biglietti pagati non ancora validati.
- numero casi che finiranno in revisione manuale, con elenco motivi principali.

`CancelShowAsync` deve seguire questa sequenza:

1. Validare policy `Admin`/`PowerUser`.
2. Caricare show con ordini, biglietti, utenti, payment metadata e stati posto.
3. Rifiutare se show già `Cancelled`.
4. Se esistono biglietti `Validated` o se lo show è già iniziato/passato, non eseguire il percorso automatico: creare o aggiornare gli item di `ManualRefundReview` e restituire esito operativo che indirizza il backoffice al workspace manuale.
5. Aprire transazione DB breve.
6. Impostare `Show.State = Cancelled`, `CancelledAtUtc`, `CancelledByUserId`, motivo e messaggio pubblico.
7. Creare `ShowCancellation`.
8. Per ordini `Pending`: rimuovere hold e impostare `Cancelled` con motivo.
9. Per ordini `CheckoutInProgress`: rimuovere hold, rilasciare credito riservato, impostare `Cancelled`; scadenza sessione Stripe da fare fuori transazione tramite gateway.
10. Per ordini `Paid` automaticamente rimborsabili: creare `OrdineRefund` per ogni ordine non già rimborsato; marcare i biglietti `Issued` come `Cancelled`.
11. Per ordini che richiedono decisione manuale: creare `ManualRefundReview` e non processare refund automaticamente.
12. Salvare audit.
13. Commit.
14. Fuori transazione, scadere le sessioni Stripe aperte e processare i refund se `request.ProcessRefundsNow == true`.
15. Applicare la policy email di fase: inviare la prima email di annullamento a chi entra nel percorso automatico se `request.SendEmail == true`; per i casi manuali l'email deve partire solo dopo la decisione manuale effettiva.

`ProcessRefundsAsync` deve:

- processare solo refund `Pending`, `Failed` o `Partial`;
- serializzare per ordine evitando doppie elaborazioni concorrenti;
- chiamare Stripe solo per quota carta;
- chiamare `CreditoService` solo per quota credito;
- marcare `Completed` solo quando tutte le quote previste sono concluse o avviate con successo secondo la semantica scelta;
- salvare `FailureMessage` senza perdere gli errori precedenti;
- non cambiare più lo stato dei biglietti se sono già `Cancelled`.

Nuovi metodi consigliati per il workspace manuale:

```text
Task<ManualRefundReviewListDTO> GetManualRefundReviewsAsync(int? showCancellationId, int actorUserId, UserRole actorRole)
Task<ManualRefundReviewResultDTO> ResolveManualRefundReviewAsync(int reviewId, ResolveManualRefundReviewDTO request, int actorUserId, UserRole actorRole)
```

`ResolveManualRefundReviewAsync` deve consentire solo queste decisioni iniziali:

- `RefundFullSameMethod`
- `NoRefund`
- `Defer`

e deve richiedere `ResolutionNotes` obbligatorie quando la decisione è `NoRefund` o quando si tratta di casi con ticket validati/show iniziato.

---

### 7.5.8 — Endpoint backend proposti

Endpoint consigliati, tutti protetti da `Admin`/`PowerUser`:

```text
GET  /shows/{id}/cancellation-preview
POST /shows/{id}/cancel
GET  /show-cancellations/{id}
POST /show-cancellations/{id}/refunds/process
POST /show-cancellations/{id}/refunds/retry
POST /show-cancellations/{id}/emails/retry
GET  /show-cancellations/manual-reviews
POST /show-cancellations/manual-reviews/{id}/resolve
```

DTO principali:

```text
ShowCancellationRequestDTO
  Reason string required max 500
  PublicMessage string? max 1000
  InternalNotes string? max 1000
  ProcessRefundsNow bool
  SendEmail bool
  EmailSubject string? max 200
  EmailBody string? max 4000
  ConfirmPaidTickets bool

ShowCancellationPreviewDTO
  Show
  CanCancel
  BlockingReasons[]
  Warnings[]
  PaidOrdersCount
  PendingOrdersCount
  CheckoutInProgressOrdersCount
  IssuedTicketsCount
  ValidatedTicketsCount
  CardRefundTotal
  CreditRefundTotal
  TotalRefundAmount
  EmailRecipientsCount
  ManualReviewCount
  ManualReviewReasons[]
  Items[] grouped by order/user

ShowCancellationResultDTO
  CancellationId
  ShowState
  TicketsCancelledCount
  OrdersCancelledCount
  RefundsPendingCount
  RefundsCompletedCount
  RefundsFailedCount
  EmailsSentCount
  EmailsFailedCount
  ManualReviewCount
  Warnings[]

ResolveManualRefundReviewDTO
  Decision string required            -- RefundFullSameMethod / NoRefund / Defer
  ResolutionNotes string? max 1000

ManualRefundReviewListDTO
  Items[]

ManualRefundReviewItemDTO
  ReviewId
  ShowCancellationId
  OrdineId
  UserId
  UserEmail
  ReasonCode
  Status
  ShowTitle
  CinemaName
  StartAtUtc
  TicketsIssuedCount
  TicketsValidatedCount
  CardAmount
  CreditAmount
  TotalAmount

ManualRefundReviewResultDTO
  ReviewId
  Decision
  RefundStatus
  EmailStatus
  Warnings[]
```

Risposte errore consigliate:

- `404` show/cancellation non trovati;
- `403` ruolo non autorizzato;
- `409` show già annullato, refund già in processing o decisione manuale incoerente con lo stato corrente;
- `400` motivo mancante o payload email non valido.

---

### 7.5.9 — Frontend operativo

**`shows.html` / `js/pages/shows.js`**:

1. Aggiungere colonna o badge stato show: `Programmato`, `Annullato`.
2. Nascondere o disabilitare “Elimina” per show con ordini/biglietti storici; proporre “Annulla” quando lo show è programmato.
3. Mostrare “Annulla show” solo a `Admin` e `PowerUser`; non mostrarlo a `CinemaStaff`.
4. Modale step 1: preview impatto con conteggi, importi carta/credito, numero destinatari, warning su ticket validati e checkout aperti.
5. Modale step 2: motivo obbligatorio, messaggio pubblico opzionale, note interne opzionali.
6. Opzioni operative:
   - `Rimborsa subito con lo stesso metodo di pagamento` selezionata di default se ci sono ordini pagati;
   - `Invia email agli utenti interessati` selezionabile separatamente;
   - subject/body email precompilati ma modificabili in plain text;
   - checkbox di conferma rafforzata per procedere su biglietti pagati; biglietti validati e show già iniziati/passati devono invece bloccare il flusso automatico.
7. Dopo submit, mostrare risultato: refund completati, pending, falliti, email inviate/fallite.
8. Per show già annullato, mostrare dettaglio cancellation e azioni retry refund/email se necessarie.

**Workspace manuale rimborsi eccezionali**:

1. Creare una pagina dedicata, ad esempio `refund-review.html`, oppure una vista dedicata dentro `shows.html`; per chiarezza operativa è preferibile una pagina separata.
2. Accesso solo a `Admin` e `PowerUser`.
3. Tabella casi manuali con filtri per motivo (`ValidatedTickets`, `StartedShow`, `LateStripeWebhook`, `RefundFailed`, `MissingPaymentData`), stato e show.
4. Ogni riga mostra: show, utente, ordine, importi carta/credito, ticket emessi/validati, motivo della revisione, stato email/refund.
5. Dettaglio ordine con storico audit, stato Stripe, payment intent, biglietti e note precedenti.
6. Azioni disponibili:
   - `Rimborsa integralmente con lo stesso metodo di pagamento`;
   - `Non rimborsare` con motivazione obbligatoria;
   - `Rinvia decisione`.
7. Se l'operatore sceglie il rimborso manuale, il backend usa comunque lo stesso motore tecnico di refund Stripe/credito della parte automatica, ma solo dopo conferma esplicita e auditata.
8. Il workspace deve mostrare chiaramente che si tratta di casi eccezionali non coperti dall'automazione sicura.

**Specifica UX dettagliata del workspace manuale**:

1. **Pagina**: `refund-review.html` dentro la shell admin, con titolo `Revisione Rimborsi` e sottotitolo breve: `Casi che richiedono una decisione manuale del backoffice`.
2. **Header KPI**: card iniziali con conteggi rapidi:
   - `In attesa di revisione`;
   - `In revisione`;
   - `Rimborsati`;
   - `Non rimborsati`;
   - `Webhook tardivi`;
   - `Refund falliti`.
3. **Barra filtri sticky** sotto l'header:
   - ricerca libera per codice ordine, email utente, titolo film;
   - select `Motivo`;
   - select `Stato review` (`Pending`, `InReview`, `Resolved`);
   - select `Esito` (`Tutti`, `Refunded`, `NotRefunded`, `Deferred`);
   - select `Cinema`;
   - date range su data show;
   - toggle `Solo casi senza email inviata`.
4. **Tabella principale desktop** con colonne consigliate:
   - priorità/warning;
   - show (`film`, `cinema`, `data/ora`);
   - utente (`nome/email`);
   - ordine (`codice`, numero ticket);
   - stato ticket (`emessi`, `validati`, `annullati`);
   - importi (`carta`, `credito`, `totale`);
   - motivo review;
   - stato refund;
   - stato email;
   - azioni.
5. **Vista mobile/tablet**: card list al posto della tabella, con summary in 3 righe e CTA primaria `Apri dettaglio`.
6. **Colori e badge**:
   - `ValidatedTickets`: rosso/warning alto;
   - `StartedShow`: arancione;
   - `LateStripeWebhook`: viola o indaco;
   - `RefundFailed`: rosso forte;
   - `MissingPaymentData`: gold/warning.
7. **Badge stato review**:
   - `Pending` = outline/warning;
   - `InReview` = info;
   - `Resolved` = success/neutral a seconda dell'esito.
8. **Badge esito decisione**:
   - `Refunded`;
   - `NotRefunded`;
   - `Deferred`;
   - `NoEmailYet` o `EmailFailed` dove rilevante.
9. **Apertura dettaglio**: click riga apre un drawer laterale desktop o modale full-screen mobile.
10. **Sezioni del drawer/modale dettaglio**:
   - intestazione con film, cinema, sala, data/ora show;
   - box warning iniziale con motivo review e rischio operativo;
   - riepilogo ordine e pagamenti;
   - elenco ticket con stato `Issued`/`Validated`/`Cancelled`;
   - timeline eventi (`show annullato`, `webhook ricevuto`, `refund fallito`, `email inviata`, ecc.);
   - sezione tecnica con `PaymentIntentId`, `StripeRefundId`, ultimo errore, audit sintetico;
   - sezione comunicazioni con ultima email inviata o errore invio;
   - sezione decisione operatore.
11. **Decision panel** nel dettaglio:
   - radio o segmented control con `Rimborsa`, `Non rimborsare`, `Rinvia`;
   - textarea `Motivazione operatore` sempre visibile;
   - checkbox `Invia email all'utente dopo questa decisione`;
   - preview testuale della mail risultante, se l'opzione è attiva.
12. **Regole UX decisione**:
   - `Non rimborsare` richiede motivazione obbligatoria con lunghezza minima sensata;
   - `Rimborsa` mostra box di conferma con importi separati carta/credito e frase esplicita `Il rimborso userà lo stesso metodo di pagamento dell'ordine`;
   - `Rinvia` salva lo stato senza side effect economici.
13. **Conferma finale**:
   - modale di conferma secondaria per `Rimborsa` e `Non rimborsare`;
   - il testo della modale deve citare ordine, utente, importo totale e irreversibilità pratica della decisione.
14. **Protezione anti-doppio click**:
   - pulsanti disabilitati durante submit;
   - spinner inline;
   - riapertura stato dal backend al termine per evitare UI stale.
15. **Paginazione**:
   - server-side, con page size 20/50/100;
   - mantenimento filtri in querystring per condividere il link interno tra operatori.
16. **Ordinamento predefinito**:
   - prima `RefundFailed` e `LateStripeWebhook`;
   - poi casi con ticket validati;
   - poi anzianità della review.
17. **CTA contestuali nella tabella**:
   - `Dettaglio`;
   - `Prendi in carico` per passare da `Pending` a `InReview`;
   - `Retry refund` solo se esiste un fallimento tecnico e la decisione è già `Refunded` ma incompleta;
   - `Retry email` solo se esiste errore invio.
18. **Accessibilità e chiarezza**:
   - warning non affidati solo al colore;
   - testi diretti: `Ticket già validato`, `Show già iniziato`, `Pagamento incassato dopo annullamento`, `Rimborso carta fallito`;
   - nessun linguaggio ambiguo tipo `forse` o `probabilmente` nelle CTA.
19. **Comportamento con concorrenza operatori**:
   - mostrare `presa in carico da <utente>` se la review è già `InReview` da un altro operatore;
   - se un secondo operatore apre la stessa review, il submit deve essere rifiutato dal backend con messaggio chiaro e refresh dello stato.
20. **Linking con `shows.html`**:
   - da una riga show annullato deve essere disponibile CTA `Apri revisioni manuali` se esistono casi manuali collegati;
   - dal risultato del cancel automatico, se `ManualReviewCount > 0`, proporre link diretto a `refund-review.html?showCancellationId=...`.

**File frontend consigliati per il workspace manuale**:

- `frontend/CineBase.Web/wwwroot/refund-review.html`
- `frontend/CineBase.Web/wwwroot/js/pages/refund-review.js`
- `frontend/CineBase.Web/wwwroot/js/api.js`
- `frontend/CineBase.Web/wwwroot/js/route-guard.js`
- `frontend/CineBase.Web/wwwroot/js/admin-shell.js`

**`programmazione.html` e `scheda-film.html`**:

- non mostrare show annullati tra gli orari acquistabili;
- se un deep link o dato stale punta a uno show annullato, mostrare messaggio chiaro e bloccare il flusso di acquisto.

**`acquista.html` / seat-map**:

- se `Show.State == Cancelled`, bloccare hold e checkout lato backend e mostrare frontend “Spettacolo annullato”.

**`profilo.html`**:

- nella lista ordini/biglietti mostrare stato “Spettacolo annullato”, “Biglietto annullato”, “Rimborso in corso”, “Rimborso completato” o “Rimborso da verificare” quando disponibile;
- non mostrare QR/azione validabile per biglietti annullati;
- lasciare storico ordine per trasparenza.

**Navbar badge ruolo**:

- In `components/navbar-landing.html`, accanto a `#user-name` aggiungere badge ruolo visibile solo per `Admin`, `PowerUser`, `CinemaStaff`.
- In `admin-shell.js`, accanto a `#admin-user-name` e nel menu utente aggiungere lo stesso badge.
- In mobile, aggiungere badge accanto a `#mobile-user-name`.
- Label consigliate: `Admin`, `PowerUser`, `CinemaStaff` oppure `Staff Cinema` se si preferisce label più leggibile.
- Colori coerenti con badge già usati in `utenti.html`: Admin error, PowerUser gold, CinemaStaff cyan/emerald; nessun badge per `User`.
- Il badge deve derivare da `Auth.getUserRole()` o `user.ruolo`, normalizzato con la stessa logica già usata in navbar/admin shell.

---

### 7.5.10 — Email agli utenti interessati

L'email deve essere transazionale, non marketing, e inviata solo agli utenti con biglietti annullati o refund collegato allo show.

**Policy email raccomandata di fase**:

1. Inviare sempre una **prima email di annullamento** quando uno show acquistato viene effettivamente annullato e i biglietti dell'ordine diventano non più utilizzabili nel percorso automatico.
2. La prima email deve includere anche lo stato del rimborso al momento dell'invio:
   - `credito`: rimborso completato;
   - `Stripe carta`: rimborso avviato/richiesto;
   - `misto`: quota credito completata + quota carta avviata;
   - `pending/manual review`: biglietto annullato, rimborso in elaborazione o in revisione.
3. Per i casi che finiscono nel workspace manuale, **non inviare automaticamente l'email di annullamento finale prima della decisione economica**, perché il messaggio deve essere coerente con la decisione del backoffice.
4. Dopo la decisione manuale o dopo un retry refund riuscito, inviare una **seconda email di aggiornamento** solo se lo stato del rimborso è cambiato in modo sostanziale rispetto alla prima comunicazione oppure se nessuna email era stata ancora inviata.
5. Non inviare una seconda email ridondante se la prima comunicazione già conteneva uno stato definitivo e non è cambiato nulla.
6. Se l'email iniziale fallisce, il sistema deve consentire retry separato; il fallimento email non deve bloccare show cancellation o refund.

Servizio consigliato:

```text
IShowCancellationEmailService
  Task<EmailSendResult> SendShowCancellationAsync(ShowCancellationEmailDTO dto, CancellationToken ct = default)
```

In alternativa minima, estendere `IEmailService` con un metodo dedicato; evitare di riusare impropriamente `IAccountEmailService` perché quello è orientato alla sicurezza account.

Contenuto minimo email:

- saluto con nome utente se disponibile;
- titolo film, cinema, sala, data/ora show annullato;
- elenco codici biglietto annullati o almeno numero biglietti;
- importo rimborso totale;
- dettaglio quote: carta Stripe, credito piattaforma;
- stato rimborso: “avviato”, “completato per credito piattaforma”, “richiesto a Stripe”, “in verifica”;
- testo prudente sulle tempistiche Stripe: l'accredito su carta può richiedere alcuni giorni lavorativi e dipende dal circuito/banca;
- eventuale messaggio pubblico scritto dall'operatore;
- link a profilo/biglietti e condizioni di vendita.

Regole invio:

1. Una email per ordine/utente, non una per singolo biglietto, salvo decisione futura.
2. Email opzionale nel flusso UI, ma se selezionata deve essere tracciata per ordine/refund o review manuale.
3. Per i casi automatici, la prima email parte al termine dell'annullamento/refund automatico con stato coerente al momento dell'invio.
4. Per i casi manuali, l'email parte solo dopo la risoluzione della review oppure dopo decisione esplicita dell'operatore di inviare una notifica intermedia di presa in carico.
5. Fallimento email non deve rollbackare show cancellation o refund.
6. Salvare `EmailSentAtUtc`, `EmailLastError`, `EmailRetryCount` e `EmailTemplateType` su entità dedicata oppure su `OrdineRefund`/`ManualRefundReview` se si sceglie modello minimo.
7. Email a utenti anonimizzati o senza email valida: saltare invio, marcare warning e non fallire l'intera operazione.

---

### 7.5.11 — Sicurezza, consistenza e audit

Requisiti non negoziabili:

1. Tutti gli endpoint di annullamento e refund devono essere idempotenti.
2. Il sistema non deve mai creare due refund Stripe per lo stesso ordine/show cancellation.
3. Il sistema non deve mai creare due movimenti credito di rimborso per lo stesso ordine/show cancellation.
4. Non inviare email che promettano “rimborso completato” se Stripe ha solo accettato una richiesta `pending`.
5. Non permettere nuovi hold, nuovi ordini o checkout su show `Cancelled`.
6. Non permettere validazione di biglietti collegati a show `Cancelled` o biglietti `Cancelled`.
7. Non cancellare fisicamente uno show con ordini, biglietti, refund o cancellation record.
8. Non fare affidamento sul frontend per decidere importi o destinatari: il backend ricalcola da ordini/biglietti persistiti.
9. Non fidarsi di importi inviati dal client nel payload cancellation/refund.
10. Non esporre agli utenti finali dettagli tecnici Stripe non necessari; usare messaggi operativi chiari.
11. Auditare actor e metadata senza salvare dati carta o informazioni sensibili di pagamento.

Audit metadata consigliato:

```json
{
  "showId": 123,
  "showCancellationId": 10,
  "orderId": 456,
  "ticketIds": [1, 2],
  "cardAmount": 18.00,
  "creditAmount": 4.00,
  "stripeRefundId": "re_...",
  "status": "Completed"
}
```

---

### 7.5.12 — Test automatici da aggiungere in FASE 7.5 o FASE 8

Test backend consigliati in un nuovo file `ShowCancellationIntegrationTests.cs`:

1. `Admin` annulla show senza biglietti: show `Cancelled`, nessun refund.
2. `PowerUser` annulla show senza biglietti: consentito.
3. `CinemaStaff` con `CanManageShows` tenta annullamento: `403`.
4. `User` tenta annullamento: `403`.
5. Annullamento show con ordine `Pending`: hold rimossi, ordine `Cancelled`, nessun refund.
6. Annullamento show con ordine `CheckoutInProgress`: credito riservato rilasciato, sessione Stripe scaduta via fake gateway, ordine `Cancelled`.
7. Annullamento show con ordine paid carta: creato refund Stripe con amount corretto, ticket `Cancelled`, refund `Completed` o stato coerente fake.
8. Annullamento show con ordine paid credito: movimento credito `Refund` creato, saldo utente incrementato, nessuna chiamata Stripe.
9. Annullamento show con ordine paid misto: refund Stripe per `ImportoCarta` e movimento credito per `ImportoCredito`.
10. Retry refund non duplica `StripeRefundId` né movimento credito.
11. Seconda chiamata `cancel` sullo stesso show ritorna `409` o risultato idempotente esplicito senza duplicare effetti.
12. Biglietto `Validated` blocca il flusso automatico con `409` e messaggio operativo.
13. Show già iniziato/passato blocca il flusso automatico con `409` e messaggio operativo.
14. `GET /shows` pubblico non espone show annullati come acquistabili.
15. `SeatHold` rifiuta show annullato.
16. `CreateOrdine` rifiuta show annullato.
17. `CreateCheckoutSession` rifiuta show annullato.
18. Validazione biglietto rifiuta biglietto/show annullato.
19. Stripe Checkout Session riceve `CustomerEmail` dall'utente autenticato.
20. Fake gateway registra `CustomerEmail` nei test e fallisce se assente nel caso carta/misto.
21. Email cancellation inviata quando richiesta.
22. Fallimento email non rollbacka refund e lascia retry disponibile.
23. Webhook `checkout.session.completed` tardivo su show annullato non emette biglietti validi e crea refund/errore gestito.
24. Delete fisico show con storico annullato resta bloccato.

Test frontend/minimi statici:

- `node --check frontend/CineBase.Web/wwwroot/js/pages/shows.js`;
- `node --check frontend/CineBase.Web/wwwroot/js/auth.js` se toccato;
- `node --check frontend/CineBase.Web/wwwroot/js/admin-shell.js`;
- grep su navbar/admin shell per badge ruolo;
- grep su `CustomerEmail`/`customerEmail` nei file backend e fake test.

---

### 7.5.13 — File e aree impattate

Backend probabili:

- `Model/Show.cs`
- `Model/ShowState.cs` nuovo
- `Model/ShowCancellation.cs` nuovo
- `Model/OrdineRefund.cs` nuovo
- `Model/RefundStatus.cs` nuovo
- `Model/Biglietto.cs`
- `Data/FilmDbContext.cs`
- `DTO/ShowDTO.cs`
- nuovo `DTO/ShowCancellationDTO.cs`
- `Services/IShowService.cs` / `ShowService.cs`
- nuovo `Services/IShowCancellationService.cs` / `ShowCancellationService.cs`
- `Services/IStripePaymentGateway` / `StripePaymentGateway.cs`
- `Services/ICreditoService.cs` / `CreditoService.cs`
- `Services/IEmailService.cs` / `EmailService.cs` oppure nuovo servizio email cancellation
- `Services/PagamentoService.cs`
- `Services/CheckoutService.cs`
- `Services/ValidazioneBigliettoService.cs`
- `Endpoints/ShowsEndpoints.cs`
- `Endpoints/CheckoutEndpoints.cs`
- eventuale endpoint o mapping dedicato `ShowCancellationEndpoints.cs`
- `Program.cs`
- migration EF dedicata, ad esempio `AddShowCancellationAndRefunds`
- `backend/.env.example` solo se si introducono variabili email/template/refund nuove

Frontend probabili:

- `frontend/CineBase.Web/wwwroot/shows.html`
- `frontend/CineBase.Web/wwwroot/js/pages/shows.js`
- `frontend/CineBase.Web/wwwroot/js/api.js`
- `frontend/CineBase.Web/wwwroot/js/route-guard.js` solo se servono nuovi path
- `frontend/CineBase.Web/wwwroot/js/pages/programmazione.js`
- `frontend/CineBase.Web/wwwroot/js/pages/scheda-film.js`
- `frontend/CineBase.Web/wwwroot/js/pages/acquista.js`
- `frontend/CineBase.Web/wwwroot/js/pages/pagamento.js`
- `frontend/CineBase.Web/wwwroot/js/pages/profilo.js`
- `frontend/CineBase.Web/wwwroot/components/navbar-landing.html`
- `frontend/CineBase.Web/wwwroot/js/admin-shell.js`

Test probabili:

- nuovo `tests/backend/Integration/ShowCancellationIntegrationTests.cs`
- `tests/backend/Integration/CustomWebApplicationFactory.cs` per fake Stripe refund/session expire/email cancellation
- estensioni a test checkout/pagamento esistenti se già coprono Stripe Checkout hosted

---

### 7.5.14 — Criteri di accettazione specifici

1. `Admin` e `PowerUser` possono annullare uno show da UI e API.
2. `CinemaStaff` non può annullare show né processare refund, anche con `CanManageShows`.
3. Lo show annullato non è più acquistabile e non accetta nuovi hold/ordini/checkout.
4. Biglietti collegati allo show annullato non sono più validabili.
5. Gli ordini non pagati vengono annullati o scaduti senza refund e con rilascio credito riservato.
6. Gli ordini pagati carta vengono rimborsati tramite Stripe sul `PaymentIntent` originale.
7. Gli ordini pagati credito vengono rimborsati con movimento credito piattaforma idempotente.
8. Gli ordini misti vengono rimborsati su entrambe le quote, senza scelta manuale di metodo diverso.
9. Retry refund non produce doppi rimborsi.
10. Fallimenti Stripe o email sono visibili e ritentabili.
11. Email opzionale agli utenti contiene informazioni corrette su show, biglietti, importi e stato refund.
12. Stripe Checkout precompila l'email dell'utente autenticato per pagamenti carta/misti.
13. Navbar landing, mobile e admin shell mostrano badge ruolo per `Admin`, `PowerUser`, `CinemaStaff` e nessun badge per `User`.
14. Show annullati restano nello storico admin/profilo ma non nella programmazione acquistabile.
15. Build backend/frontend verdi e suite test backend verde.

---

### 7.5.15 — Stima effort

| Attività | Tempo stimato |
| --- | --- |
| Migration/model DTO show cancellation/refund | 90-150 min |
| Gateway Stripe refund + expire session + email checkout prefill | 90-180 min |
| Servizio cancellation/refund idempotente | 240-420 min |
| Email cancellation e tracciamento retry | 90-180 min |
| Endpoint e autorizzazioni | 90-150 min |
| Aggiornamento checkout/seat-map/validazione per show annullato | 120-210 min |
| Frontend `shows.html` preview/annulla/refund/email/retry | 240-420 min |
| Profilo/programmazione/scheda film stati annullati | 120-210 min |
| Badge ruolo navbar/admin shell/mobile | 45-90 min |
| Test integrazione e fake Stripe/email | 240-420 min |
| Smoke Stripe test mode/email reale | 90-180 min |
| **Totale realistico** | **3-5 giornate tecniche** |

---

### 7.5.16 — Checklist fase

- [x] Stato show annullato modellato e migrato
- [x] `ShowCancellation` e `OrdineRefund` introdotti
- [x] Stripe Checkout precompila email utente
- [x] Gateway Stripe supporta refund e scadenza sessione hosted
- [x] Rimborso credito piattaforma idempotente implementato
- [x] Servizio annullamento show con preview, cancel, process refund e retry implementato
- [x] Endpoint backend protetti da `Admin`/`PowerUser`
- [x] `CinemaStaff` escluso da annullamento e refund lato backend e frontend
- [x] Acquisto/hold/checkout/validazione bloccano show annullati
- [x] UI `shows.html` con preview impatto, motivo, refund, email e retry
- [x] Email cancellation transazionale implementata e ritentabile
- [x] Profilo mostra biglietti annullati e stato rimborso
- [x] Programmazione/scheda film non espongono show annullati come acquistabili
- [x] Badge ruolo visibile in navbar landing, mobile e admin shell per ruoli non finali
- [x] Test backend annullamento/rimborsi/Stripe/email aggiunti
- [x] Build backend verde
- [x] Build frontend verde
- [x] Suite backend verde
- [ ] Smoke Stripe test mode e SMTP reale eseguito o limitazione documentata

---

### 7.5.17 — Review e testing aggiuntivo post-implementazione

- Sulla `FASE 7.5` è stata eseguita una review post-implementazione dei commit recenti con verifica mirata di backend, frontend e copertura test.
- Sono stati applicati fix aggiuntivi su gestione webhook Stripe tardivi, fallback `PaymentIntent`/manual review, ricerca `search` delle manual review, metadata cancellation esposti solo al backoffice e CTA di dettaglio/retry da `shows.html`.
- È stato eseguito anche un cleanup dei warning nullable/analyzer nei file backend/test toccati durante il consolidamento finale, senza ridurre la copertura automatica.

**Verifiche aggiuntive eseguite**:

- `dotnet test tests/backend/FilmAPI.Tests.csproj --filter FullyQualifiedName~ShowCancellationIntegrationTests --verbosity minimal` → **32/32 PASS**.
- `dotnet test tests/backend/FilmAPI.Tests.csproj --filter FullyQualifiedName~AccountDeletionIntegrationTests --verbosity minimal` → **22/22 PASS**.
- `dotnet test tests/backend/FilmAPI.Tests.csproj --verbosity minimal` → **370/370 PASS, 0 FAIL, 0 SKIP**.
- `dotnet build tests/backend/FilmAPI.Tests.csproj -t:Rebuild --verbosity minimal` → **0 Warning(s), 0 Error(s)**.
- `dotnet build frontend/CineBase.Web/CineBase.Web.csproj` → **OK**.
- `node --check` sui file JS modificati → **OK**.

---

### FASE 8 - Test automatici estesi auth/security

**Obiettivo**: consolidare la copertura automatica dell'intera superficie introdotta fino alla `FASE 7.5`, non solo sull'auth backend puro ma anche sulle regressioni critiche di UX account (`FASE 6.1`), GDPR applicativo (`FASE 7.1`), `CinemaStaff` scoped e fix post-smoke (`FASE 7.2`), hardening route guard (`FASE 7.3`), acceptance legale/versionamento documenti della `FASE 7.4` e annullamento show/rimborsi/notifiche della `FASE 7.5`.

La fase non parte più da zero: diversi file di test, fake e helper esistono già e vanno estesi o riallineati, non ricreati inutilmente.

**File test da estendere o introdurre dove ancora mancanti**:

- `tests/backend/Integration/PasswordCredentialsIntegrationTests.cs`
- `tests/backend/Integration/ExternalAuthIntegrationTests.cs`
- `tests/backend/Integration/AdminUserSecurityIntegrationTests.cs`
- `tests/backend/Integration/AccountDeletionIntegrationTests.cs`
- `tests/backend/Integration/CinemaStaffAuthorizationIntegrationTests.cs`
- nuovo `tests/backend/Integration/ShowCancellationIntegrationTests.cs` per `FASE 7.5`
- eventuali estensioni a `AuthIntegrationTests.cs` e `RbacIntegrationTests.cs`
- eventuale `LegalAcceptanceIntegrationTests.cs` oppure estensioni ai test auth/checkout esistenti, se la `FASE 7.4` introduce persistence/backend enforcement della presa visione legale

**Aggiornare `CustomWebApplicationFactory` e i fake esistenti**:

- fake `IAccountEmailService` già presente, esteso quando serve a coprire conferma cancellazione, setup password e flussi legali eventualmente introdotti;
- fake provider OIDC Google/Microsoft o fake `IExternalAuthProvider`, allineati anche ai casi reali Microsoft personale/work-school, consenso negato e policy tenant;
- helper per creare utenti social-only, utenti disabilitati, utenti anonimizzati e utenti con `AuthVersion` diverso;
- helper per creare utenti `CinemaStaff` con assegnazioni cinema e capability differenziate;
- helper per leggere audit log, token temporanei, export GDPR e revoca sessioni;
- helper per ruoli dinamici e source of truth `GET /admin/utenti/roles`;
- helper per versioni documenti legali/acceptance, se la `FASE 7.4` persiste dati lato backend.
- fake Stripe esteso per `CustomerEmail`, refund carta e scadenza sessione Checkout hosted;
- fake email esteso per notifiche show annullato e retry invio.

**Casi test obbligatori**:

Password, reset e sicurezza account:

- cambio password success;
- cambio password con password attuale errata;
- reset password con email esistente/inesistente non enumerativo;
- token reset single-use;
- token reset scaduto;
- revoca refresh token post reset;
- invalidazione `AuthVersion`;
- setup password per account social-only e successiva promuovibilità dell'utente.

Social:

- Google valido con email verificata su dominio generico, ad esempio `gmail.com`;
- Google valido con email verificata su dominio generico esterno, ad esempio `outlook.com`, purché sia un account Google valido;
- Google valido con email verificata su dominio `issgreppi.it`;
- Microsoft valido con account personale, ad esempio `outlook.com`, `hotmail.com` o `live.*`;
- Microsoft valido con account work/school `issgreppi.it`;
- Microsoft valido con account work/school di tenant diverso;
- Google con email non verificata rifiutato;
- Microsoft con issuer non coerente con `tid` rifiutato;
- Microsoft senza identificatore stabile rifiutato;
- Microsoft senza email-like utilizzabile rifiutato per autocreazione/linking;
- Microsoft con consenso negato o policy tenant bloccante gestito con errore chiaro;
- account operativo/elevato (`CinemaStaff`, `PowerUser`, `Admin`) rifiutato;
- linking account `User` esistente;
- exchange code single-use;
- state replay bloccato;
- redirect esterno bloccato.

Admin utenti e ruoli dinamici:

- `GET /admin/utenti/roles` espone i ruoli assegnabili e i metadati UI corretti (`RequiresCinemaAssignments`, `CanInvite`, `CanAssignExisting`);
- admin crea invito `PowerUser`;
- admin crea invito `Admin`;
- admin crea invito `CinemaStaff` con assegnazioni cinema valide;
- invito `CinemaStaff` su email social-only già esistente restituisce errore operativo chiaro;
- non-admin non può creare inviti;
- promozione utente locale OK;
- promozione social-only rifiutata;
- ultimo admin non degradabile;
- cambio ruolo revoca sessioni;
- audit presente.

CinemaStaff e permessi cinema:

- enum `CinemaStaff` aggiunto senza rinumerare ruoli esistenti;
- social login rifiuta `CinemaStaff`;
- `GET /staff/me/cinemas` restituisce `401` anonimo, `403` per `User`, `200` per `CinemaStaff`/`PowerUser`/`Admin` coerentemente con il ruolo;
- admin crea/aggiorna/revoca assegnazioni cinema;
- cambio assegnazioni revoca sessioni e incrementa `AuthVersion`;
- staff valida biglietti solo con `CanValidateTickets` sul cinema corretto;
- lookup ticket richiede e verifica `cinemaId` nello scope corretto;
- staff ricarica credito solo con `CanTopUpCredit` e `CinemaId` autorizzato;
- staff gestisce show solo con `CanManageShows` sul cinema corretto;
- `GET /shows` supporta `salaId` senza perdere lo scoping per cinema;
- staff non accede a catalogo globale, sale/layout, cinema CRUD e utenti;
- `PowerUser` e `Admin` conservano accesso globale.

GDPR applicativo (`FASE 7.1`):

- export dati utente con e senza transazioni;
- richiesta cancellazione invia email;
- conferma cancellazione con token valido/scaduto/riusato;
- login bloccato dopo anonimizzazione;
- admin export utente;
- admin delete utente;
- admin non può cancellare ultimo admin;
- toggle `IsDisabled` con vincoli corretti;
- anonimizzazione preserva ordini/biglietti/movimenti credito;
- anonimizzazione revoca assegnazioni `CinemaStaff` attive;
- rimozione `ExternalLogins` consente la ri-registrazione social successiva;
- RBAC endpoint admin GDPR.

Compliance web e acceptance legale (`FASE 7.4`, se implementata lato backend):

- la registrazione locale salva versione/timestamp dei documenti legali;
- il social login non crea un nuovo account bypassando la presa visione legale;
- un utente già esistente ma con versione legale non allineata viene riallineato tramite prompt/interstitial;
- il checkout, o il punto equivalente di conferma ordine, richiede presa visione esplicita;
- eventuali flag/config sul DPO o sui riferimenti legali non espongono dati non abilitati;
- eventuali endpoint/config pubblici usati dalle pagine legali restituiscono solo informazioni coerenti con la configurazione effettivamente attiva.

Annullamento show, rimborsi e notifiche (`FASE 7.5`):

- `Admin` annulla show senza biglietti e non crea refund;
- `PowerUser` annulla show secondo le stesse regole operative;
- `CinemaStaff`, anche con `CanManageShows`, riceve `403` su annullamento/refund;
- ordini `Pending` e `CheckoutInProgress` vengono annullati con rilascio hold/credito riservato;
- sessione Stripe Checkout aperta viene scaduta tramite fake gateway quando lo show è annullato;
- ordine paid carta genera refund Stripe sul `PaymentIntent` originale;
- ordine paid credito genera movimento `Refund` idempotente;
- ordine paid misto genera refund su carta e credito con importi coerenti;
- retry refund non duplica `StripeRefundId` né movimenti credito;
- biglietti `Issued` diventano `Cancelled` con metadata annullamento;
- biglietti `Validated` e show già iniziati/passati bloccano il flusso automatico e non sono annullati silenziosamente;
- `SeatHold`, `CreateOrdine`, `CreateCheckoutSession` e validazione biglietto rifiutano show annullati;
- webhook Stripe tardivo su show annullato non emette biglietti validi e produce stato refund coerente;
- `StripeCreateCheckoutSessionRequest.CustomerEmail` arriva dal profilo utente e viene passato al fake gateway;
- email show cancellation inviata se richiesta, fallimento email tracciato e ritentabile;
- delete fisico show con storico annullato resta bloccato.

RBAC e regressione:

- endpoint `utenti` AdminOnly;
- `GET /admin/utenti/roles` AdminOnly;
- login/register/refresh/logout/me esistenti non regrediscono;
- `User` normale continua ad accedere a checkout/profilo;
- `CinemaStaff` accede solo a pagine operative e profilo;
- `PowerUser` e `Admin` continuano ad accedere alle pagine operative già esistenti.

**Verifiche automatiche complementari frontend**:

- `node --check` sui file JS critici toccati nelle `FASE 6.1`, `7.2`, `7.3`, `7.4` e `7.5` (`auth.js`, `api.js`, `route-guard.js`, `template-loader.js`, `admin-shell.js`, `profilo.js`, `my-cinemas.js`, `utenti.js`, `shows.js`, `validazione-biglietti.js`, `pagamento.js`, eventuali file legali/geolocalizzazione/cancellation);
- `dotnet build frontend/CineBase.Web/CineBase.Web.csproj`;
- grep mirati per verificare presenza di `route-guard-pending`, `auth:ready`, `RouteGuard.whenReady()`, link legali reali, chiamate di geolocalizzazione confinante al flusso opt-in, `CustomerEmail` su Stripe Checkout e badge ruolo in navbar/admin shell.

**Comandi verifica**:

```bash
dotnet build backend/FilmAPI/FilmAPI.csproj
dotnet build frontend/CineBase.Web/CineBase.Web.csproj
dotnet build tests/backend/FilmAPI.Tests.csproj
dotnet test tests/backend/FilmAPI.Tests.csproj --verbosity minimal
node --check frontend/CineBase.Web/wwwroot/js/auth.js
node --check frontend/CineBase.Web/wwwroot/js/route-guard.js
node --check frontend/CineBase.Web/wwwroot/js/template-loader.js
node --check frontend/CineBase.Web/wwwroot/js/pages/profilo.js
node --check frontend/CineBase.Web/wwwroot/js/pages/my-cinemas.js
node --check frontend/CineBase.Web/wwwroot/js/pages/utenti.js
node --check frontend/CineBase.Web/wwwroot/js/pages/shows.js
node --check frontend/CineBase.Web/wwwroot/js/pages/validazione-biglietti.js
rg -n "route-guard-pending|auth:ready|whenReady|privacy.html|cookie.html|termini-condizioni.html" frontend/CineBase.Web/wwwroot
rg -n "getCurrentPosition|watchPosition" frontend/CineBase.Web/wwwroot/js/pages
rg -n "CustomerEmail|customerEmail|CreateRefund|StripeRefund|ExpireCheckoutSession" backend/FilmAPI tests/backend
rg -n "role-badge|badge ruolo|admin-user-role|mobile-user-role" frontend/CineBase.Web/wwwroot
```

**Checklist fase**:

- [x] `CustomWebApplicationFactory` e fake esistenti allineati ai fix `FASE 7.1/7.2` e ai flussi `FASE 7.4` se introdotti
- [x] Test password/reset/security riallineati
- [x] Test social Google/Microsoft riallineati
- [x] Test admin utenti e ruoli dinamici riallineati
- [x] Test GDPR `FASE 7.1` riallineati
- [x] Test `CinemaStaff`/scoping cinema/lookup ticket/filtro sala aggiunti o estesi
- [x] Copertura acceptance legale/backend aggiunta oppure limitazione documentata esplicitamente
- [x] Test annullamento show/rimborsi/Stripe/email `FASE 7.5` aggiunti o estesi
- [x] `node --check` sui file frontend critici eseguito
- [x] Build backend/frontend/test verdi
- [x] Suite backend verde

---

### FASE 9 - Smoke test runtime e verifica manuale sicurezza

**Obiettivo**: verificare end-to-end ciò che i test automatici non coprono pienamente, soprattutto browser reale, redirect, UX account, permessi `CinemaStaff`, route guard, flussi GDPR, trasparenza web e flussi economici di annullamento/rimborso introdotti o completati nelle `FASE 6.1`, `7.1`, `7.2`, `7.3`, `7.4` e `7.5`.

**Build da eseguire**:

```bash
dotnet build backend/FilmAPI/FilmAPI.csproj
dotnet build frontend/CineBase.Web/CineBase.Web.csproj
dotnet build backend/scripts/FilmApiSeeder/FilmApiSeeder.csproj
dotnet test tests/backend/FilmAPI.Tests.csproj
```

**Smoke runtime locale**:

- `login.html` 200;
- `registrazione.html` 200;
- `recupera-password.html` 200;
- `reimposta-password.html` 200;
- `social-login-complete.html` 200;
- `conferma-cancellazione.html` 200;
- `programmazione.html` 200;
- `scheda-film.html` 200;
- `profilo.html` protetta;
- `my-cinemas.html` protetta;
- `utenti.html` AdminOnly;
- `privacy.html`, `cookie.html` e `termini-condizioni.html` 200 e raggiungibili da anonimo, una volta implementate in `FASE 7.4`;
- `shows.html`, `ricarica-credito.html`, `validazione-biglietti.html` accessibili a `CinemaStaff` solo se autenticato;
- `films.html`, `registi.html`, `categorie.html`, `sale.html`, `utenti.html` non accessibili a `CinemaStaff`;
- `shows.html` mostra badge stato show e azione annullamento solo per `Admin`/`PowerUser`, se la `FASE 7.5` è implementata;
- `GET /auth/external/providers` 200;
- `POST /auth/forgot-password` 200 generico;
- `POST /auth/change-password` 401 da anonimo;
- `POST /auth/me/export` 401 da anonimo, 200 da autenticato;
- `POST /auth/me/delete/request` 401 da anonimo, 200 da autenticato;
- `GET /staff/me/cinemas` 401 anonimo, 403 user, 200 staff/power/admin;
- `GET /admin/utenti` 401 anonimo, 403 user/staff/power, 200 admin;
- `GET /admin/utenti/roles` 401 anonimo, 403 user/staff/power, 200 admin;
- `GET /shows/{id}/cancellation-preview` e `POST /shows/{id}/cancel` 401 anonimo, 403 user/staff, 200/409 coerente per power/admin, se la `FASE 7.5` è implementata.

**Verifica manuale browser**:

**FASE 6.1 - UX account e profilo**:

- login locale `User`;
- registrazione pubblica crea sempre `User`;
- recupero password mostra UX coerente e non enumerativa sia per email esistente sia inesistente;
- `my-cinemas.html`: azione "Imposta preferito" salva davvero il cinema e il profilo si riallinea;
- `profilo.html`: accordion, deep-link `#tickets-section`, paginazione ordini/biglietti e navigazione da navbar Biglietti funzionano senza regressioni.

**FASE 7.1 - GDPR applicativo**:

- cambio password `User`;
- reset password `User`;
- reset password `Admin`;
- esportazione dati personali in JSON per utente autenticato;
- richiesta cancellazione account con email di conferma;
- conferma cancellazione via `conferma-cancellazione.html`;
- account anonimizzato non può più fare login locale o social;
- admin può eseguire export, disable, enable e delete con vincoli corretti;
- se testabile con provider reale, ri-registrazione Microsoft dopo anonimizzazione riuscita.

**FASE 7.2 - CinemaStaff scoped e fix post-smoke**:

- login locale `CinemaStaff` con redirect corretto a `dashboard.html`;
- login locale `CinemaStaff` senza cinema assegnato mostra messaggio chiaro e non consente operazioni;
- `CinemaStaff` vede in navbar/footer il solo accesso coerente all'area operativa, senza link globali non autorizzati;
- apertura diretta `utenti.html`, `films.html`, `sale.html` da `CinemaStaff` viene bloccata;
- `CinemaStaff` vede solo cinema assegnati in validazione, ricarica credito e gestione show;
- `CinemaStaff` non può validare un biglietto di un altro cinema manipolando URL/body;
- `CinemaStaff` non può ricaricare credito su cinema non assegnato manipolando il body;
- `CinemaStaff` non può creare o modificare show su cinema non assegnato;
- filtro sala in `shows.html` funziona davvero e riflette il parametro `salaId`;
- modale invito admin usa i ruoli esposti dal backend; invito su email social-only già esistente mostra il messaggio operativo corretto;
- admin crea invito `PowerUser`;
- admin crea invito `CinemaStaff` e assegna capability per cinema;
- admin modifica assegnazioni `CinemaStaff` e le sessioni vecchie vengono invalidate;
- utente invitato imposta password e accede;
- admin promuove utente locale;
- admin non può promuovere social-only senza password.

**FASE 7.3 - Hardening route guard**:

- apertura diretta anonima `dashboard.html`, `shows.html`, `utenti.html` non mostra markup protetto percepibile prima del redirect;
- apertura diretta da utente autenticato ma non autorizzato non mostra shell admin completa prima del redirect;
- bootstrap di navbar/footer/template/shell avviene solo dopo autorizzazione confermata.

**FASE 7.4 - GDPR web compliance**:

- `privacy.html`, `cookie.html` e `termini-condizioni.html` sono raggiungibili da anonimo e linkate da footer, auth e checkout;
- i link legali non sono più placeholder `#`;
- registrazione locale richiede presa visione dei documenti legali e salva la versione, se la persistence è stata implementata;
- social login non bypassa la presa visione legale per nuovi account;
- checkout richiede presa visione esplicita prima del submit;
- geolocalizzazione non viene richiesta automaticamente al caricamento pagina;
- geolocalizzazione viene richiesta solo dopo azione esplicita dell'utente e ha fallback neutro;
- DevTools/Application: le chiavi `localStorage` effettive sono coerenti con `cookie.html`;
- DevTools/Network: le risorse esterne passive effettivamente caricate sono coerenti con notice leggero e informative;
- nessun testo pubblico promette l'assenza totale di risorse esterne se queste sono ancora presenti;
- la sezione DPO/RPD compare solo se realmente prevista dalla configurazione adottata.

**FASE 7.5 - Annullamento show, rimborsi e notifiche**:

- in Stripe test mode, un pagamento carta/misto mostra l'email dell'utente già precompilata nel form hosted;
- `Admin` apre `shows.html`, annulla uno show senza biglietti e vede stato `Annullato`;
- `PowerUser` vede ed esegue il flusso di annullamento consentito;
- `CinemaStaff` non vede l'azione annullamento e un accesso API manuale riceve `403`;
- show annullato non compare più tra gli orari acquistabili in `programmazione.html` e `scheda-film.html`;
- apertura diretta di `acquista.html?showId=<annullato>` mostra blocco chiaro e non consente hold;
- ordine pending collegato a show annullato rilascia i posti;
- ordine checkout hosted in corso collegato a show annullato rilascia credito riservato e scade/neutralizza la sessione Stripe;
- ordine pagato carta genera refund Stripe test mode con importo corretto;
- ordine pagato credito genera riaccredito nel saldo piattaforma;
- ordine pagato misto genera sia refund Stripe sia movimento credito;
- retry refund fallito non duplica movimenti o refund;
- se l'email è selezionata, l'utente riceve una comunicazione con show, biglietti annullati e stato rimborso;
- se l'invio email fallisce, il refund resta valido e l'errore è visibile/ritentabile;
- profilo utente mostra biglietti annullati e stato rimborso senza QR validabile;
- navbar landing desktop/mobile e admin shell mostrano badge ruolo accanto al nome per `Admin`, `PowerUser`, `CinemaStaff` e nessun badge per `User`.

**Provider reali e redirect**:

- login locale `PowerUser`;
- login locale `Admin`;
- apertura diretta `utenti.html` da `PowerUser` viene bloccata;
- social login Google reale con account `gmail.com`, se credenziali provider disponibili;
- social login Google reale con account Google verificato su dominio esterno, ad esempio `outlook.com`, se credenziali provider disponibili;
- social login Google reale con account `@issgreppi.it`, se credenziali provider disponibili;
- social login Microsoft reale con account personale, ad esempio `outlook.com`, se credenziali provider disponibili;
- social login Microsoft reale con account work/school `@issgreppi.it`, se tenant/config disponibili;
- social login Microsoft reale con account work/school di altro tenant, se testabile;
- social login Microsoft con consenso negato o policy tenant bloccante mostra errore chiaro, se testabile;
- open redirect: `login.html?redirect=https://evil.example` non deve uscire dal sito;
- open redirect: callback social con redirect esterno non deve uscire dal sito.

**Verifica email reale opzionale ma consigliata**:

- invio reset password via SMTP configurato;
- link reset apre frontend corretto;
- token non riutilizzabile dopo reset.

**Checklist fase**:

- [ ] Build backend verde
- [ ] Build frontend verde
- [ ] Build seeder verde
- [ ] Test backend verdi
- [ ] Smoke pagine auth/operative/GDPR web OK
- [ ] Smoke endpoint auth/admin/GDPR OK
- [ ] Verifica manuale `FASE 6.1` completata
- [ ] Verifica manuale `FASE 7.1` completata
- [ ] Verifica manuale `FASE 7.2` completata
- [ ] Verifica manuale `FASE 7.3` completata
- [ ] Verifica manuale `FASE 7.4` completata
- [ ] Verifica manuale `FASE 7.5` completata
- [ ] Verifica provider reali eseguita o motivazione documentata
- [ ] Verifica Stripe test mode refund/precompilazione email eseguita o motivazione documentata
- [ ] Verifica email reale eseguita o motivazione documentata
- [ ] Open redirect verificati

---

### FASE 10 - Documentazione finale

**Obiettivo**: rendere tracciabile e veritiero lo stato finale dell'Iterazione 5, distinguendo chiaramente ciò che è già stato consolidato nelle `FASE 6.1`, `7.1`, `7.2`, `7.3`, `7.4` e ciò che viene effettivamente implementato nella `FASE 7.5`, senza dichiarazioni documentali più forti dello stato reale del codice.

Aggiornare e riallineare:

- `docs/project/status.md`
- `docs/project/changelog.md`
- `docs/project/dev_iteration/5/PianoDiLavoro.md`
- `backend/.env.example`
- `docs/tutorials/TUTORIAL_SOCIAL_LOGIN_GOOGLE_MICROSOFT.md`
- `docs/tutorials/TUTORIAL_GDPR_COMPLIANCE_CINEBASE.md`
- `docs/tutorials/TUTORIAL_GDPR_COMPLIANCE_CINEBASE_QUICK_REFERENCE.md`

Se la `FASE 7.4` viene completata, verificare inoltre la coerenza tra documentazione di progetto e pagine pubbliche `privacy.html`, `cookie.html`, `termini-condizioni.html`. Se la `FASE 7.5` viene completata, verificare anche coerenza tra piano, changelog, termini/condizioni di vendita, comportamento reale di annullamento show, rimborsi Stripe/credito e notifiche email.

`status.md` deve indicare:

- fasi Iterazione 5 completate;
- numero test aggiornato;
- fix/miglioramenti `FASE 6.1` su profilo, cinema preferito, deep-link biglietti e UX account;
- stato `FASE 7.1` con export, cancellazione, anonimizzazione, disable/enable e vincoli relativi;
- stato `FASE 7.2` con `CinemaStaff`, assegnazioni per cinema, `GET /staff/me/cinemas`, `GET /admin/utenti/roles` e fix runtime post-smoke;
- stato `FASE 7.3` con `route-guard-pending`, `auth:ready`, `RouteGuard.whenReady()` e modello accettato di template statico;
- stato `FASE 7.4` con pagine legali, geolocalizzazione opt-in, notice leggero, acceptance legale e relativo livello di completamento reale;
- stato `FASE 7.5` con annullamento show, refund Stripe, rimborso credito, email utenti, prefill email Checkout e badge ruolo navbar;
- provider social supportati;
- regole provider applicate: Google email verificata, Microsoft personale/work-school con issuer, tenant e subject validati;
- stato verifica SMTP/provider reali;
- link ai tutorial rilevanti, incluso tutorial GDPR completo e quick reference;
- eventuali limiti residui.

`changelog.md` deve indicare:

- model/migration aggiunti;
- endpoint auth/social/password/GDPR aggiunti;
- `FASE 6.1`: profilo dashboard/accordion, cinema preferito e UX account;
- `FASE 7.1`: export, cancellazione, anonimizzazione e toggle account;
- `FASE 7.2`: `CinemaStaff`, assegnazioni per cinema, endpoint ruoli dinamici, scoping ticket/credito/show e fix runtime post-smoke;
- `FASE 7.3`: hardening route guard, bootstrap differito e decisione documentata sul template statico;
- `FASE 7.4`: pagine legali, acceptance/versionamento, geolocalizzazione opt-in, notice leggero e tutorial GDPR, se effettivamente implementati;
- `FASE 7.5`: annullamento show, `ShowCancellation`, `OrdineRefund`, refund Stripe, rimborso credito, email cancellation, prefill email Stripe Checkout e badge ruolo navbar, se effettivamente implementati;
- hardening sessioni/redirect/ruoli;
- test automatici aggiunti o estesi;
- verifiche manuali eseguite.

`backend/.env.example` deve indicare solo le variabili realmente usate dal codice finale:

- OIDC Google/Microsoft;
- SMTP/account email;
- token TTL GDPR/account deletion;
- eventuali variabili per versionamento documenti legali, flag DPO o riferimenti pubblici, solo se introdotte davvero in `FASE 7.4`.
- eventuali variabili o note operative relative a refund/email cancellation solo se introdotte davvero in `FASE 7.5`.

I tutorial devono essere riallineati così:

- `TUTORIAL_SOCIAL_LOGIN_GOOGLE_MICROSOFT.md`: configurazione finale, fix runtime reali, limiti residui e note operative coerenti con il codice;
- `TUTORIAL_GDPR_COMPLIANCE_CINEBASE.md`: stato reale della compliance web, ruoli privacy, gap chiusi e gap ancora aperti;
- `TUTORIAL_GDPR_COMPLIANCE_CINEBASE_QUICK_REFERENCE.md`: checklist sintetica coerente con le pagine legali, `localStorage`, risorse esterne e acceptance/versionamento effettivamente adottati.

Questo piano deve essere aggiornato:

- tabella `Stato Avanzamento Fasi`;
- checklist delle fasi;
- scostamenti tecnici reali;
- risultati finali test e smoke;
- decisioni architetturali confermate dai fix runtime (`GET /admin/utenti/roles`, scoping `CinemaStaff`, route guard no-flicker, modello intermedio `FASE 7.4`);
- decisioni architetturali confermate dalla `FASE 7.5` su annullamento show distinto da delete fisico, refund stesso metodo, idempotenza Stripe/credito ed esclusione `CinemaStaff` dai rimborsi;
- eventuali limitazioni o verifiche non eseguite dichiarate in modo esplicito.

**Checklist fase**:

- [ ] `status.md` aggiornato
- [ ] `changelog.md` aggiornato
- [ ] `.env.example` aggiornato
- [ ] Tutorial social login Google/Microsoft aggiornato
- [ ] Tutorial GDPR completo aggiornato/allineato
- [ ] Quick reference GDPR aggiornata/allineata
- [ ] Piano Iterazione 5 aggiornato con esiti reali
- [ ] Pagine legali pubbliche e documentazione di progetto coerenti, se `FASE 7.4` è stata implementata
- [ ] Termini/condizioni, stato progetto e changelog coerenti con annullamento show/rimborsi, se `FASE 7.5` è stata implementata
- [ ] Eventuali limiti o test non eseguiti documentati

---

## 7) File e Aree Impattate

## 7.1 Backend `backend/FilmAPI/`

File da modificare:

- `Model/User.cs`
- `Model/RefreshToken.cs` se serve correlare meglio sessioni/device
- `Data/FilmDbContext.cs`
- `Services/AuthService.cs`
- `Services/IAuthService.cs`
- `Services/UserAdminService.cs`
- `Services/IUserAdminService.cs`
- `Services/ValidazioneBigliettoService.cs`
- `Services/CreditoService.cs`
- `Services/ShowService.cs`
- `Endpoints/AuthEndpoints.cs`
- `Endpoints/AdminUtentiEndpoints.cs`
- `Endpoints/ValidazioneBigliettiEndpoints.cs`
- `Endpoints/CreditoEndpoints.cs`
- `Endpoints/ShowsEndpoints.cs`
- `DTO/AuthDTO.cs`
- `DTO/UserAdminDTO.cs`
- `DTO/BigliettoDTO.cs`
- `DTO/CreditoDTO.cs`
- `DTO/ShowDTO.cs`
- `Program.cs`
- `FilmAPI.csproj`
- `Data/DataSeeder.cs`
- `Migrations/FilmDbContextModelSnapshot.cs`

Nuovi file probabili:

- `Model/ExternalLoginProvider.cs`
- `Model/UserExternalLogin.cs`
- `Model/AccountActionToken.cs`
- `Model/AccountActionTokenPurpose.cs`
- `Model/ExternalAuthState.cs`
- `Model/ExternalAuthExchangeCode.cs`
- `Model/UserSecurityAuditLog.cs`
- `Model/UserCinemaAssignment.cs`
- `DTO/AuthCredentialsDTO.cs` o estensione `AuthDTO.cs`
- `DTO/ExternalAuthDTO.cs`
- `DTO/AdminUserDTO.cs` se si separano i DTO admin estesi
- `DTO/CinemaStaffDTO.cs` se si separano i DTO staff/assegnazioni
- `Services/IAccountTokenService.cs`
- `Services/AccountTokenService.cs`
- `Services/IAccountEmailService.cs`
- `Services/AccountEmailService.cs`
- `Services/IExternalAuthService.cs`
- `Services/ExternalAuthService.cs`
- `Services/IExternalAuthProvider.cs`
- `Services/GoogleExternalAuthProvider.cs`
- `Services/MicrosoftExternalAuthProvider.cs`
- `Services/IUserSecurityAuditService.cs`
- `Services/UserSecurityAuditService.cs`
- `Services/RedirectUrlValidator.cs`
- `Services/IAccountDeletionService.cs`
- `Services/AccountDeletionService.cs`
- `Services/ICinemaAccessService.cs`
- `Services/CinemaAccessService.cs`
- `DTO/UserDataExportDTO.cs`

## 7.2 Frontend `frontend/CineBase.Web/wwwroot/`

File da modificare:

- `login.html`
- `registrazione.html`
- `profilo.html`
- `js/auth.js`
- `js/api.js`
- `js/route-guard.js`
- `js/admin-shell.js`
- `js/pages/login.js`
- `js/pages/registrazione.js`
- `js/pages/profilo.js`
- `shows.html`
- `ricarica-credito.html`
- `validazione-biglietti.html`
- `js/pages/shows.js`
- `js/pages/ricarica-credito.js`
- `js/pages/validazione-biglietti.js`
- `css/styles.css` solo se necessario

Nuovi file:

- `recupera-password.html`
- `reimposta-password.html`
- `social-login-complete.html`
- `conferma-cancellazione.html`
- `utenti.html`
- `js/pages/recupera-password.js`
- `js/pages/reimposta-password.js`
- `js/pages/social-login-complete.js`
- `js/pages/conferma-cancellazione.js`
- `js/pages/utenti.js`

## 7.3 Test

File da modificare:

- `tests/backend/Integration/AuthIntegrationTests.cs`
- `tests/backend/Integration/RbacIntegrationTests.cs`
- `tests/backend/Integration/CustomWebApplicationFactory.cs`

Nuovi file:

- `tests/backend/Integration/PasswordCredentialsIntegrationTests.cs`
- `tests/backend/Integration/ExternalAuthIntegrationTests.cs`
- `tests/backend/Integration/AdminUserSecurityIntegrationTests.cs`
- `tests/backend/Integration/AccountDeletionIntegrationTests.cs`
- `tests/backend/Integration/CinemaStaffAuthorizationIntegrationTests.cs`

## 7.4 Configurazione e documentazione

- `backend/.env.example`
- `docs/project/status.md`
- `docs/project/changelog.md`
- `docs/tutorials/TUTORIAL_SOCIAL_LOGIN_GOOGLE_MICROSOFT.md`

---

## 8) Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
| --- | --- | --- | --- |
| Social login assegna o conserva privilegi operativi/elevati | Media senza vincoli | Critico | Social login solo `User`; rifiuto runtime per `CinemaStaff`/`PowerUser`/`Admin`; test dedicati |
| Email/domain spoofing provider | Media | Alto | Validare ID token provider; per Google richiedere `email_verified`, per Microsoft validare firma, issuer, tenant e subject stabile senza fidarsi del dominio email |
| Account takeover tramite linking email non verificata | Media | Alto | Collegare solo dopo validazione provider-specifica; Google richiede email verificata; Microsoft richiede identità stabile e linking auditato, con eventuale conferma email se si decide di rafforzare il flusso |
| Open redirect su login o social callback | Media | Alto | Helper unico per redirect relativi; test automatici e manuali con URL esterni |
| Token reset salvati in chiaro | Bassa se progettato bene | Critico | Salvare solo hash; non loggare token; test su DB |
| Enumerazione utenti da forgot password | Alta se non curata | Medio/Alto | Risposta sempre generica; rate limiting; audit |
| Vecchio JWT resta admin dopo downgrade | Alta con JWT stateless attuale | Alto | `AuthVersion`/`SecurityStamp` validato e refresh token revocati |
| Promozione social-only a ruolo operativo/elevato | Media | Alto | Blocco backend + UI; setup password obbligatorio prima della promozione |
| Password locale mancante rompe login esistente | Media | Alto | Migrazione con default per utenti esistenti; test regressione login |
| Microsoft claim email non uniforme | Media | Medio | Usare `email`/`preferred_username` solo come indirizzo applicativo, non come identificatore stabile; identificare il provider con `tid + oid/sub`; documentare claim supportati; test fake |
| Google aperto a domini generici crea utenti esterni | Media | Medio | Consentito dal requisito: assegnare sempre e solo ruolo `User`, nessuna elevazione senza password locale e audit su provider |
| Microsoft aperto ad account personali e work/school crea utenti esterni | Media | Medio | Consentito dal requisito: assegnare sempre e solo ruolo `User`, nessuna elevazione senza password locale, audit provider e gestione chiara di tenant policy/consenso negato |
| `CinemaStaff` aggira lo scope manipolando `CinemaId` nel client | Alta se controllato solo da UI | Alto | Enforcement backend centralizzato in `ICinemaAccessService`; test per validazione, credito e show cross-cinema |
| Lookup biglietto espone dati di altri cinema | Media | Alto | Richiedere/verificare `cinemaId` nel lookup e non restituire dettagli se staff non autorizzato |
| Ricarica credito troppo permissiva per staff | Media | Alto | `CinemaId` obbligatorio per staff, storico filtrato, ricerca utenti non globale, audit e test sui movimenti |
| Rinumero enum `UserRole` rompe utenti persistiti | Media | Critico | Non rinumerare `User=0`, `PowerUser=1`, `Admin=2`; aggiungere `CinemaStaff` con valore nuovo e policy esplicite |
| Assegnazioni staff cambiate ma sessioni vecchie restano operative | Media | Alto | Incrementare `AuthVersion`, revocare refresh token, controllare DB/cache server-side su ogni operazione scoped |
| Provider reali non configurabili in locale | Alta | Medio | Test automatici con provider fake; smoke reale opzionale ma documentato |
| Email SMTP non configurata | Media | Medio | Fake test automatico; messaggi chiari; verifica reale opzionale; `.env.example` aggiornato |
| Aumento complessità auth | Alta | Medio | Fasi piccole, servizi separati, test mirati, nessun cambio cookie/token storage globale |

---

## 9) Piano Test Dettagliato

## 9.1 Test automatici backend obbligatori

| Area | Copertura minima |
| --- | --- |
| Login locale regressione | register/login/refresh/logout/me esistenti ancora verdi |
| Password change | success, password attuale errata, social-only senza password, revoca sessioni |
| Forgot/reset | no enumeration, token valido, token riuso, token scaduto, email fake, hash token |
| Setup password | account social-only imposta password e diventa promuovibile |
| Google social | email verificata su `gmail.com`, su dominio esterno tipo `outlook.com`, su `issgreppi.it`, email non verificata rifiutata, linking, ruolo User |
| Microsoft social | account personale valido, account work/school `issgreppi.it`, account work/school altro tenant, issuer/tenant incoerente rifiutato, subject mancante rifiutato, email-like assente rifiutata per autocreazione/linking, consenso negato gestito |
| Social security | CinemaStaff/PowerUser/Admin rifiutati, exchange code one-time, state replay bloccato |
| Admin invite | create CinemaStaff/Admin/Power, duplicate email, non-admin forbidden, invito completato |
| Role management | promozione User locale, blocco social-only, blocco ultimo admin, revoca token |
| CinemaStaff scoped | invito/promozione staff, assegnazioni cinema, revoca sessioni su cambio assegnazioni, validazione ticket scoped, ricarica credito scoped, show scoped, blocco catalogo/sale/utenti, PowerUser/Admin globali invariati |
| Audit | eventi sensibili creati con actor/user corretti |
| Account deletion | export dati, richiesta/conferma cancellazione, token scaduto/riusato, anonimizzazione preserva transazioni, blocco login post-anonimizzazione, admin delete, admin non può cancellare ultimo admin, toggle IsDisabled, RBAC endpoint admin |
| Redirect | redirect esterni rifiutati in login/social flow |

## 9.2 Test automatici frontend

Il repository non risulta avere un test runner frontend dedicato. In questa iterazione non è obbligatorio introdurre Playwright o Vitest solo per i nuovi flussi, salvo decisione esplicita.

Verifiche automatiche realistiche:

- build `frontend/CineBase.Web`;
- eventuale smoke HTTP statico se già usato nel progetto;
- test backend sugli endpoint che alimentano le pagine.

Se si decide di introdurre Playwright, limitarsi a smoke essenziali:

- login page render;
- forgot password form submit;
- reset password form con token fake intercettato;
- route guard `utenti.html` per ruoli.

## 9.3 Verifica manuale obbligatoria

- User locale: login, cambio password, forgot/reset.
- User social: login Google/Microsoft, profilo, checkout base non regressivo.
- CinemaStaff: login locale, accesso solo a dashboard operativa/show/ricarica/validazione, cinema filtrati per assegnazione, blocco pagine globali e utenti.
- PowerUser: login locale, accesso dashboard operativa, social login rifiutato.
- Admin: login locale, accesso `utenti.html`, invito/promozione/degradazione controllata.
- Anonimo: pagine pubbliche e auth forms.
- Redirect malevoli: nessuna uscita verso domini esterni.

---

## 10) Stima Effort

| Attività | Tempo stimato |
| --- | --- |
| Preflight e mappa auth | 30-45 min |
| Modello dati + migration | 60-120 min |
| Token/email account | 60-120 min |
| Cambio/reset password backend | 90-150 min |
| Social login backend Google/Microsoft | 180-300 min |
| Admin utenti backend | 90-180 min |
| GDPR: cancellazione, portabilità, anonimizzazione | 480-720 min (1-1.5 giornate) |
| CinemaStaff backend: modello, policy, assegnazioni e enforcement cinema | 300-480 min |
| Frontend auth/reset/profilo | 120-210 min |
| Frontend admin utenti | 120-210 min |
| Frontend GDPR (profilo privacy, conferma cancellazione, admin azioni) | 120-180 min |
| Frontend CinemaStaff (route guard, sidebar, pagine operative filtrate, assegnazioni utenti) | 240-360 min |
| Test automatici backend | 180-300 min |
| Smoke/manual verification | 60-120 min |
| Documentazione finale | 30-60 min |
| **Totale realistico** | **4-7 giornate tecniche**, dipendente dalla disponibilità credenziali Google/Microsoft reali e dalla profondità della UI staff |

---

## 11) Criteri di Accettazione Definitivi

L'Iterazione 5 può essere marcata completata solo se:

1. La registrazione pubblica locale crea sempre `User`.
2. Social login Google crea o collega solo utenti `User` quando Google restituisce un ID token valido con `email_verified = true`, senza alcun vincolo sul dominio email.
3. Social login Microsoft crea o collega solo utenti `User` con account personali Microsoft o account work/school quando il token OIDC è valido, issuer/tenant/subject sono coerenti e l'indirizzo email-like richiesto dal modello applicativo è disponibile.
4. Social login Microsoft con token non valido, issuer/tenant incoerente, subject assente, email-like assente per autocreazione/linking, consenso negato o policy tenant bloccante viene rifiutato con errore gestibile.
5. Social login per account `CinemaStaff` viene rifiutato.
6. Social login per account `PowerUser` viene rifiutato.
7. Social login per account `Admin` viene rifiutato.
8. `CinemaStaff`, `PowerUser` e `Admin` possono accedere con credenziali locali.
9. Gli utenti con password locale possono cambiare password.
10. Cambio password invalida refresh token e token applicativi precedenti secondo `AuthVersion`/`SecurityStamp`.
11. Forgot password risponde in modo non enumerativo.
12. Reset password usa token temporaneo hashato e single-use.
13. Reset password revoca sessioni esistenti.
14. Account social-only può impostare password locale tramite link email.
15. Admin può creare invito `CinemaStaff` senza password in chiaro e con assegnazioni cinema/capability.
16. Admin può creare invito `PowerUser` senza password in chiaro.
17. Admin può creare invito `Admin` senza password in chiaro.
18. Admin può promuovere un `User` locale a `CinemaStaff`, `PowerUser` o `Admin`.
19. Admin non può promuovere un account social-only finché non ha password locale.
20. Un account `CinemaStaff` deve avere sempre almeno una assegnazione cinema attiva valida; invito, promozione e update assegnazioni che violano questa regola vengono rifiutati.
21. Ultimo admin non può essere degradato.
22. Cambio ruolo revoca refresh token e invalida JWT precedenti.
23. Cambio assegnazioni `CinemaStaff` revoca refresh token e invalida JWT precedenti.
24. Tutte le operazioni sensibili producono audit log.
25. `utenti.html` è accessibile solo ad `Admin`.
26. `PowerUser` non vede o non può usare strumenti di gestione utenti.
27. `CinemaStaff` non vede o non può usare strumenti di gestione utenti, catalogo globale, sale/layout, cinema CRUD e media.
28. `CinemaStaff` può validare biglietti solo per cinema assegnati con `CanValidateTickets`.
29. `CinemaStaff` può ricaricare credito solo per cinema assegnati con `CanTopUpCredit` e con `CinemaId` tracciato.
30. `CinemaStaff` può gestire show solo per cinema assegnati con `CanManageShows`.
31. Il backend blocca manipolazioni manuali di `CinemaId` per validazione, credito e show.
32. `PowerUser` e `Admin` mantengono accesso operativo globale.
33. Tutti i redirect auth/social/reset sono limitati a path interni.
34. Build backend verde.
35. Build frontend verde.
36. Build seeder verde.
37. Suite backend completa verde.
38. `backend/.env.example` documenta tutte le variabili nuove.
39. `status.md` e `changelog.md` sono aggiornati.
40. Eventuali test provider reali non eseguiti sono dichiarati esplicitamente con motivo.
41. Utente autenticato può esportare tutti i suoi dati personali in formato JSON strutturato.
42. Utente può richiedere la cancellazione del proprio account con doppia conferma via email; la cancellazione anonimizza i dati personali ma conserva ordini/biglietti/movimenti credito per obblighi fiscali.
43. Admin può cancellare/anomizzare account utente; non può cancellare l'ultimo admin né lasciare il sistema senza admin.
44. Admin può disabilitare e riabilitare account; non può disabilitare l'ultimo admin.
45. Account anonimizzati non possono effettuare login né social login.
46. Ogni operazione GDPR (export, cancellazione, disable/enable) produce audit log.
47. Account `CinemaStaff` disabilitati o anonimizzati non conservano assegnazioni operative attive.

---

## 12) Prompt Operativo Consigliato

```text
Implementa l'Iterazione 5 descritta in `docs/project/dev_iteration/5/PianoDiLavoro.md`.

Obiettivo: aggiungere gestione credenziali completa, recupero password via email, social login Google aperto agli account Google verificati, social login Microsoft aperto agli account personali Microsoft e agli account work/school, strumenti Admin per creare o promuovere CinemaStaff/PowerUser/Admin in modo sicuro, e autorizzazione operativa CinemaStaff scoped per cinema.

Segui rigorosamente le fasi:
1. preflight auth e mappa superfici di sicurezza;
2. modello dati per password opzionale, provider esterni, token temporanei, state OAuth e audit;
3. infrastruttura token/email account;
4. cambio password e forgot/reset password backend;
5. social login backend Google/Microsoft con OIDC, Google senza vincolo dominio, Microsoft senza filtro dominio/tenant predefinito ma con validazione issuer/tenant/subject e blocco ruoli operativi/elevati;
6. gestione admin utenti con inviti e promozioni controllate;
7. frontend login/reset/profilo/social complete;
8. frontend `utenti.html` AdminOnly;
9. GDPR: cancellazione account, portabilità dati, anonimizzazione e toggle account;
10. CinemaStaff: ruolo operativo con assegnazioni obbligatorie per almeno un cinema, capability ValidateTickets/TopUpCredit/ManageShows, enforcement backend e UI admin;
11. test automatici backend estesi;
12. smoke test runtime e verifica manuale sicurezza;
13. documentazione finale.

Non consentire mai autoregistrazione come CinemaStaff/PowerUser/Admin. Non consentire social login per CinemaStaff/PowerUser/Admin. Un utente con ruolo CinemaStaff deve avere sempre almeno un cinema assegnato attivo e valido. Non salvare token temporanei in chiaro. Non lasciare redirect non validati. Non fidarti mai del CinemaId inviato dal frontend per autorizzare operazioni staff: validazione biglietti, ricarica credito e gestione show devono controllare le assegnazioni attive lato backend. Non rinumerare i valori esistenti di UserRole. Non considerare completata la fase finché build backend/frontend/seeder e suite backend non sono verdi, oppure finché ogni verifica non eseguita è dichiarata esplicitamente con motivazione.
```
