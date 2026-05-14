using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using FilmAPI.Services;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class PartyBookingEndpoints
{
    public static void MapPartyBookingEndpoints(this WebApplication app)
    {
        var authGroup = app.MapGroup("/party").RequireAuthorization("Authenticated");

        authGroup.MapGet("/prezzi", () => Results.Ok(new
        {
            pacchetti = new[] {
                new { nome = "Basic", descrizione = "Festa con pop corn e bibite incluse", moltiplicatore = "1×" },
                new { nome = "Premium", descrizione = "Torta personalizzata + gadget Cinema67", moltiplicatore = "1.5×" },
                new { nome = "VIP", descrizione = "Sala privata + catering + fotografo", moltiplicatore = "2.5×" }
            },
            tipi = new[] {
                new { nome = "MovieParty", descrizione = "Film + sala feste", prezzoBase = 15m },
                new { nome = "GameRoom", descrizione = "Sala giochi", prezzoBase = 12m },
                new { nome = "Both", descrizione = "Film + sala giochi", prezzoBase = 22m }
            }
        }));

        authGroup.MapPost("/prenota", async (PartyBookingCreateDTO dto, ClaimsPrincipal user, IPartyBookingService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                var result = await service.CreateBookingAsync(userId, dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPost("/feedback", async (PartyFeedbackDTO dto, ClaimsPrincipal user, IPartyBookingService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            try { await service.SubmitFeedbackAsync(dto.PartyBookingId, dto.Rating, dto.Comment); return Results.Ok(); }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapGet("/mie", async (ClaimsPrincipal user, IPartyBookingService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            return Results.Ok(await service.GetMyBookingsAsync(userId));
        });

        authGroup.MapPost("/conferma/{bookingId:int}", async (int bookingId, ClaimsPrincipal user, IPartyBookingService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try { return Results.Ok(await service.ConfermaPagamentoAsync(userId, bookingId)); }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPost("/paypal-capture/{bookingId:int}", async (int bookingId, ClaimsPrincipal user, IPartyBookingService service, IPayPalGateway paypal, FilmDbContext db) =>
        {
            var b = await db.PartyBookings.FindAsync(bookingId);
            if (b is null || string.IsNullOrEmpty(b.StripePaymentIntentId))
                return Results.NotFound();
            try
            {
                var capture = await paypal.CaptureOrderAsync(b.StripePaymentIntentId);
                if (capture.Status != "COMPLETED")
                    return Results.BadRequest(new { message = "Pagamento PayPal non completato: " + capture.Status });
                var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
                await service.ConfermaPagamentoAsync(userId, bookingId);
                return Results.Ok(new { success = true });
            }
            catch (Exception ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        var adminGroup = app.MapGroup("/admin/party").RequireAuthorization("CinemaStaffOrPowerUserOrAdmin");

        adminGroup.MapGet("/", async (IPartyBookingService service) =>
        {
            return Results.Ok(await service.GetAllBookingsAsync());
        });

        adminGroup.MapPost("/{id:int}/status", async (int id, UpdateStatusDTO dto, IPartyBookingService service) =>
        {
            if (!Enum.TryParse<PartyStatus>(dto.Status, true, out var status))
                return Results.BadRequest(new { message = "Stato non valido." });
            var result = await service.UpdateStatusAsync(id, status);
            return Results.Ok(result);
        });

        adminGroup.MapPost("/scan", async (ScanQrDTO dto, IPartyBookingService service) =>
        {
            try
            {
                var result = await service.ScanQrAsync(dto.QrData);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        adminGroup.MapPost("/auto-complete", async (IPartyBookingService service) =>
        {
            await service.AutoCompleteAsync();
            return Results.Ok(new { message = "Feste completate automaticamente." });
        });
    }
}

public class UpdateStatusDTO
{
    public string Status { get; set; } = string.Empty;
}

public class ScanQrDTO
{
    public string QrData { get; set; } = string.Empty;
}
