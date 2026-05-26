using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IPartyBookingService
{
    Task<object> CreateBookingAsync(int userId, PartyBookingCreateDTO dto);
    Task<List<PartyBookingDTO>> GetMyBookingsAsync(int userId);
    Task<List<PartyBookingDTO>> GetAllBookingsAsync();
    Task<PartyBookingDTO> UpdateStatusAsync(int id, PartyStatus status);
    Task<PartyBookingDTO> ScanQrAsync(string qrData);
    Task AutoCompleteAsync();
    decimal CalcolaPrezzo(PartyType tipo, PartyPackage pacchetto, int ospiti);
    Task<PartyBookingDTO> ConfermaPagamentoAsync(int userId, int bookingId);
    Task SubmitFeedbackAsync(int partyBookingId, int rating, string? comment);
}

public class PartyBookingService : IPartyBookingService
{
    private readonly FilmDbContext _db;
    private readonly IStripePaymentGateway _stripe;
    private readonly IEmailService _emailService;
    private readonly IPayPalGateway _paypal;
    private readonly IMembershipService _membershipService;

    public PartyBookingService(FilmDbContext db, IStripePaymentGateway stripe, IEmailService emailService, IPayPalGateway paypal, IMembershipService membershipService)
    {
        _db = db; _stripe = stripe; _emailService = emailService; _paypal = paypal; _membershipService = membershipService;
    }

    public decimal CalcolaPrezzo(PartyType tipo, PartyPackage pacchetto, int ospiti)
    {
        decimal basePrice = tipo switch
        {
            PartyType.MovieParty => 15m,
            PartyType.GameRoom => 12m,
            PartyType.Both => 22m,
            _ => 15m
        };

        decimal packageMultiplier = pacchetto switch
        {
            PartyPackage.Basic => 1m,
            PartyPackage.Premium => 1.5m,
            PartyPackage.Vip => 2.5m,
            _ => 1m
        };

        return basePrice * ospiti * packageMultiplier;
    }

    public async Task<object> CreateBookingAsync(int userId, PartyBookingCreateDTO dto)
    {
        if (!Enum.TryParse<PartyType>(dto.Tipo, true, out var tipo))
            throw new ArgumentException("Tipo evento non valido.");
        if (!Enum.TryParse<PartyPackage>(dto.Pacchetto, true, out var pacchetto))
            throw new ArgumentException("Pacchetto non valido.");
        if (dto.NumeroOspiti < 1 || dto.NumeroOspiti > 50)
            throw new ArgumentException("Numero ospiti tra 1 e 50.");
        if (dto.DataEvento < DateTime.UtcNow.Date.AddDays(1))
            throw new ArgumentException("Data evento almeno domani.");
        if (dto.OraFine <= dto.OraInizio)
            throw new ArgumentException("Orario fine deve essere dopo inizio.");

        var cinema = await _db.Cinemas.FindAsync(dto.CinemaId)
            ?? throw new ArgumentException("Cinema non trovato.");

        // Capacity check: max 2 concurrent parties per cinema
        var conflitti = await _db.PartyBookings
            .CountAsync(b => b.CinemaId == dto.CinemaId && b.Stato != PartyStatus.Cancelled
                && b.DataEvento.Date == dto.DataEvento.Date
                && b.OraInizio < dto.OraFine && b.OraFine > dto.OraInizio);

        if (conflitti >= 2)
            throw new InvalidOperationException("Ci sono già 2 feste in questo orario. Scegli un altro orario.");

        var totale = CalcolaPrezzo(tipo, pacchetto, dto.NumeroOspiti);

        // Apply discount code
        decimal sconto = 0;
        if (!string.IsNullOrWhiteSpace(dto.CodiceSconto))
        {
            var disc = await _db.MerchDiscountCodes
                .FirstOrDefaultAsync(d => d.Codice == dto.CodiceSconto.Trim().ToUpper() && d.Attivo
                    && (!d.ScadeIl.HasValue || d.ScadeIl.Value > DateTime.UtcNow)
                    && d.Utilizzi < d.MaxUtilizzi);
            if (disc != null)
            {
                if (disc.PercentualeSconto > 0)
                {
                    sconto = Math.Round(totale * disc.PercentualeSconto / 100m, 2);
                    if (disc.ValoreScontoFisso > 0) sconto = Math.Min(sconto, disc.ValoreScontoFisso);
                }
                else if (disc.ValoreScontoFisso > 0)
                    sconto = Math.Min(disc.ValoreScontoFisso, totale);
                disc.Utilizzi++;
            }
        }
        totale -= sconto;

        var booking = new PartyBooking
        {
            UserId = userId, CinemaId = dto.CinemaId, NomeFesta = dto.NomeFesta,
            Tipo = tipo, Pacchetto = pacchetto, NumeroOspiti = dto.NumeroOspiti,
            DataEvento = dto.DataEvento, OraInizio = dto.OraInizio, OraFine = dto.OraFine,
            RichiesteSpeciali = dto.RichiesteSpeciali, Totale = totale,
            Stato = PartyStatus.Pending, CreatedAtUtc = DateTime.UtcNow
        };

        _db.PartyBookings.Add(booking);
        await _db.SaveChangesAsync();

        if (dto.MetodoPagamento == "credito")
        {
            var user = await _db.Users.FindAsync(userId);
            if (user!.CreditoResiduo < totale)
                throw new InvalidOperationException($"Credito insufficiente. Hai €{user.CreditoResiduo:F2}, servono €{totale:F2}.");
            user.CreditoResiduo -= totale;
            booking.Stato = PartyStatus.Confirmed;
            booking.ConfermatoIl = DateTime.UtcNow;
            booking.QrCodeData = $"FESTA-{booking.Id}-{Guid.NewGuid().ToString("N")[..8]}";
            await _db.SaveChangesAsync();
            await SendConfirmationEmail(booking);
            return await GetBookingDTO(booking.Id);
        }

        // PayPal
        if (dto.MetodoPagamento == "paypal")
        {
            var pp = await _paypal.CreateOrderAsync(new PayPalCreateOrderRequest
            {
                Amount = totale, Currency = "EUR", OrderCode = $"FESTA-{booking.Id}",
                ReturnUrl = $"http://localhost:5001/feste.html?paypal_booking={booking.Id}",
                CancelUrl = "http://localhost:5001/feste.html"
            });
            booking.StripePaymentIntentId = pp.Id;
            await _db.SaveChangesAsync();
            return new { checkoutUrl = pp.ApprovalUrl, bookingId = booking.Id };
        }

        // Stripe checkout
        var session = await _stripe.CreateCheckoutSessionAsync(new StripeCreateCheckoutSessionRequest
        {
            Amount = dto.MetodoPagamento == "misto" ? totale - Math.Min(totale, (await _db.Users.FindAsync(userId))!.CreditoResiduo) : totale,
            Currency = "eur",
            SuccessUrl = $"http://localhost:5001/feste.html?stripe_booking={booking.Id}",
            CancelUrl = "http://localhost:5001/feste.html",
            OrderId = booking.Id,
            OrderCode = $"FESTA-{booking.Id}",
            UserId = userId,
            ShowId = 0
        }, null);

        return new { checkoutUrl = session.Url, bookingId = booking.Id };
    }

    public async Task<PartyBookingDTO> ConfermaPagamentoAsync(int userId, int bookingId)
    {
        var b = await _db.PartyBookings.Include(x => x.Cinema).Include(x => x.User).FirstOrDefaultAsync(x => x.Id == bookingId && x.UserId == userId)
            ?? throw new ArgumentException("Prenotazione non trovata.");
        b.Stato = PartyStatus.Confirmed;
        b.ConfermatoIl = DateTime.UtcNow;
        b.QrCodeData = $"FESTA-{b.Id}-{Guid.NewGuid().ToString("N")[..8]}";
        await _db.SaveChangesAsync();
        await SendConfirmationEmail(b);
        try { await _membershipService.AccumulaPuntiAcquistoAsync(userId, b.Totale, b.Id); } catch { }
        return Map(b);
    }

    public async Task<List<PartyBookingDTO>> GetMyBookingsAsync(int userId)
    {
        return await _db.PartyBookings
            .Include(b => b.Cinema)
            .Include(b => b.Film)
            .Include(b => b.User)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAtUtc)
            .Select(b => Map(b))
            .ToListAsync();
    }

    public async Task<List<PartyBookingDTO>> GetAllBookingsAsync()
    {
        return await _db.PartyBookings
            .Include(b => b.Cinema)
            .Include(b => b.Film)
            .Include(b => b.User)
            .OrderByDescending(b => b.CreatedAtUtc)
            .Select(b => Map(b))
            .ToListAsync();
    }

    public async Task<PartyBookingDTO> UpdateStatusAsync(int id, PartyStatus status)
    {
        var b = await _db.PartyBookings.Include(x => x.Cinema).Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new ArgumentException("Prenotazione non trovata.");
        b.Stato = status;
        if (status == PartyStatus.Confirmed)
        {
            b.ConfermatoIl = DateTime.UtcNow;
            b.QrCodeData = $"FESTA-{b.Id}-{Guid.NewGuid().ToString("N")[..8]}";
            await SendConfirmationEmail(b);
        }
        if (status == PartyStatus.Cancelled)
        {
            await SendCancellationEmail(b);
        }
        if (status == PartyStatus.Completed)
        {
            b.CompletatoIl = DateTime.UtcNow;
            await SendCompletedEmail(b);
        }
        await _db.SaveChangesAsync();
        return Map(b);
    }

    public async Task<PartyBookingDTO> ScanQrAsync(string qrData)
    {
        var b = await _db.PartyBookings.Include(x => x.Cinema).Include(x => x.User).FirstOrDefaultAsync(x => x.QrCodeData == qrData)
            ?? throw new ArgumentException("QR code non valido.");
        if (b.Stato == PartyStatus.Completed) throw new InvalidOperationException("Festa già completata.");
        if (b.Stato == PartyStatus.Cancelled) throw new InvalidOperationException("Festa cancellata.");
        b.Stato = PartyStatus.Completed;
        b.CompletatoIl = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(b);
    }

    public async Task AutoCompleteAsync()
    {
        var now = DateTime.UtcNow;
        var daCompletare = await _db.PartyBookings
            .Where(b => b.Stato == PartyStatus.Confirmed && b.DataEvento.Date.Add(b.OraFine.TimeOfDay) < now)
            .ToListAsync();
        foreach (var b in daCompletare)
        {
            b.Stato = PartyStatus.Completed;
            b.CompletatoIl = DateTime.UtcNow;
        }
        if (daCompletare.Any()) await _db.SaveChangesAsync();
    }

    public async Task SubmitFeedbackAsync(int partyBookingId, int rating, string? comment)
    {
        var b = await _db.PartyBookings.FindAsync(partyBookingId)
            ?? throw new ArgumentException("Prenotazione non trovata.");
        var fb = new PartyFeedback { PartyBookingId = partyBookingId, Rating = Math.Clamp(rating, 1, 5), Comment = comment, CreatedAtUtc = DateTime.UtcNow };
        _db.PartyFeedbacks.Add(fb);
        await _db.SaveChangesAsync();
    }

    private async Task SendConfirmationEmail(PartyBooking b)
    {
        var email = b.User?.Email;
        if (string.IsNullOrEmpty(email)) return;
        var qrUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={Uri.EscapeDataString(b.QrCodeData!)}";
        var html = $@"
<div style='max-width:520px;margin:0 auto;font-family:Arial,sans-serif;background:#14100c;color:#f0e8e0;border-radius:12px;overflow:hidden;border:1px solid #38302a;'>
  <div style='background:linear-gradient(135deg,#b91c1c,#7f1d1d);padding:28px 24px;text-align:center;'>
    <h1 style='color:#d4af37;margin:0;font-size:24px;'>CINEMA67</h1>
    <p style='color:#f0e8e0;margin:6px 0 0;font-size:14px;'>Festa Confermata!</p>
  </div>
  <div style='padding:24px;'>
    <p style='font-size:14px;margin:0 0 12px;'>Ciao {b.User!.Nome}, la tua festa <strong>{b.NomeFesta}</strong> è stata confermata!</p>
    <p style='font-size:14px;margin:0 0 16px;'><strong>{b.Cinema?.Nome}</strong> — {b.DataEvento:dd/MM/yyyy} ore {b.OraInizio:HH:mm} - {b.OraFine:HH:mm} · {b.NumeroOspiti} ospiti · {b.Tipo} {b.Pacchetto} · Totale: €{b.Totale:F2}</p>
    <div style='background:white;border-radius:8px;padding:16px;text-align:center;margin:16px 0;'>
      <img src='{qrUrl}' alt='QR Code' style='width:180px;height:180px;'>
    </div>
    <p style='font-size:12px;color:#a89888;text-align:center;'>Codice: {b.QrCodeData}</p>
    <p style='font-size:13px;color:#a89888;'>Mostra questo QR code all'ingresso del cinema. Il personale lo scannerizzerà.</p>
  </div>
</div>";
        try { await _emailService.SendHtmlEmailAsync(email, "Festa confermata — " + b.NomeFesta, html); } catch { }
    }

    private async Task SendCancellationEmail(PartyBooking b)
    {
        var email = b.User?.Email;
        if (string.IsNullOrEmpty(email)) return;
        var html = $@"
<div style='max-width:520px;margin:0 auto;font-family:Arial,sans-serif;background:#14100c;color:#f0e8e0;border-radius:12px;overflow:hidden;border:1px solid #38302a;'>
  <div style='background:linear-gradient(135deg,#b91c1c,#7f1d1d);padding:28px 24px;text-align:center;'>
    <h1 style='color:#d4af37;margin:0;font-size:24px;'>CINEMA67</h1>
    <p style='color:#f0e8e0;margin:6px 0 0;font-size:14px;'>Festa Cancellata</p>
  </div>
  <div style='padding:24px;'>
    <p style='font-size:14px;margin:0 0 12px;'>Ciao {b.User!.Nome}, la tua festa <strong>{b.NomeFesta}</strong> è stata cancellata.</p>
    <p style='font-size:14px;margin:0 0 16px;'><strong>{b.Cinema?.Nome}</strong> — {b.DataEvento:dd/MM/yyyy} ore {b.OraInizio:HH:mm} · {b.NumeroOspiti} ospiti</p>
    <p style='font-size:13px;color:#a89888;'>Contattaci per riprogrammare o per un rimborso.</p>
  </div>
</div>";
        try { await _emailService.SendHtmlEmailAsync(email, "Festa cancellata — " + b.NomeFesta, html); } catch { }
    }

    private async Task SendCompletedEmail(PartyBooking b)
    {
        var email = b.User?.Email;
        if (string.IsNullOrEmpty(email)) return;
        var feedbackUrl = $"http://localhost:5001/feste.html?feedback={b.Id}";
        var html = $@"
<div style='max-width:520px;margin:0 auto;font-family:Arial,sans-serif;background:#14100c;color:#f0e8e0;border-radius:12px;overflow:hidden;border:1px solid #38302a;'>
  <div style='background:linear-gradient(135deg,#b91c1c,#7f1d1d);padding:28px 24px;text-align:center;'>
    <h1 style='color:#d4af37;margin:0;font-size:24px;'>CINEMA67</h1>
    <p style='color:#f0e8e0;margin:6px 0 0;font-size:14px;'>Grazie per aver festeggiato con noi!</p>
  </div>
  <div style='padding:24px;'>
    <p style='font-size:14px;margin:0 0 12px;'>Ciao {b.User!.Nome}, speriamo che la festa <strong>{b.NomeFesta}</strong> sia stata un successo!</p>
    <p style='font-size:14px;margin:0 0 16px;'><strong>{b.Cinema?.Nome}</strong> — {b.DataEvento:dd/MM/yyyy} · {b.NumeroOspiti} ospiti · {b.Tipo} {b.Pacchetto}</p>
    <p style='font-size:14px;margin:0 0 16px;color:#a89888;'>Ci farebbe piacere sapere com'è andata. Lascia un feedback:</p>
    <div style='text-align:center;margin:16px 0;'>
      <a href='{feedbackUrl}' style='display:inline-block;background:linear-gradient(135deg,#b8860b,#92600a);color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;'>Lascia un Feedback</a>
    </div>
    <p style='font-size:12px;color:#a89888;'>Il tuo parere ci aiuta a migliorare.</p>
  </div>
</div>";
        try { await _emailService.SendHtmlEmailAsync(email, "Com'è andata la festa? — " + b.NomeFesta, html); } catch { }
    }

    private async Task<PartyBookingDTO> GetBookingDTO(int id)
    {
        var b = await _db.PartyBookings.Include(x => x.Cinema).Include(x => x.Film).Include(x => x.User).FirstAsync(x => x.Id == id);
        return Map(b);
    }

    private static PartyBookingDTO Map(PartyBooking b) => new()
    {
        Id = b.Id, UserId = b.UserId, UserEmail = b.User?.Email ?? "", UserNome = b.User?.Nome + " " + b.User?.Cognome ?? "",
        CinemaId = b.CinemaId, CinemaNome = b.Cinema?.Nome ?? "", FilmId = b.FilmId, FilmTitolo = b.Film?.Titolo,
        NomeFesta = b.NomeFesta, Tipo = b.Tipo.ToString(), Pacchetto = b.Pacchetto.ToString(),
        NumeroOspiti = b.NumeroOspiti, DataEvento = b.DataEvento, OraInizio = b.OraInizio, OraFine = b.OraFine,
        RichiesteSpeciali = b.RichiesteSpeciali,
        Totale = b.Totale, Stato = b.Stato.ToString(), ConfermatoIl = b.ConfermatoIl, CompletatoIl = b.CompletatoIl,
        QrCodeData = b.QrCodeData, CreatedAtUtc = b.CreatedAtUtc
    };
}
