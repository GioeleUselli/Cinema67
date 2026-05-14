# Cinema67 — Piattaforma di gestione cinema

## Credenziali di accesso

| Ruolo | Email | Password |
|-------|-------|----------|
| **Admin** | `admin@cinebase.it` | `Admin123!` |
| **CinemaStaff** | `cinema67staff@cinema67.it` | `Staff123!` |

## Ruoli utente

| Ruolo | Valore | Descrizione | Area |
|-------|--------|-------------|------|
| **User** | 0 | Utente normale. Può acquistare biglietti, shop, feste, membership. | Landing page pubblica |
| **PowerUser** | 1 | Operatore globale. Gestisce film, registi, sale, proiezioni, ricariche, validazione, supporto, promozioni, feste, rimborsi, food, merch. | Area Admin (sidebar completa) |
| **Admin** | 2 | Amministratore globale. Tutti i permessi PowerUser + gestione utenti, cinema, membership, newsletter, campagne, analytics, pacchi. | Area Admin (sidebar completa) |
| **CinemaStaff** | 3 | Personale operativo di cinema. Dashboard, ricarica credito, validazione biglietti, support tickets, promozioni, gestione feste, rimborsi, food & beverage, merch shop. | Area Staff (9 pagine) |
| **Corriere** | 4 | Corriere per consegne merch. Visualizza pacchi pronti, prende in carico, segna in consegna/consegnato. | Pagina Corriere |
| **Magazziniere** | 5 | Magazziniere. Gestisce preparazione pacchi e inventario. | Pagina Magazzino |

## Avvio

```bash
# Backend (porta 5000)
cd backend/FilmAPI
dotnet run

# Frontend (porta 5001)
cd frontend/CineBase.Web
dotnet run
```

## Stack

- **Backend**: ASP.NET Core 9 Minimal API + Entity Framework Core + MySQL
- **Frontend**: HTML/CSS/JavaScript + Tailwind CSS
- **Pagamenti**: Stripe + PayPal
- **Auth**: JWT + Refresh Token
