using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public class CheckoutService : ICheckoutService
{
    private readonly FilmDbContext _db;
    private readonly TimeSpan _orderTimeout;

    public CheckoutService(FilmDbContext db)
    {
        _db = db;
        var orderTimeoutMinutes = int.Parse(Environment.GetEnvironmentVariable("ORDER_TIMEOUT_MINUTES") ?? "4");
        _orderTimeout = TimeSpan.FromMinutes(Math.Max(1, orderTimeoutMinutes));
    }

    public async Task<OrdineSummaryDTO> CreateOrdineAsync(int userId, CreateOrdineRequestDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.HoldToken))
            throw new ArgumentException("HoldToken obbligatorio.");

        await using var transaction = await _db.Database.BeginTransactionAsync();

        var statiHold = await _db.ShowPostiStato
            .Include(sps => sps.Show!)
            .ThenInclude(s => s!.Sala)
            .Include(sps => sps.Show!)
            .ThenInclude(s => s!.Film)
            .Include(sps => sps.Show!)
            .ThenInclude(s => s!.Cinema)
            .Where(sps => sps.HoldToken == dto.HoldToken && sps.UserId == userId && sps.Stato == ShowPostoState.Hold)
            .ToListAsync();

        if (statiHold.Count == 0)
            throw new InvalidOperationException("Hold non trovato, scaduto o non appartiene all'utente.");

        var now = DateTime.UtcNow;
        var primoStato = statiHold[0];
        if (primoStato.ScadeAtUtc <= now)
            throw new InvalidOperationException("Hold scaduto.");

        var show = primoStato.Show!;

        var existingOrdine = await _db.Ordini
            .FirstOrDefaultAsync(o => o.HoldToken == dto.HoldToken && o.UserId == userId && o.Stato == OrdineState.Pending);

        if (existingOrdine != null)
        {
            await transaction.CommitAsync();
            return MapToSummary(existingOrdine, show);
        }

        if (!string.IsNullOrWhiteSpace(dto.IdempotencyKey))
        {
            var existingByIdempotency = await _db.Ordini
                .FirstOrDefaultAsync(o => o.IdempotencyKey == dto.IdempotencyKey && o.UserId == userId);

            if (existingByIdempotency != null)
            {
                await transaction.CommitAsync();
                return MapToSummary(existingByIdempotency, show);
            }
        }

        var prezzoBase = TicketPriceNormalizer.NormalizeUnitPrice(show.PrezzoBase)
            + TicketPriceNormalizer.NormalizeUnitPrice(show.SupplementoSala);
        var numeroBiglietti = statiHold.Count;

        var pricingService = new PricingService();
        var totaleLordo = statiHold.Sum(sps =>
        {
            var tipo = sps.TicketType ?? TicketType.Intero;
            return pricingService.CalcolaPrezzo(tipo, prezzoBase);
        });

        // Discount code validation
        int? scontoPercent = null;
        string? discountCode = null;
        if (!string.IsNullOrWhiteSpace(dto.DiscountCode))
        {
            var code = dto.DiscountCode.Trim().ToUpper();
            var promo = await _db.Promotions
                .FirstOrDefaultAsync(p => p.DiscountCode == code && p.Active
                    && (p.StartDate == null || p.StartDate <= DateTime.UtcNow)
                    && (p.EndDate == null || p.EndDate >= DateTime.UtcNow));
            if (promo == null)
            {
                var newsletterSub = await _db.NewsletterSubscribers
                    .FirstOrDefaultAsync(s => s.CodiceSconto == code && !s.ScontoUsato);
                if (newsletterSub != null)
                {
                    scontoPercent = 15; // Default newsletter discount
                    discountCode = code;
                    newsletterSub.ScontoUsato = true;
                }
            }
            else
            {
                if (promo.DiscountPercent.HasValue)
                {
                    if (promo.MaxUsage.HasValue && promo.UsageCount >= promo.MaxUsage.Value)
                        throw new InvalidOperationException("Codice sconto esaurito.");
                    scontoPercent = promo.DiscountPercent.Value;
                    discountCode = code;
                    promo.UsageCount++;
                }
            }
            if (scontoPercent == null)
                throw new ArgumentException("Codice sconto non valido o già usato.");
        }

        var codiceOrdine = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..8]}";

        var ordine = new Ordine
        {
            CodiceOrdine = codiceOrdine,
            UserId = userId,
            ShowId = show.Id,
            CinemaId = show.CinemaId,
            SalaId = show.SalaId,
            FilmId = show.FilmId,
            HoldToken = dto.HoldToken,
            NumeroBiglietti = numeroBiglietti,
            TotaleLordo = totaleLordo,
            ImportoCredito = 0,
            ImportoCarta = scontoPercent.HasValue ? totaleLordo * (1 - scontoPercent.Value / 100m) : totaleLordo,
            ScontoPercent = scontoPercent,
            DiscountCode = discountCode,
            IdempotencyKey = dto.IdempotencyKey,
            Stato = OrdineState.Pending,
            CreatedAtUtc = now,
            CheckoutExpiresAtUtc = now.Add(_orderTimeout)
        };

        _db.Ordini.Add(ordine);
        await _db.SaveChangesAsync();

        foreach (var stato in statiHold)
        {
            stato.OrdineId = ordine.Id;
            stato.UpdatedAtUtc = now;
        }

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return MapToSummary(ordine, show);
    }

    public async Task<List<OrdineSummaryDTO>> GetOrdiniByUserAsync(int userId)
    {
        var ordini = await _db.Ordini
            .Include(o => o.Show!)
            .ThenInclude(s => s!.Film)
            .Include(o => o.Show!)
            .ThenInclude(s => s!.Cinema)
            .Include(o => o.Show!)
            .ThenInclude(s => s!.Sala)
            .Include(o => o.Biglietti)
            .ThenInclude(b => b.SalaPosto)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync();

        return ordini.Select(o => MapToSummary(o, o.Show!)).ToList();
    }

    public async Task<OrdineSummaryDTO?> GetOrdineByIdAsync(int orderId, int userId)
    {
        var ordine = await _db.Ordini
            .Include(o => o.Show!)
            .ThenInclude(s => s!.Film)
            .Include(o => o.Show!)
            .ThenInclude(s => s!.Cinema)
            .Include(o => o.Show!)
            .ThenInclude(s => s!.Sala)
            .Include(o => o.Biglietti)
            .ThenInclude(b => b.SalaPosto)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (ordine == null)
            return null;

        return MapToSummary(ordine, ordine.Show!);
    }

    public async Task<List<BigliettoSummaryDTO>> GetTicketsByUserAsync(int userId)
    {
        var tickets = await _db.Biglietti
            .Include(b => b.Show!)
            .ThenInclude(s => s!.Film)
            .Include(b => b.Show!)
            .ThenInclude(s => s!.Cinema)
            .Include(b => b.Show!)
            .ThenInclude(s => s!.Sala)
            .Include(b => b.SalaPosto)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.Show!.StartAtUtc)
            .ThenBy(b => b.SalaPosto!.Settore)
            .ThenBy(b => b.SalaPosto!.Fila)
            .ThenBy(b => b.SalaPosto!.Numero)
            .ToListAsync();

        return tickets.Select(MapToTicketSummary).ToList();
    }

    public async Task<BigliettoDetailDTO?> GetTicketByIdAsync(int ticketId, int userId)
    {
        var ticket = await _db.Biglietti
            .Include(b => b.Show!)
            .ThenInclude(s => s!.Film)
            .Include(b => b.Show!)
            .ThenInclude(s => s!.Cinema)
            .Include(b => b.Show!)
            .ThenInclude(s => s!.Sala)
            .Include(b => b.SalaPosto)
            .FirstOrDefaultAsync(b => b.Id == ticketId && b.UserId == userId);

        if (ticket is null)
            return null;

        return MapToTicketDetail(ticket);
    }

    private static OrdineSummaryDTO MapToSummary(Ordine ordine, Show show)
    {
        return new OrdineSummaryDTO
        {
            Id = ordine.Id,
            CodiceOrdine = ordine.CodiceOrdine,
            ShowId = ordine.ShowId,
            FilmTitolo = show.Film?.Titolo ?? string.Empty,
            CinemaNome = show.Cinema?.Nome ?? string.Empty,
            SalaNome = show.Sala?.Nome ?? $"Sala {show.Sala?.NumeroProgressivo}",
            StartAtUtc = show.StartAtUtc,
            NumeroBiglietti = ordine.NumeroBiglietti,
            TotaleLordo = TicketPriceNormalizer.NormalizeTotal(ordine.TotaleLordo, ordine.NumeroBiglietti),
            ImportoCredito = TicketPriceNormalizer.NormalizeTotal(ordine.ImportoCredito, ordine.NumeroBiglietti),
            ImportoCarta = TicketPriceNormalizer.NormalizeTotal(ordine.ImportoCarta, ordine.NumeroBiglietti),
            StripePaymentIntentId = ordine.StripePaymentIntentId,
            StripeCheckoutSessionId = ordine.StripeCheckoutSessionId,
            Stato = ordine.Stato.ToString(),
            CreatedAtUtc = ordine.CreatedAtUtc,
            PaidAtUtc = ordine.PaidAtUtc,
            CheckoutExpiresAtUtc = ordine.CheckoutExpiresAtUtc,
            CheckoutCompletedAtUtc = ordine.CheckoutCompletedAtUtc,
            CreditoRiservato = ordine.CreditoRiservato,
            TicketEmailSentAtUtc = ordine.TicketEmailSentAtUtc,
            TicketEmailLastError = ordine.TicketEmailLastError,
            LastPaymentError = ordine.LastPaymentError,
            ScontoPercent = ordine.ScontoPercent,
            DiscountCode = ordine.DiscountCode,
            TotaleScontato = ordine.ScontoPercent.HasValue ? ordine.TotaleLordo * (1 - ordine.ScontoPercent.Value / 100m) : ordine.TotaleLordo,
            Biglietti = ordine.Biglietti
                .OrderBy(b => b.SalaPosto?.Settore)
                .ThenBy(b => b.SalaPosto?.Fila)
                .ThenBy(b => b.SalaPosto?.Numero)
                .Select(b => new OrdineTicketSummaryDTO
                {
                    Id = b.Id,
                    SalaPostoId = b.SalaPostoId,
                    CodiceBiglietto = b.CodiceBiglietto,
                    Settore = b.SalaPosto?.Settore ?? string.Empty,
                    Fila = b.SalaPosto?.Fila ?? 0,
                    Numero = b.SalaPosto?.Numero ?? 0,
                    PrezzoTotale = TicketPriceNormalizer.NormalizeUnitPrice(b.PrezzoTotale),
                    Stato = b.Stato.ToString(),
                    TipoBiglietto = b.TipoBiglietto.ToString(),
                    ValidatoAtUtc = b.ValidatoAtUtc
                })
                .ToList()
        };
    }

    private static BigliettoSummaryDTO MapToTicketSummary(Biglietto ticket)
    {
        return new BigliettoSummaryDTO
        {
            Id = ticket.Id,
            OrdineId = ticket.OrdineId,
            ShowId = ticket.ShowId,
            CodiceBiglietto = ticket.CodiceBiglietto,
            FilmTitolo = ticket.Show?.Film?.Titolo ?? string.Empty,
            CinemaNome = ticket.Show?.Cinema?.Nome ?? string.Empty,
            SalaNome = ticket.Show?.Sala?.Nome ?? $"Sala {ticket.Show?.Sala?.NumeroProgressivo}",
            StartAtUtc = ticket.Show?.StartAtUtc ?? default,
            Settore = ticket.SalaPosto?.Settore ?? string.Empty,
            Fila = ticket.SalaPosto?.Fila ?? 0,
            Numero = ticket.SalaPosto?.Numero ?? 0,
            PrezzoTotale = TicketPriceNormalizer.NormalizeUnitPrice(ticket.PrezzoTotale),
            Stato = ticket.Stato.ToString(),
            TipoBiglietto = ticket.TipoBiglietto.ToString(),
            ValidatoAtUtc = ticket.ValidatoAtUtc
        };
    }

    private static BigliettoDetailDTO MapToTicketDetail(Biglietto ticket)
    {
        var summary = MapToTicketSummary(ticket);
        return new BigliettoDetailDTO
        {
            Id = summary.Id,
            OrdineId = summary.OrdineId,
            ShowId = summary.ShowId,
            CodiceBiglietto = summary.CodiceBiglietto,
            FilmTitolo = summary.FilmTitolo,
            CinemaNome = summary.CinemaNome,
            SalaNome = summary.SalaNome,
            StartAtUtc = summary.StartAtUtc,
            Settore = summary.Settore,
            Fila = summary.Fila,
            Numero = summary.Numero,
            PrezzoTotale = summary.PrezzoTotale,
            Stato = summary.Stato,
            BarcodeValue = ticket.BarcodeValue,
            PrezzoBase = TicketPriceNormalizer.NormalizeUnitPrice(ticket.PrezzoBase),
            Supplemento = TicketPriceNormalizer.NormalizeUnitPrice(ticket.Supplemento),
            ValidatoDaUserId = ticket.ValidatoDaUserId,
            ValidatoCinemaId = ticket.ValidatoCinemaId
        };
    }
}
