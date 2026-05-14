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
    Task<object> CreatePayPalCheckoutMembershipAsync(int userId);
    Task<MembershipCardDTO> ConfermaStripeMembershipAsync(int userId, string sessionId);
    Task<List<MembershipCardDTO>> GetAllCardsAsync();
    Task<MembershipCardDTO> ToggleAttivazioneAsync(int userId);
    Task<MembershipCardDTO> UpdateProfileAsync(int userId, MembershipUpdateDTO dto);
    Task ProcessaCompleanniAsync(bool soloOggi = true);
    Task ProcessaFestivitaAsync(string nomeFesta, int percentualeSconto);
    Task ProcessaFestivitaAutomaticheAsync(bool forzato = false);
    Task<List<CampaignConfig>> GetCampaignsAsync();
    Task<CampaignConfig> UpdateCampaignAsync(int id, CampaignConfig dto);
    Task<CampaignConfig> AddCampaignAsync(CampaignConfig dto);
    Task DeleteCampaignAsync(int id);
    Task<List<MembershipCardDTO>> GetCompleanniOggiAsync();
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
    private readonly IPayPalGateway _paypalGateway;
    private readonly IEmailService _emailService;

    public MembershipService(FilmDbContext db, IStripePaymentGateway stripeGateway, IPayPalGateway paypalGateway, IEmailService emailService)
    {
        _db = db; _stripeGateway = stripeGateway; _paypalGateway = paypalGateway; _emailService = emailService;
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

    public async Task<object> CreatePayPalCheckoutMembershipAsync(int userId)
    {
        var card = await _db.MembershipCards.FirstOrDefaultAsync(c => c.UserId == userId);
        if (card != null && card.IsAttiva) throw new InvalidOperationException("Abbonamento gia attivo.");

        var paypal = await _paypalGateway.CreateOrderAsync(new PayPalCreateOrderRequest
        {
            Amount = 9.99m, Currency = "EUR",
            OrderCode = $"MEM-{userId}",
            ReturnUrl = $"http://localhost:5001/membership.html?paypal_membership=1",
            CancelUrl = "http://localhost:5001/membership.html"
        });

        var pending = new GiftCard
        {
            Codice = $"MEM-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            ValoreIniziale = 9.99m, SaldoResiduo = 9.99m,
            Stato = GiftCardStato.Disattivata,
            AcquirenteUserId = userId,
            DataAcquisto = DateTime.UtcNow,
            DataScadenza = DateTime.UtcNow.AddYears(1),
            CreatedAtUtc = DateTime.UtcNow,
            Note = $"MEMBERSHIP|PAYPAL:{paypal.Id}"
        };
        _db.GiftCards.Add(pending);
        await _db.SaveChangesAsync();

        return new { checkoutUrl = paypal.ApprovalUrl, importoCredito = 0m, importoCarta = 9.99m, paypalOrderId = paypal.Id };
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
            DataNascita = card.DataNascita,
            Via = card.Via,
            Citta = card.Citta,
            Cap = card.Cap,
            Provincia = card.Provincia,
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

    public async Task<MembershipCardDTO> UpdateProfileAsync(int userId, MembershipUpdateDTO dto)
    {
        var card = await _db.MembershipCards.FirstOrDefaultAsync(c => c.UserId == userId)
            ?? throw new ArgumentException("Tessera non trovata.");

        card.DataNascita = dto.DataNascita;
        card.Via = dto.Via;
        card.Citta = dto.Citta;
        card.Cap = dto.Cap;
        card.Provincia = dto.Provincia;

        await _db.SaveChangesAsync();
        return await GetOrCreateCardAsync(userId);
    }

    public async Task ProcessaCompleanniAsync(bool soloOggi = true)
    {
        var oggi = DateTime.UtcNow.Date;
        var query = _db.MembershipCards
            .Include(c => c.User)
            .Where(c => c.IsAttiva && c.DataNascita.HasValue);

        if (soloOggi)
            query = query.Where(c => c.DataNascita!.Value.Month == oggi.Month && c.DataNascita!.Value.Day == oggi.Day);

        var cards = await query.ToListAsync();

        foreach (var card in cards)
        {
            var email = card.User?.Email;
            if (string.IsNullOrEmpty(email)) continue;

            var codice = $"BUONCOM-{Guid.NewGuid().ToString()[..8].ToUpper()}";
            var html = $@"
<div style='max-width:520px;margin:0 auto;font-family:Arial,sans-serif;background:#14100c;color:#f0e8e0;border-radius:12px;overflow:hidden;border:1px solid #38302a;'>
  <div style='background:linear-gradient(135deg,#b91c1c,#7f1d1d);padding:32px 24px;text-align:center;'>
    <h1 style='color:#d4af37;margin:0;font-size:26px;'>🎂 CINEMA67</h1>
    <p style='color:#f0e8e0;margin:8px 0 0;font-size:14px;'>Buon Compleanno!</p>
  </div>
  <div style='padding:28px 24px;text-align:center;'>
    <p style='font-size:16px;margin:0 0 16px;'>Ciao {card.User!.Nome},<br>Cinema67 ti augura un felice compleanno!</p>
    <p style='font-size:14px;margin:0 0 16px;color:#a89888;'>Per festeggiare, ti regaliamo il <strong style='color:#d4af37;'>20% di sconto</strong> sul tuo prossimo acquisto.</p>
    <div style='background:#1c1713;border-radius:8px;padding:16px;margin:16px 0;border:1px dashed #d4af37;'>
      <p style='font-size:12px;color:#a89888;margin:0 0 6px;'>CODICE SCONTO</p>
      <p style='font-size:22px;font-weight:bold;color:#d4af37;margin:0;letter-spacing:3px;font-family:monospace;'>{codice}</p>
    </div>
    <p style='font-size:13px;color:#a89888;'>Valido per 7 giorni. Usalo al checkout.</p>
  </div>
</div>";
            try
            {
                await _emailService.SendHtmlEmailAsync(email, "🎂 Buon Compleanno da Cinema67!", html);
            }
            catch { }
        }
    }

    public async Task<List<CampaignConfig>> GetCampaignsAsync()
    {
        var configs = await _db.CampaignConfigs.ToListAsync();
        if (!configs.Any())
        {
            configs = new List<CampaignConfig>
            {
                new() { Tipo = "compleanno", Nome = "Compleanno", Attiva = true, PercentualeSconto = 20, CreatedAtUtc = DateTime.UtcNow },
                new() { Tipo = "festivita", Nome = "Natale", Attiva = false, PercentualeSconto = 15, Mese = 12, Giorno = 25, GiorniPrima = 3, MessaggioPersonalizzato = "Auguri di Buon Natale da Cinema67!", CreatedAtUtc = DateTime.UtcNow },
                new() { Tipo = "festivita", Nome = "Pasqua", Attiva = false, PercentualeSconto = 10, Mese = 4, Giorno = 20, GiorniPrima = 3, CreatedAtUtc = DateTime.UtcNow },
                new() { Tipo = "festivita", Nome = "Capodanno", Attiva = false, PercentualeSconto = 15, Mese = 1, Giorno = 1, GiorniPrima = 3, CreatedAtUtc = DateTime.UtcNow },
                new() { Tipo = "festivita", Nome = "Ferragosto", Attiva = false, PercentualeSconto = 10, Mese = 8, Giorno = 15, GiorniPrima = 3, CreatedAtUtc = DateTime.UtcNow },
                new() { Tipo = "festivita", Nome = "Halloween", Attiva = false, PercentualeSconto = 10, Mese = 10, Giorno = 31, GiorniPrima = 2, CreatedAtUtc = DateTime.UtcNow },
                new() { Tipo = "festivita", Nome = "San Valentino", Attiva = false, PercentualeSconto = 15, Mese = 2, Giorno = 14, GiorniPrima = 3, CreatedAtUtc = DateTime.UtcNow }
            };
            _db.CampaignConfigs.AddRange(configs);
            await _db.SaveChangesAsync();
        }
        else
        {
            // Update existing campaigns missing date fields
            var defaults = new Dictionary<string, (int mese, int giorno)>
            {
                ["Natale"] = (12, 25),
                ["Pasqua"] = (4, 20),
                ["Capodanno"] = (1, 1),
                ["Ferragosto"] = (8, 15),
                ["Halloween"] = (10, 31),
                ["San Valentino"] = (2, 14)
            };
            foreach (var c in configs.Where(c => c.Tipo == "festivita" && !c.Mese.HasValue))
            {
                if (defaults.TryGetValue(c.Nome, out var d))
                {
                    c.Mese = d.mese;
                    c.Giorno = d.giorno;
                    c.GiorniPrima = 3;
                }
            }
            await _db.SaveChangesAsync();
        }
        return configs.OrderBy(c => c.Tipo).ThenBy(c => c.Nome).ToList();
    }

    public async Task<CampaignConfig> UpdateCampaignAsync(int id, CampaignConfig dto)
    {
        var config = await _db.CampaignConfigs.FindAsync(id)
            ?? throw new ArgumentException("Campagna non trovata.");

        config.Nome = dto.Nome;
        config.Attiva = dto.Attiva;
        config.PercentualeSconto = dto.PercentualeSconto;
        config.MessaggioPersonalizzato = dto.MessaggioPersonalizzato;

        await _db.SaveChangesAsync();
        return config;
    }

    public async Task<CampaignConfig> AddCampaignAsync(CampaignConfig dto)
    {
        var config = new CampaignConfig
        {
            Tipo = dto.Tipo,
            Nome = dto.Nome,
            Attiva = dto.Attiva,
            PercentualeSconto = dto.PercentualeSconto,
            MessaggioPersonalizzato = dto.MessaggioPersonalizzato,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.CampaignConfigs.Add(config);
        await _db.SaveChangesAsync();
        return config;
    }

    public async Task DeleteCampaignAsync(int id)
    {
        var config = await _db.CampaignConfigs.FindAsync(id);
        if (config != null)
        {
            _db.CampaignConfigs.Remove(config);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<List<MembershipCardDTO>> GetCompleanniOggiAsync()
    {
        var oggi = DateTime.UtcNow.Date;
        return await _db.MembershipCards
            .Include(c => c.User)
            .Where(c => c.IsAttiva && c.DataNascita.HasValue
                && c.DataNascita.Value.Month == oggi.Month
                && c.DataNascita.Value.Day == oggi.Day)
            .Select(c => new MembershipCardDTO
            {
                UserId = c.UserId,
                CardNumber = c.CardNumber,
                Nome = c.User!.Nome + " " + c.User.Cognome,
                Email = c.User.Email,
                Tier = c.Tier.ToString(),
                DataNascita = c.DataNascita
            })
            .ToListAsync();
    }

    public async Task ProcessaFestivitaAsync(string nomeFesta, int percentualeSconto)
    {
        var cards = await _db.MembershipCards.Include(c => c.User).Where(c => c.IsAttiva).ToListAsync();
        if (!cards.Any()) return;

        foreach (var card in cards)
        {
            var email = card.User?.Email;
            if (string.IsNullOrEmpty(email)) continue;
            var codice = $"{nomeFesta.ToUpper().Replace(" ", "")}-{Guid.NewGuid().ToString()[..6].ToUpper()}";
            var html = $"<h1 style='color:#d4af37'>Cinema67</h1><p>Ciao {card.User!.Nome}, auguri di {nomeFesta}! Sconto del {percentualeSconto}%: <strong>{codice}</strong></p>";
            try { await _emailService.SendHtmlEmailAsync(email, $"Auguri di {nomeFesta}!", html); } catch { }
        }
    }

    public async Task ProcessaFestivitaAutomaticheAsync(bool forzato = false)
    {
        var oggi = DateTime.UtcNow.Date;
        var configs = await _db.CampaignConfigs
            .Where(c => c.Attiva && c.Tipo == "festivita" && c.Mese.HasValue && c.Giorno.HasValue)
            .ToListAsync();

        foreach (var config in configs)
        {
            var dataFesta = new DateTime(oggi.Year, config.Mese!.Value, config.Giorno!.Value);
            var giorniMancanti = (dataFesta - oggi).Days;

            if (forzato || giorniMancanti == config.GiorniPrima)
            {
                await ProcessaFestivitaAsync(config.Nome, config.PercentualeSconto);
                config.UltimaEsecuzione = DateTime.UtcNow;
            }
        }
        await _db.SaveChangesAsync();
    }
}
