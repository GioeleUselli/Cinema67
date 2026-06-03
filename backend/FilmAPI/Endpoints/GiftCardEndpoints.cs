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
            IGiftCardService service,
            FilmDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                // Apply discount code
                decimal sconto = 0;
                if (!string.IsNullOrWhiteSpace(dto.CodiceSconto))
                {
                    sconto = await ApplicaScontoAsync(db, dto.CodiceSconto, dto.Importo * dto.Quantita);
                    if (sconto < 0) return Results.BadRequest(new { message = "Codice sconto non valido o già usato." });
                }

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
            IGiftCardService service,
            FilmDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                // Apply discount code if provided
                decimal sconto = 0;
                if (!string.IsNullOrWhiteSpace(dto.CodiceSconto))
                {
                    var disc = await db.MerchDiscountCodes
                        .FirstOrDefaultAsync(d => d.Codice == dto.CodiceSconto.Trim().ToUpper() && d.Attivo
                            && (!d.ScadeIl.HasValue || d.ScadeIl.Value > DateTime.UtcNow)
                            && d.Utilizzi < d.MaxUtilizzi);
                    if (disc != null)
                    {
                        var tot = dto.Items.Sum(i => i.Importo * i.Quantita);
                        if (disc.PercentualeSconto > 0)
                        {
                            sconto = Math.Round(tot * disc.PercentualeSconto / 100m, 2);
                            if (disc.ValoreScontoFisso > 0) sconto = Math.Min(sconto, disc.ValoreScontoFisso);
                        }
                        else if (disc.ValoreScontoFisso > 0)
                            sconto = Math.Min(disc.ValoreScontoFisso, tot);
                        disc.Utilizzi++;
                        await db.SaveChangesAsync();
                    }
                }

                if (dto.MetodoPagamento == "carta" || dto.MetodoPagamento == "misto" || dto.MetodoPagamento == "paypal")
                {
                    var stripeResult = await service.CreateStripeCheckoutCartAsync(userId, dto);
                    return Results.Ok(stripeResult);
                }

                // For credito, reduce first item's amount by the discount
                var allCards = new List<GiftCardDTO>();
                decimal totaleSpeso = 0;
                var first = true;
                foreach (var item in dto.Items)
                {
                    var importo = item.Importo;
                    if (first && sconto > 0)
                    {
                        var scontoSuQuesto = Math.Min(sconto, importo * item.Quantita);
                        importo = Math.Max(0, importo - (scontoSuQuesto / item.Quantita));
                        sconto -= scontoSuQuesto;
                        first = false;
                    }
                    var single = new GiftCardAcquistoRequestDTO
                    {
                        Importo = importo,
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

    /// <summary>
    /// Validates and applies a discount code from MerchDiscountCodes, Promotions, or NewsletterSubscribers.
    /// Returns the discount amount, or -1 if invalid.
    /// </summary>
    private static async Task<decimal> ApplicaScontoAsync(FilmDbContext db, string codice, decimal totale)
    {
        var code = codice.Trim().ToUpper();
        
        // Check MerchDiscountCodes
        var disc = await db.MerchDiscountCodes
            .FirstOrDefaultAsync(d => d.Codice == code && d.Attivo
                && (!d.ScadeIl.HasValue || d.ScadeIl.Value > DateTime.UtcNow)
                && d.Utilizzi < d.MaxUtilizzi);
        if (disc != null)
        {
            decimal sconto = 0;
            if (disc.PercentualeSconto > 0)
            {
                sconto = Math.Round(totale * disc.PercentualeSconto / 100m, 2);
                if (disc.ValoreScontoFisso > 0) sconto = Math.Min(sconto, disc.ValoreScontoFisso);
            }
            else if (disc.ValoreScontoFisso > 0)
                sconto = Math.Min(disc.ValoreScontoFisso, totale);
            disc.Utilizzi++;
            await db.SaveChangesAsync();
            return sconto;
        }

        // Check Promotions
        var promo = await db.Promotions
            .FirstOrDefaultAsync(p => p.DiscountCode == code && p.Active
                && (p.StartDate == null || p.StartDate <= DateTime.UtcNow)
                && (p.EndDate == null || p.EndDate >= DateTime.UtcNow));
        if (promo != null && promo.DiscountPercent.HasValue)
        {
            if (promo.MaxUsage.HasValue && promo.UsageCount >= promo.MaxUsage.Value)
                return -1;
            promo.UsageCount++;
            await db.SaveChangesAsync();
            return Math.Round(totale * promo.DiscountPercent.Value / 100m, 2);
        }

        // Check NewsletterSubscribers
        var sub = await db.NewsletterSubscribers
            .FirstOrDefaultAsync(s => s.CodiceSconto == code && !s.ScontoUsato);
        if (sub != null)
        {
            sub.ScontoUsato = true;
            await db.SaveChangesAsync();
            return Math.Round(totale * 15m / 100m, 2);
        }

        return -1; // invalid
    
    }
}
