using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IMembershipService
{
    Task<MembershipCardDTO> GetOrCreateCardAsync(int userId);
    Task<MembershipCardDTO> AttivaAbbonamentoAsync(int userId, string metodoPagamento = "credito");
    Task<object> CreateStripeCheckoutMembershipAsync(int userId);
    Task<MembershipCardDTO> ConfermaStripeMembershipAsync(int userId, string sessionId);
    Task<List<MembershipCardDTO>> GetAllCardsAsync();
    Task<MembershipCardDTO> ToggleAttivazioneAsync(int userId);
    Task<List<PuntiMovimentoDTO>> GetPuntiStoricoAsync(int userId);
    Task<List<PremioDTO>> GetPremiDisponibiliAsync(int userId);
    Task<PremioRiscattoDTO> RiscattaPremioAsync(int userId, int premioId);
    Task<List<PremioRiscattoDTO>> GetMieiRiscattiAsync(int userId);
    Task AccumulaPuntiAcquistoAsync(int userId, decimal importoSpeso, int? ordineId = null);
    string GeneraCardNumber();
    TierMembership CalcolaTier(decimal puntiTotali);
}

public class MembershipService : IMembershipService
{
    private readonly FilmDbContext _db;
    private readonly IStripePaymentGateway _stripeGateway;

    public MembershipService(FilmDbContext db, IStripePaymentGateway stripeGateway)
    {
        _db = db;
        _stripeGateway = stripeGateway;
    }

    public string GeneraCardNumber()
    {
        var random = new Random();
        return $"C67-MEM-{random.Next(100000, 999999)}";
    }

    public TierMembership CalcolaTier(decimal puntiTotali)
    {
        if (puntiTotali >= 5000) return TierMembership.Platinum;
        if (puntiTotali >= 2000) return TierMembership.Gold;
        if (puntiTotali >= 500) return TierMembership.Silver;
        return TierMembership.Base;
    }

    private (decimal soglia, string nome) GetProssimoTier(TierMembership current)
    {
        return current switch
        {
            TierMembership.Base => (500, "Silver"),
            TierMembership.Silver => (2000, "Gold"),
            TierMembership.Gold => (5000, "Platinum"),
            _ => (0, "Massimo")
        };
    }

    public async Task<MembershipCardDTO> AttivaAbbonamentoAsync(int userId, string metodoPagamento = "credito")
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new ArgumentException("Utente non trovato.");

        if (metodoPagamento == "credito")
        {
            if (user.CreditoResiduo < 9.99m)
                throw new InvalidOperationException("Credito insufficiente. L'abbonamento costa €9,99/anno. Hai €" + user.CreditoResiduo.ToString("F2"));

            user.CreditoResiduo -= 9.99m;

            _db.MovimentiCredito.Add(new MovimentoCredito
            {
                UserId = userId,
                Tipo = MovimentoCreditoTipo.Adjustment,
                Importo = -9.99m,
                SaldoPre = user.CreditoResiduo + 9.99m,
                SaldoPost = user.CreditoResiduo,
                CreatedAtUtc = DateTime.UtcNow,
                Note = "Abbonamento Cinema67 Membership"
            });
        }

        await _db.SaveChangesAsync();
        return await AttivaAbbonamentoInternalAsync(userId);
    }

    public async Task<object> CreateStripeCheckoutMembershipAsync(int userId)
    {
        var card = await _db.MembershipCards.FirstOrDefaultAsync(c => c.UserId == userId);
        if (card != null && card.IsAttiva)
            throw new InvalidOperationException("Abbonamento già attivo.");

        var user = await _db.Users.FindAsync(userId)
            ?? throw new ArgumentException("Utente non trovato.");

        var importoCredito = Math.Min(user.CreditoResiduo, 9.99m);
        var importoCarta = 9.99m - importoCredito;

        var pending = new GiftCard
        {
            Codice = $"MEM-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            ValoreIniziale = 9.99m,
            SaldoResiduo = 9.99m,
            Stato = GiftCardStato.Disattivata,
            AcquirenteUserId = userId,
            DataAcquisto = DateTime.UtcNow,
            DataScadenza = DateTime.UtcNow.AddYears(1),
            CreatedAtUtc = DateTime.UtcNow,
            Note = $"MEMBERSHIP|CREDITO:{importoCredito}|CARTA:{importoCarta}"
        };
        _db.GiftCards.Add(pending);
        await _db.SaveChangesAsync();

        if (importoCarta <= 0)
        {
            _db.GiftCards.Remove(pending);
            await _db.SaveChangesAsync();
            return await AttivaAbbonamentoAsync(userId, "credito");
        }

        var stripeRequest = new StripeCreateCheckoutSessionRequest
        {
            Amount = importoCarta,
            Currency = "eur",
            SuccessUrl = $"http://localhost:5001/membership.html?stripe_membership={pending.Id}",
            CancelUrl = "http://localhost:5001/membership.html",
            OrderId = pending.Id,
            OrderCode = pending.Codice,
            UserId = userId,
            ShowId = 0
        };

        var session = await _stripeGateway.CreateCheckoutSessionAsync(stripeRequest, null);
        pending.Note += $"|SESSION:{session.Id}";
        await _db.SaveChangesAsync();

        return new { checkoutUrl = session.Url, importoCredito, importoCarta };
    }

    public async Task<MembershipCardDTO> ConfermaStripeMembershipAsync(int userId, string pendingId)
    {
        var pending = await _db.GiftCards.FindAsync(int.Parse(pendingId))
            ?? throw new ArgumentException("Sessione non trovata.");

        var noteParts = pending.Note?.Split('|') ?? Array.Empty<string>();
        var creditoStr = noteParts.FirstOrDefault(p => p.StartsWith("CREDITO:"))?.Replace("CREDITO:", "");
        var sessionId = noteParts.FirstOrDefault(p => p.StartsWith("SESSION:"))?.Replace("SESSION:", "");

        if (!string.IsNullOrEmpty(sessionId))
        {
            var session = await _stripeGateway.GetCheckoutSessionAsync(sessionId);
            if (session.Status != "complete")
                throw new InvalidOperationException("Pagamento non completato.");
        }

        var credito = decimal.TryParse(creditoStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var cr) ? cr : 0;

        _db.GiftCards.Remove(pending);
        await _db.SaveChangesAsync();

        if (credito > 0)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null)
            {
                user.CreditoResiduo -= credito;
                _db.MovimentiCredito.Add(new MovimentoCredito
                {
                    UserId = userId,
                    Tipo = MovimentoCreditoTipo.Adjustment,
                    Importo = -credito,
                    SaldoPre = user.CreditoResiduo + credito,
                    SaldoPost = user.CreditoResiduo,
                    CreatedAtUtc = DateTime.UtcNow,
                    Note = "Abbonamento Membership (parte credito)"
                });
            }
        }

        return await AttivaAbbonamentoInternalAsync(userId);
    }

    private async Task<MembershipCardDTO> AttivaAbbonamentoInternalAsync(int userId)
    {
        var card = await _db.MembershipCards.FirstOrDefaultAsync(c => c.UserId == userId);
        if (card == null)
        {
            card = new MembershipCard
            {
                UserId = userId,
                CardNumber = GeneraCardNumber(),
                Tier = TierMembership.Base,
                PuntiTotali = 0,
                PuntiDisponibili = 0,
                IsAttiva = true,
                DataIscrizione = DateTime.UtcNow,
                AttivataIl = DateTime.UtcNow,
                DataScadenzaAbbonamento = DateTime.UtcNow.AddYears(1),
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.MembershipCards.Add(card);
        }
        else
        {
            card.IsAttiva = true;
            card.AttivataIl = DateTime.UtcNow;
            card.DataScadenzaAbbonamento = (card.DataScadenzaAbbonamento > DateTime.UtcNow ? card.DataScadenzaAbbonamento : DateTime.UtcNow).Value.AddYears(1);
        }

        await _db.SaveChangesAsync();
        return await GetOrCreateCardAsync(userId);
    }

    public async Task<MembershipCardDTO> GetOrCreateCardAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new ArgumentException("Utente non trovato.");

        var card = await _db.MembershipCards.FirstOrDefaultAsync(c => c.UserId == userId);

        if (card == null)
        {
            card = new MembershipCard
            {
                UserId = userId,
                CardNumber = GeneraCardNumber(),
                Tier = TierMembership.Base,
                PuntiTotali = 0,
                PuntiDisponibili = 0,
                DataIscrizione = DateTime.UtcNow,
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.MembershipCards.Add(card);
            await _db.SaveChangesAsync();
        }

        var nuovoTier = CalcolaTier(card.PuntiTotali);
        if (nuovoTier != card.Tier)
        {
            card.Tier = nuovoTier;
            await _db.SaveChangesAsync();
        }

        var (soglia, nomeProssimo) = GetProssimoTier(card.Tier);
        var progresso = soglia > 0 ? (int)Math.Min(100, (card.PuntiTotali / soglia) * 100) : 100;

        return new MembershipCardDTO
        {
            Id = card.Id,
            UserId = userId,
            CardNumber = card.CardNumber,
            Tier = card.Tier.ToString(),
            Nome = user.Nome + " " + user.Cognome,
            Email = user.Email,
            PuntiTotali = card.PuntiTotali,
            PuntiDisponibili = card.PuntiDisponibili,
            PuntiPerProssimoTier = soglia > 0 ? soglia - card.PuntiTotali : 0,
            ProssimoTier = nomeProssimo,
            PercentualeProgresso = progresso,
            IsAttiva = card.IsAttiva,
            DataScadenzaAbbonamento = card.DataScadenzaAbbonamento,
            DataIscrizione = card.DataIscrizione,
            QrCodeData = card.CardNumber
        };
    }

    public async Task<List<PuntiMovimentoDTO>> GetPuntiStoricoAsync(int userId)
    {
        return await _db.PuntiMovimenti
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAtUtc)
            .Take(50)
            .Select(p => new PuntiMovimentoDTO
            {
                Id = p.Id,
                Tipo = p.Tipo.ToString(),
                Punti = p.Punti,
                SaldoPre = p.SaldoPre,
                SaldoPost = p.SaldoPost,
                RiferimentoTipo = p.RiferimentoTipo,
                Note = p.Note,
                CreatedAtUtc = p.CreatedAtUtc
            })
            .ToListAsync();
    }

    public async Task<List<PremioDTO>> GetPremiDisponibiliAsync(int userId = 0)
    {
        return await _db.Premi
            .Where(p => p.Attivo && (p.QuantitaDisponibile > 0 || p.QuantitaDisponibile == -1))
            .OrderBy(p => p.CostoPunti)
            .Select(p => new PremioDTO
            {
                Id = p.Id,
                Nome = p.Nome,
                Descrizione = p.Descrizione,
                CostoPunti = p.CostoPunti,
                Tipo = p.Tipo.ToString(),
                Valore = p.Valore,
                Attivo = p.Attivo,
                QuantitaDisponibile = p.QuantitaDisponibile,
                ImmaginePath = p.ImmaginePath
            })
            .ToListAsync();
    }

    public async Task<PremioRiscattoDTO> RiscattaPremioAsync(int userId, int premioId)
    {
        var premio = await _db.Premi.FindAsync(premioId)
            ?? throw new ArgumentException("Premio non trovato.");

        if (!premio.Attivo)
            throw new InvalidOperationException("Questo premio non è più disponibile.");

        if (premio.QuantitaDisponibile == 0)
            throw new InvalidOperationException("Premio esaurito.");

        var card = await _db.MembershipCards.FirstOrDefaultAsync(c => c.UserId == userId)
            ?? throw new InvalidOperationException("Tessera membership non trovata. Fai un primo acquisto per attivarla.");

        if (card.PuntiDisponibili < premio.CostoPunti)
            throw new InvalidOperationException($"Punti insufficienti. Hai {card.PuntiDisponibili} punti, ti servono {premio.CostoPunti}.");

        var codice = $"C67-R-{Guid.NewGuid().ToString()[..8].ToUpper()}";

        var saldoPre = card.PuntiDisponibili;
        card.PuntiDisponibili -= premio.CostoPunti;

        if (premio.QuantitaDisponibile > 0)
            premio.QuantitaDisponibile--;

        var riscatto = new PremioRiscatto
        {
            UserId = userId,
            PremioId = premioId,
            PuntiSpesi = premio.CostoPunti,
            Codice = codice,
            Stato = StatoRiscatto.Attivo,
            DataRiscatto = DateTime.UtcNow,
            DataScadenza = DateTime.UtcNow.AddMonths(6),
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.PremiRiscatti.Add(riscatto);

        _db.PuntiMovimenti.Add(new PuntiMovimento
        {
            UserId = userId,
            MembershipCardId = card.Id,
            Tipo = TipoPuntiMovimento.Riscatto,
            Punti = -premio.CostoPunti,
            SaldoPre = saldoPre,
            SaldoPost = card.PuntiDisponibili,
            RiferimentoId = premioId,
            RiferimentoTipo = "Premio",
            Note = $"Riscatto premio: {premio.Nome}",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return new PremioRiscattoDTO
        {
            Id = riscatto.Id,
            PremioNome = premio.Nome,
            PremioTipo = premio.Tipo.ToString(),
            PuntiSpesi = riscatto.PuntiSpesi,
            Codice = riscatto.Codice,
            Stato = riscatto.Stato.ToString(),
            Valore = premio.Valore,
            DataRiscatto = riscatto.DataRiscatto,
            DataScadenza = riscatto.DataScadenza
        };
    }

    public async Task<List<PremioRiscattoDTO>> GetMieiRiscattiAsync(int userId)
    {
        return await _db.PremiRiscatti
            .Include(r => r.Premio)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.DataRiscatto)
            .Select(r => new PremioRiscattoDTO
            {
                Id = r.Id,
                PremioNome = r.Premio!.Nome,
                PremioTipo = r.Premio.Tipo.ToString(),
                PuntiSpesi = r.PuntiSpesi,
                Codice = r.Codice,
                Stato = r.Stato.ToString(),
                Valore = r.Premio.Valore,
                DataRiscatto = r.DataRiscatto,
                DataScadenza = r.DataScadenza
            })
            .ToListAsync();
    }

    public async Task AccumulaPuntiAcquistoAsync(int userId, decimal importoSpeso, int? ordineId = null)
    {
        var card = await _db.MembershipCards.FirstOrDefaultAsync(c => c.UserId == userId);
        if (card == null || !card.IsAttiva) return;

        var moltiplicatore = card.Tier switch
        {
            TierMembership.Platinum => 2.0m,
            TierMembership.Gold => 1.5m,
            TierMembership.Silver => 1.2m,
            _ => 1.0m
        };

        var punti = Math.Floor(importoSpeso * moltiplicatore);
        if (punti <= 0) return;

        var saldoPre = card.PuntiDisponibili;
        card.PuntiTotali += punti;
        card.PuntiDisponibili += punti;

        _db.PuntiMovimenti.Add(new PuntiMovimento
        {
            UserId = userId,
            MembershipCardId = card.Id,
            Tipo = TipoPuntiMovimento.Acquisto,
            Punti = punti,
            SaldoPre = saldoPre,
            SaldoPost = card.PuntiDisponibili,
            RiferimentoId = ordineId,
            RiferimentoTipo = "Ordine",
            Note = $"Punti acquisto ×{moltiplicatore} (Tier {card.Tier})",
            CreatedAtUtc = DateTime.UtcNow
        });

        // Check tier upgrade
        var nuovoTier = CalcolaTier(card.PuntiTotali);
        if (nuovoTier != card.Tier)
        {
            card.Tier = nuovoTier;
            _db.PuntiMovimenti.Add(new PuntiMovimento
            {
                UserId = userId,
                MembershipCardId = card.Id,
                Tipo = TipoPuntiMovimento.Bonus,
                Punti = 0,
                SaldoPre = card.PuntiDisponibili,
                SaldoPost = card.PuntiDisponibili,
                Note = $"Congratulazioni! Sei passato al tier {nuovoTier}!",
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
    }

    public async Task<List<MembershipCardDTO>> GetAllCardsAsync()
    {
        return await _db.MembershipCards
            .Include(c => c.User)
            .OrderByDescending(c => c.IsAttiva)
            .ThenBy(c => c.Tier)
            .Select(c => new MembershipCardDTO
            {
                Id = c.Id,
                UserId = c.UserId,
                CardNumber = c.CardNumber,
                Tier = c.Tier.ToString(),
                Nome = c.User!.Nome + " " + c.User.Cognome,
                Email = c.User.Email,
                PuntiTotali = c.PuntiTotali,
                PuntiDisponibili = c.PuntiDisponibili,
                IsAttiva = c.IsAttiva,
                DataScadenzaAbbonamento = c.DataScadenzaAbbonamento,
                DataIscrizione = c.DataIscrizione
            })
            .ToListAsync();
    }

    public async Task<MembershipCardDTO> ToggleAttivazioneAsync(int userId)
    {
        var card = await _db.MembershipCards.FirstOrDefaultAsync(c => c.UserId == userId)
            ?? throw new ArgumentException("Tessera non trovata.");

        card.IsAttiva = !card.IsAttiva;
        if (card.IsAttiva)
        {
            card.AttivataIl = DateTime.UtcNow;
            card.DataScadenzaAbbonamento = DateTime.UtcNow.AddYears(1);
        }

        await _db.SaveChangesAsync();
        return await GetOrCreateCardAsync(userId);
    }
}
