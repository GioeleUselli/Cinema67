using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class GiftCardEndpoints
{
    public static void MapGiftCardEndpoints(this WebApplication app)
    {
        var authGroup = app.MapGroup("/giftcard").RequireAuthorization("Authenticated");

        authGroup.MapGet("/mie", async (ClaimsPrincipal user, IGiftCardService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            var result = await service.GetMieGiftCardAsync(userId);
            return Results.Ok(result);
        });

        authGroup.MapGet("/{codice}", async (string codice, IGiftCardService service) =>
        {
            var result = await service.GetByCodiceAsync(codice.ToUpper().Trim());
            return result is null ? Results.NotFound(new { message = "Gift card non trovata" }) : Results.Ok(result);
        });

        authGroup.MapPost("/acquista", async (
            GiftCardAcquistoRequestDTO dto,
            ClaimsPrincipal user,
            IGiftCardService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                if (dto.MetodoPagamento == "carta" || dto.MetodoPagamento == "misto")
                {
                    var stripeResult = await service.CreateStripeCheckoutAsync(userId, dto);
                    return Results.Ok(stripeResult);
                }
                var result = await service.AcquistaConCreditoAsync(userId, dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPost("/acquista-carrello", async (
            GiftCardCartAcquistoRequestDTO dto,
            ClaimsPrincipal user,
            IGiftCardService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                if (dto.MetodoPagamento == "carta" || dto.MetodoPagamento == "misto" || dto.MetodoPagamento == "paypal")
                {
                    var stripeResult = await service.CreateStripeCheckoutCartAsync(userId, dto);
                    return Results.Ok(stripeResult);
                }
                // For credito with cart, create individual purchases with per-card details
                var allCards = new List<GiftCardDTO>();
                decimal totaleSpeso = 0;
                foreach (var item in dto.Items)
                {
                    var single = new GiftCardAcquistoRequestDTO
                    {
                        Importo = item.Importo,
                        Quantita = item.Quantita,
                        DestinatarioEmail = item.DestinatarioEmail ?? dto.DestinatarioEmail,
                        Messaggio = item.Messaggio ?? dto.Messaggio,
                        DataInvioProgrammato = item.DataInvioProgrammato ?? dto.DataInvioProgrammato,
                        MetodoPagamento = "credito"
                    };
                    var r = await service.AcquistaConCreditoAsync(userId, single);
                    allCards.AddRange(r.GiftCards);
                    totaleSpeso += r.TotaleSpeso;
                }
                return Results.Ok(new GiftCardAcquistoResultDTO { GiftCards = allCards, TotaleSpeso = totaleSpeso, NuovoSaldoCredito = 0 });
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPost("/conferma-stripe", async (
            ConfermaStripeDTO dto,
            ClaimsPrincipal user,
            IGiftCardService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                var result = await service.ConfermaStripeAsync(userId, dto.SessionId);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPost("/conferma-carrello", async (
            ConfermaStripeDTO dto,
            ClaimsPrincipal user,
            IGiftCardService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                var result = await service.ConfermaStripeCartAsync(userId, dto.SessionId);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPost("/conferma-paypal/{pendingId:int}", async (int pendingId, ClaimsPrincipal user, IPayPalGateway paypal, FilmDbContext db, IGiftCardService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var pending = await db.GiftCards.FindAsync(pendingId);
            if (pending is null || pending.AcquirenteUserId != userId || string.IsNullOrEmpty(pending.Note)) return Results.NotFound();
            var ppId = pending.Note.Split("PAYPAL:")[1].Split("|")[0];
            var capture = await paypal.CaptureOrderAsync(ppId);
            if (capture.Status != "COMPLETED") return Results.BadRequest(new { message = "PayPal non completato" });
            var result = await service.ConfermaPayPalCartAsync(userId, pendingId);
            return Results.Ok(result);
        });

        authGroup.MapPost("/riscatta", async (
            GiftCardRiscattoRequestDTO dto,
            ClaimsPrincipal user,
            IGiftCardService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                var result = await service.RiscattaAsync(userId, dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        var adminGroup = app.MapGroup("/admin/giftcard").RequireAuthorization("PowerUserOrAdmin");

        adminGroup.MapGet("/", async (IGiftCardService service) =>
        {
            var result = await service.GetAllGiftCardAsync();
            return Results.Ok(result);
        });

        adminGroup.MapPost("/{id:int}/disattiva", async (int id, IGiftCardService service) =>
        {
            var ok = await service.DisattivaAsync(id);
            return ok ? Results.Ok(new { message = "Gift card disattivata" }) : Results.NotFound();
        });

        adminGroup.MapPost("/invia-email-programmate", async (IGiftCardService service) =>
        {
            await service.InviaEmailProgrammateAsync();
            return Results.Ok(new { message = "Email programmate verificate e inviate." });
        });
    }
}
