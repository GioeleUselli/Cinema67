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
    decimal CalcolaPrezzo(PartyType tipo, PartyPackage pacchetto, int ospiti);
    Task<PartyBookingDTO> ConfermaPagamentoAsync(int userId, int bookingId);
}

public class PartyBookingService : IPartyBookingService
{
    private readonly FilmDbContext _db;
    private readonly IStripePaymentGateway _stripe;

    public PartyBookingService(FilmDbContext db, IStripePaymentGateway stripe)
    {
        _db = db;
        _stripe = stripe;
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
            await _db.SaveChangesAsync();
            return await GetBookingDTO(booking.Id);
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
        await _db.SaveChangesAsync();
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
        var b = await _db.PartyBookings.FindAsync(id)
            ?? throw new ArgumentException("Prenotazione non trovata.");
        b.Stato = status;
        if (status == PartyStatus.Confirmed) b.ConfermatoIl = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await GetBookingDTO(id);
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
        Totale = b.Totale, Stato = b.Stato.ToString(), ConfermatoIl = b.ConfermatoIl, CreatedAtUtc = b.CreatedAtUtc
    };
}
