using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IGiftCardService
{
    Task<List<GiftCardDTO>> GetMieGiftCardAsync(int userId);
    Task<List<GiftCardDTO>> GetAllGiftCardAsync();
    Task<GiftCardAcquistoResultDTO> AcquistaConCreditoAsync(int userId, GiftCardAcquistoRequestDTO dto);
    Task<GiftCardAcquistoResultDTO> AcquistaConCartaAsync(int userId, GiftCardAcquistoRequestDTO dto, bool usaCredito = true);
    Task<object> CreateStripeCheckoutAsync(int userId, GiftCardAcquistoRequestDTO dto);
    Task<GiftCardAcquistoResultDTO> ConfermaStripeAsync(int userId, string sessionId);
    Task<object> CreateStripeCheckoutCartAsync(int userId, GiftCardCartAcquistoRequestDTO dto);
    Task<GiftCardAcquistoResultDTO> ConfermaStripeCartAsync(int userId, string sessionId);
    Task<GiftCardRiscattoResultDTO> RiscattaAsync(int userId, GiftCardRiscattoRequestDTO dto);
    Task<GiftCard> CreateGiftCardAsync(int? acquirenteUserId, decimal importo, string? destinatarioEmail, string? messaggio, DateTime? dataInvio, int? ordineId = null);
    Task<GiftCardDTO?> GetByCodiceAsync(string codice);
    Task<bool> DisattivaAsync(int giftCardId);
    Task InviaGiftCardEmailAsync(int giftCardId);
    Task InviaEmailProgrammateAsync();
    string GeneraCodice();
}

public class GiftCardService : IGiftCardService
{
    private readonly FilmDbContext _db;
    private readonly IEmailService _emailService;
    private readonly IStripePaymentGateway _stripeGateway;

    public GiftCardService(FilmDbContext db, IEmailService emailService, IStripePaymentGateway stripeGateway)
    {
        _db = db;
        _emailService = emailService;
        _stripeGateway = stripeGateway;
    }

    public string GeneraCodice()
    {
        var random = new Random();
        var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var part1 = new string(Enumerable.Range(0, 4).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        var part2 = new string(Enumerable.Range(0, 4).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        return $"C67-{part1}-{part2}";
    }

    public async Task<GiftCard> CreateGiftCardAsync(int? acquirenteUserId, decimal importo, string? destinatarioEmail, string? messaggio, DateTime? dataInvio, int? ordineId = null)
    {
        string codice;
        do { codice = GeneraCodice(); }
        while (await _db.GiftCards.AnyAsync(g => g.Codice == codice));

        var giftCard = new GiftCard
        {
            Codice = codice,
            ValoreIniziale = importo,
            SaldoResiduo = importo,
            Stato = GiftCardStato.Attiva,
            AcquirenteUserId = acquirenteUserId,
            OrdineId = ordineId,
            DestinatarioEmail = destinatarioEmail,
            Messaggio = messaggio,
            DataInvioProgrammato = dataInvio,
            DataAcquisto = DateTime.UtcNow,
            DataScadenza = DateTime.UtcNow.AddMonths(12),
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.GiftCards.Add(giftCard);
        await _db.SaveChangesAsync();
        return giftCard;
    }

    public async Task<GiftCardAcquistoResultDTO> AcquistaConCreditoAsync(int userId, GiftCardAcquistoRequestDTO dto)
    {
        if (dto.Importo <= 0 || dto.Quantita <= 0 || dto.Quantita > 10)
            throw new ArgumentException("Importo o quantità non validi. Max 10 gift card per ordine.");

        if (dto.Importo < 5 || dto.Importo > 500)
            throw new ArgumentException("L'importo deve essere tra €5 e €500.");

        var totale = dto.Importo * dto.Quantita;

        var user = await _db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Utente non trovato.");

        if (user.CreditoResiduo < totale)
            throw new InvalidOperationException($"Credito insufficiente. Hai €{user.CreditoResiduo:F2}, ti servono €{totale:F2}.");

        user.CreditoResiduo -= totale;

        _db.MovimentiCredito.Add(new MovimentoCredito
        {
            UserId = userId,
            Tipo = MovimentoCreditoTipo.GiftCardPurchase,
            Importo = -totale,
            SaldoPre = user.CreditoResiduo + totale,
            SaldoPost = user.CreditoResiduo,
            CreatedAtUtc = DateTime.UtcNow,
            Note = $"Acquisto {dto.Quantita} gift card da €{dto.Importo:F2}"
        });

        var cards = new List<GiftCardDTO>();
        for (int i = 0; i < dto.Quantita; i++)
        {
            var gc = await CreateGiftCardAsync(userId, dto.Importo, dto.DestinatarioEmail, dto.Messaggio, dto.DataInvioProgrammato);
            cards.Add(MapDTO(gc));

            // Se non è programmata per dopo, invia subito
            if (dto.DataInvioProgrammato == null || dto.DataInvioProgrammato <= DateTime.UtcNow.AddMinutes(1))
            {
                await InviaGiftCardEmailAsync(gc.Id);
            }
        }

        await _db.SaveChangesAsync();

        return new GiftCardAcquistoResultDTO
        {
            GiftCards = cards,
            TotaleSpeso = totale,
            NuovoSaldoCredito = user.CreditoResiduo
        };
    }

    public async Task<GiftCardAcquistoResultDTO> AcquistaConCartaAsync(int userId, GiftCardAcquistoRequestDTO dto, bool usaCredito = true)
    {
        if (dto.Importo <= 0 || dto.Quantita <= 0 || dto.Quantita > 10)
            throw new ArgumentException("Importo o quantità non validi. Max 10 gift card per ordine.");

        if (dto.Importo < 5 || dto.Importo > 500)
            throw new ArgumentException("L'importo deve essere tra €5 e €500.");

        var totale = dto.Importo * dto.Quantita;

        var user = await _db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Utente non trovato.");

        var importoCredito = usaCredito ? Math.Min(user.CreditoResiduo, totale) : 0;

        if (importoCredito > 0)
            user.CreditoResiduo -= importoCredito;

        var cards = new List<GiftCardDTO>();
        for (int i = 0; i < dto.Quantita; i++)
        {
            var gc = await CreateGiftCardAsync(userId, dto.Importo, dto.DestinatarioEmail, dto.Messaggio, dto.DataInvioProgrammato);
            cards.Add(MapDTO(gc));
            if (dto.DataInvioProgrammato == null || dto.DataInvioProgrammato <= DateTime.UtcNow.AddMinutes(1))
                await InviaGiftCardEmailAsync(gc.Id);
        }

        await _db.SaveChangesAsync();

        return new GiftCardAcquistoResultDTO
        {
            GiftCards = cards,
            TotaleSpeso = totale,
            NuovoSaldoCredito = user.CreditoResiduo
        };
    }

    public async Task<List<GiftCardDTO>> GetMieGiftCardAsync(int userId)
    {
        return await _db.GiftCards
            .Include(g => g.AcquirenteUser)
            .Include(g => g.RiscattataDaUser)
            .Where(g => g.AcquirenteUserId == userId || g.RiscattataDaUserId == userId)
            .OrderByDescending(g => g.CreatedAtUtc)
            .Select(g => MapDTO(g))
            .ToListAsync();
    }

    public async Task<List<GiftCardDTO>> GetAllGiftCardAsync()
    {
        return await _db.GiftCards
            .Include(g => g.AcquirenteUser)
            .Include(g => g.RiscattataDaUser)
            .OrderByDescending(g => g.CreatedAtUtc)
            .Select(g => MapDTO(g))
            .ToListAsync();
    }

    public async Task<GiftCardDTO?> GetByCodiceAsync(string codice)
    {
        var gc = await _db.GiftCards
            .Include(g => g.AcquirenteUser)
            .Include(g => g.RiscattataDaUser)
            .FirstOrDefaultAsync(g => g.Codice == codice);
        return gc is null ? null : MapDTO(gc);
    }

    public async Task<GiftCardRiscattoResultDTO> RiscattaAsync(int userId, GiftCardRiscattoRequestDTO dto)
    {
        var codice = dto.Codice.Trim().ToUpper();
        var giftCard = await _db.GiftCards.FirstOrDefaultAsync(g => g.Codice == codice)
            ?? throw new ArgumentException("Codice gift card non valido.");

        if (giftCard.Stato != GiftCardStato.Attiva)
            throw new InvalidOperationException("Questa gift card non è più attiva.");

        if (giftCard.DataScadenza < DateTime.UtcNow)
        {
            giftCard.Stato = GiftCardStato.Scaduta;
            await _db.SaveChangesAsync();
            throw new InvalidOperationException("Questa gift card è scaduta.");
        }

        var user = await _db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Utente non trovato.");

        var importo = giftCard.SaldoResiduo;
        var saldoPre = user.CreditoResiduo;
        user.CreditoResiduo += importo;

        _db.MovimentiCredito.Add(new MovimentoCredito
        {
            UserId = userId,
            Tipo = MovimentoCreditoTipo.GiftCardRiscatto,
            Importo = importo,
            SaldoPre = saldoPre,
            SaldoPost = user.CreditoResiduo,
            CreatedAtUtc = DateTime.UtcNow,
            Note = $"Riscatto gift card {giftCard.Codice}"
        });
        giftCard.SaldoResiduo = 0;
        giftCard.Stato = GiftCardStato.Riscattata;
        giftCard.RiscattataDaUserId = userId;
        giftCard.DataRiscatto = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new GiftCardRiscattoResultDTO
        {
            GiftCard = MapDTO(giftCard),
            CreditoAccreditato = importo,
            NuovoSaldo = user.CreditoResiduo
        };
    }

    public async Task<bool> DisattivaAsync(int giftCardId)
    {
        var gc = await _db.GiftCards.FindAsync(giftCardId);
        if (gc is null) return false;
        gc.Stato = GiftCardStato.Disattivata;
        gc.Note = (gc.Note ?? "") + " | Disattivata da admin";
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task InviaGiftCardEmailAsync(int giftCardId)
    {
        var gc = await _db.GiftCards
            .Include(g => g.AcquirenteUser)
            .FirstOrDefaultAsync(g => g.Id == giftCardId);
        if (gc is null) return;

        var emailDest = gc.DestinatarioEmail ?? gc.AcquirenteUser?.Email;
        if (string.IsNullOrWhiteSpace(emailDest)) return;

        var nomeMittente = gc.AcquirenteUser?.Nome ?? "Cinema67";
        var scadenza = gc.DataScadenza.ToString("dd/MM/yyyy");
        var messaggioHtml = string.IsNullOrWhiteSpace(gc.Messaggio) ? "" : $"<p style='color:#a89888;font-style:italic;margin:16px 0;padding:12px;border-left:3px solid #d4af37;'>\"{System.Net.WebUtility.HtmlEncode(gc.Messaggio)}\"</p>";

        var html = $@"
<div style='max-width:520px;margin:0 auto;font-family:Arial,sans-serif;background:#14100c;color:#f0e8e0;border-radius:12px;overflow:hidden;border:1px solid #38302a;'>
  <div style='background:linear-gradient(135deg,#b91c1c,#7f1d1d);padding:28px 24px;text-align:center;'>
    <h1 style='color:#d4af37;margin:0;font-size:24px;letter-spacing:2px;'>CINEMA67</h1>
    <p style='color:#f0e8e0;margin:8px 0 0;font-size:14px;'>Gift Card</p>
  </div>
  <div style='padding:24px;'>
    <p style='font-size:14px;margin:0 0 8px;'>Ciao,</p>
    <p style='font-size:14px;margin:0 0 16px;'>{nomeMittente} ti ha regalato una Gift Card Cinema67 del valore di <strong style='color:#d4af37;'>€{gc.ValoreIniziale:F2}</strong>.</p>
    {messaggioHtml}
    <div style='background:#1c1713;border-radius:8px;padding:16px;text-align:center;margin:16px 0;border:1px dashed #d4af37;'>
      <p style='font-size:12px;color:#a89888;margin:0 0 6px;'>IL TUO CODICE</p>
      <p style='font-size:26px;font-weight:bold;color:#d4af37;margin:0;letter-spacing:3px;font-family:monospace;'>{gc.Codice}</p>
    </div>
    <p style='font-size:13px;color:#a89888;margin:0 0 4px;'>Valido fino al {scadenza}</p>
    <p style='font-size:13px;color:#a89888;margin:0;'>Riscattalo su Cinema67 per aggiungere €{gc.ValoreIniziale:F2} al tuo credito.</p>
  </div>
  <div style='background:#1c1713;padding:16px 24px;text-align:center;border-top:1px solid #38302a;'>
    <a href='http://localhost:5001/riscatta-giftcard.html' style='color:#d4af37;text-decoration:none;font-size:13px;'>Riscatta ora →</a>
  </div>
</div>";

        try
        {
            await _emailService.SendHtmlEmailAsync(emailDest, "🎁 Hai ricevuto una Gift Card Cinema67!", html);
            gc.InviataIl = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            gc.Note = (gc.Note ?? "") + $" | Errore invio email: {ex.Message}";
            await _db.SaveChangesAsync();
        }
    }

    public async Task InviaEmailProgrammateAsync()
    {
        var daInviare = await _db.GiftCards
            .Where(g => g.Stato == GiftCardStato.Attiva
                     && g.DataInvioProgrammato != null
                     && g.DataInvioProgrammato <= DateTime.UtcNow
                     && g.InviataIl == null
                     && (g.DestinatarioEmail != null || g.AcquirenteUserId != null))
            .ToListAsync();

        foreach (var gc in daInviare)
        {
            await InviaGiftCardEmailAsync(gc.Id);
        }
    }

    public async Task<object> CreateStripeCheckoutCartAsync(int userId, GiftCardCartAcquistoRequestDTO dto)
    {
        if (dto.Items == null || dto.Items.Count == 0 || dto.Items.Count > 10)
            throw new ArgumentException("Carrello vuoto o troppi articoli (max 10).");

        var totale = dto.Items.Sum(i => i.Importo * i.Quantita);
        if (totale <= 0)
            throw new ArgumentException("Totale carrello non valido.");

        var user = await _db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Utente non trovato.");

        var importoCreditoUsato = dto.MetodoPagamento == "misto" ? Math.Min(user.CreditoResiduo, totale) : 0;
        var importoCarta = totale - importoCreditoUsato;

        if (importoCarta <= 0)
            throw new ArgumentException("L'importo con carta è 0. Usa il credito.");

        var itemsJson = System.Text.Json.JsonSerializer.Serialize(dto.Items);

        var pending = new GiftCard
        {
            Codice = $"CART-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            ValoreIniziale = totale,
            SaldoResiduo = totale,
            Stato = GiftCardStato.Disattivata,
            AcquirenteUserId = userId,
            DestinatarioEmail = dto.DestinatarioEmail,
            Messaggio = dto.Messaggio,
            DataInvioProgrammato = dto.DataInvioProgrammato,
            DataAcquisto = DateTime.UtcNow,
            DataScadenza = DateTime.UtcNow.AddYears(1),
            CreatedAtUtc = DateTime.UtcNow,
            Note = $"CART|METODO:{dto.MetodoPagamento}|CREDITO:{importoCreditoUsato}|ITEMS:{itemsJson}"
        };
        _db.GiftCards.Add(pending);
        await _db.SaveChangesAsync();

        var stripeRequest = new StripeCreateCheckoutSessionRequest
        {
            Amount = importoCarta,
            Currency = "eur",
            SuccessUrl = $"http://localhost:5001/giftcard.html?stripe_session={{CHECKOUT_SESSION_ID}}",
            CancelUrl = "http://localhost:5001/giftcard.html",
            OrderId = pending.Id,
            OrderCode = pending.Codice,
            UserId = userId,
            ShowId = 0
        };

        var session = await _stripeGateway.CreateCheckoutSessionAsync(stripeRequest, null);

        pending.Note = $"CART|SESSION:{session.Id}|METODO:{dto.MetodoPagamento}|CREDITO:{importoCreditoUsato}|ITEMS:{itemsJson}";
        await _db.SaveChangesAsync();

        return new { checkoutUrl = session.Url, sessionId = session.Id };
    }

    public async Task<GiftCardAcquistoResultDTO> ConfermaStripeCartAsync(int userId, string sessionId)
    {
        var pending = await _db.GiftCards
            .FirstOrDefaultAsync(g => g.Stato == GiftCardStato.Disattivata && g.Note != null && g.Note.Contains($"SESSION:{sessionId}"));

        if (pending == null)
            throw new ArgumentException("Sessione di pagamento non trovata.");

        if (pending.AcquirenteUserId != userId)
            throw new ArgumentException("Questa sessione appartiene a un altro utente.");

        var session = await _stripeGateway.GetCheckoutSessionAsync(sessionId);
        if (session.Status != "complete" || session.PaymentIntentId == null)
            throw new InvalidOperationException("Il pagamento non risulta completato.");

        var noteParts = pending.Note?.Split('|') ?? Array.Empty<string>();
        var metodo = noteParts.FirstOrDefault(p => p.StartsWith("METODO:"))?.Replace("METODO:", "") ?? "carta";
        var creditoStr = noteParts.FirstOrDefault(p => p.StartsWith("CREDITO:"))?.Replace("CREDITO:", "");
        var itemsStr = noteParts.FirstOrDefault(p => p.StartsWith("ITEMS:"))?.Replace("ITEMS:", "");

        var creditoUsato = decimal.TryParse(creditoStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var cr) ? cr : 0;
        var items = string.IsNullOrEmpty(itemsStr) ? new List<GiftCardCartItemDTO>() 
            : System.Text.Json.JsonSerializer.Deserialize<List<GiftCardCartItemDTO>>(itemsStr) ?? new();

        _db.GiftCards.Remove(pending);

        var user = await _db.Users.FindAsync(userId);
        if (creditoUsato > 0 && user != null)
        {
            var saldoPre = user.CreditoResiduo;
            user.CreditoResiduo -= creditoUsato;
            _db.MovimentiCredito.Add(new MovimentoCredito
            {
                UserId = userId,
                Tipo = MovimentoCreditoTipo.GiftCardPurchase,
                Importo = -creditoUsato,
                SaldoPre = saldoPre,
                SaldoPost = user.CreditoResiduo,
                CreatedAtUtc = DateTime.UtcNow,
                Note = "Acquisto gift card (carrello) - parte credito"
            });
        }

        var cards = new List<GiftCardDTO>();
        foreach (var item in items)
        {
            for (int i = 0; i < item.Quantita; i++)
            {
                var email = item.DestinatarioEmail ?? pending.DestinatarioEmail;
                var msg = item.Messaggio ?? pending.Messaggio;
                var invio = item.DataInvioProgrammato ?? pending.DataInvioProgrammato;
                var gc = await CreateGiftCardAsync(userId, item.Importo, email, msg, invio);
                cards.Add(MapDTO(gc));
                if (invio == null || invio <= DateTime.UtcNow.AddMinutes(1))
                    await InviaGiftCardEmailAsync(gc.Id);
            }
        }

        await _db.SaveChangesAsync();

        return new GiftCardAcquistoResultDTO
        {
            GiftCards = cards,
            TotaleSpeso = items.Sum(i => i.Importo * i.Quantita),
            NuovoSaldoCredito = user?.CreditoResiduo ?? 0
        };
    }

    // Keep old methods for backward compat
    public async Task<object> CreateStripeCheckoutAsync(int userId, GiftCardAcquistoRequestDTO dto)
    {
        return await CreateStripeCheckoutCartAsync(userId, new GiftCardCartAcquistoRequestDTO
        {
            Items = new List<GiftCardCartItemDTO> { new() { Importo = dto.Importo, Quantita = dto.Quantita } },
            DestinatarioEmail = dto.DestinatarioEmail,
            Messaggio = dto.Messaggio,
            DataInvioProgrammato = dto.DataInvioProgrammato,
            MetodoPagamento = dto.MetodoPagamento
        });
    }

    public async Task<GiftCardAcquistoResultDTO> ConfermaStripeAsync(int userId, string sessionId)
    {
        // Try cart first
        var cart = await _db.GiftCards
            .FirstOrDefaultAsync(g => g.Stato == GiftCardStato.Disattivata && g.Note != null && g.Note.StartsWith("CART") && g.Note.Contains($"SESSION:{sessionId}"));
        if (cart != null)
            return await ConfermaStripeCartAsync(userId, sessionId);

        // Try single purchase (legacy Note format)
        var single = await _db.GiftCards
            .FirstOrDefaultAsync(g => g.Stato == GiftCardStato.Disattivata && g.Note != null && g.Note.Contains($"STRIPE_SESSION:{sessionId}"));
        if (single != null)
        {
            // Process legacy single purchase
            return await ProcessSingleStripeAsync(userId, sessionId, single);
        }

        throw new ArgumentException("Sessione di pagamento non trovata o già completata.");
    }

    private async Task<GiftCardAcquistoResultDTO> ProcessSingleStripeAsync(int userId, string sessionId, GiftCard pending)
    {
        var session = await _stripeGateway.GetCheckoutSessionAsync(sessionId);
        if (session.Status != "complete" || session.PaymentIntentId == null)
            throw new InvalidOperationException("Il pagamento non risulta completato.");

        var noteParts = pending.Note?.Split('|') ?? Array.Empty<string>();
        var importoStr = noteParts.FirstOrDefault(p => p.StartsWith("IMPORTO:"))?.Replace("IMPORTO:", "");
        var qtaStr = noteParts.FirstOrDefault(p => p.StartsWith("QTA:"))?.Replace("QTA:", "");
        var creditoStr = noteParts.FirstOrDefault(p => p.StartsWith("CREDITO:"))?.Replace("CREDITO:", "");

        var importo = decimal.TryParse(importoStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var imp) ? imp : pending.ValoreIniziale;
        var qta = int.TryParse(qtaStr, out var q) ? q : 1;
        var creditoUsato = decimal.TryParse(creditoStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var cr) ? cr : 0;

        _db.GiftCards.Remove(pending);
        var user = await _db.Users.FindAsync(userId);
        if (creditoUsato > 0 && user != null)
        {
            var saldoPre = user.CreditoResiduo;
            user.CreditoResiduo -= creditoUsato;
            _db.MovimentiCredito.Add(new MovimentoCredito
            {
                UserId = userId,
                Tipo = MovimentoCreditoTipo.GiftCardPurchase,
                Importo = -creditoUsato,
                SaldoPre = saldoPre,
                SaldoPost = user.CreditoResiduo,
                CreatedAtUtc = DateTime.UtcNow,
                Note = "Acquisto gift card - parte credito"
            });
        }

        var cards = new List<GiftCardDTO>();
        for (int i = 0; i < qta; i++)
        {
            var gc = await CreateGiftCardAsync(userId, importo, pending.DestinatarioEmail, pending.Messaggio, pending.DataInvioProgrammato);
            cards.Add(MapDTO(gc));
            if (pending.DataInvioProgrammato == null || pending.DataInvioProgrammato <= DateTime.UtcNow.AddMinutes(1))
                await InviaGiftCardEmailAsync(gc.Id);
        }

        await _db.SaveChangesAsync();

        return new GiftCardAcquistoResultDTO
        {
            GiftCards = cards,
            TotaleSpeso = importo * qta,
            NuovoSaldoCredito = user?.CreditoResiduo ?? 0
        };
    }

    private static GiftCardDTO MapDTO(GiftCard g) => new()
    {
        Id = g.Id,
        Codice = g.Codice,
        ValoreIniziale = g.ValoreIniziale,
        SaldoResiduo = g.SaldoResiduo,
        Stato = g.Stato.ToString(),
        AcquirenteEmail = g.AcquirenteUser?.Email,
        RiscattataDaEmail = g.RiscattataDaUser?.Email,
        DestinatarioEmail = g.DestinatarioEmail,
        Messaggio = g.Messaggio,
        DataInvioProgrammato = g.DataInvioProgrammato,
        InviataIl = g.InviataIl,
        DataAcquisto = g.DataAcquisto,
        DataRiscatto = g.DataRiscatto,
        DataScadenza = g.DataScadenza,
        CreatedAtUtc = g.CreatedAtUtc,
        Note = g.Note
    };
}
