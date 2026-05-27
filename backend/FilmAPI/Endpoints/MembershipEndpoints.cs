using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using FilmAPI.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class MembershipEndpoints
{
    public static void MapMembershipEndpoints(this WebApplication app)
    {
        var authGroup = app.MapGroup("/membership").RequireAuthorization("Authenticated");

        authGroup.MapGet("/card", async (ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            var result = await service.GetOrCreateCardAsync(userId);
            return Results.Ok(result);
        });

        authGroup.MapGet("/punti", async (ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            var result = await service.GetPuntiStoricoAsync(userId);
            return Results.Ok(result);
        });

        authGroup.MapPost("/attiva", async (ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                var result = await service.AttivaAbbonamentoAsync(userId, "credito");
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPost("/stripe-checkout", async (ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                var result = await service.CreateStripeCheckoutMembershipAsync(userId);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPost("/paypal-checkout", async (ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try { return Results.Ok(await service.CreatePayPalCheckoutMembershipAsync(userId)); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPost("/paypal-confirm", async (ClaimsPrincipal user, IMembershipService service, IPayPalGateway paypal, FilmDbContext db) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var pending = await db.GiftCards.FirstOrDefaultAsync(g => g.AcquirenteUserId == userId && g.Note!.StartsWith("MEMBERSHIP|PAYPAL:") && g.Stato == GiftCardStato.Disattivata);
            if (pending is null) return Results.NotFound();
            var ppId = pending.Note!.Split(":")[2];
            try
            {
                var capture = await paypal.CaptureOrderAsync(ppId);
                if (capture.Status != "COMPLETED") return Results.BadRequest(new { message = "PayPal non completato" });
                db.GiftCards.Remove(pending);
                await db.SaveChangesAsync();
                return Results.Ok(await service.AttivaAbbonamentoAsync(userId));
            }
            catch (Exception ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPost("/conferma-stripe", async (ConfermaStripeDTO dto, ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                var result = await service.ConfermaStripeMembershipAsync(userId, dto.SessionId);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapPut("/profile", async (MembershipUpdateDTO dto, ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            var result = await service.UpdateProfileAsync(userId, dto);
            return Results.Ok(result);
        });

        var adminGroup = app.MapGroup("/admin/membership").RequireAuthorization("PowerUserOrAdmin");

        adminGroup.MapGet("/cards", async (IMembershipService service) =>
        {
            var result = await service.GetAllCardsAsync();
            return Results.Ok(result);
        });

        adminGroup.MapPost("/{userId:int}/toggle", async (int userId, IMembershipService service) =>
        {
            var result = await service.ToggleAttivazioneAsync(userId);
            return Results.Ok(result);
        });

        adminGroup.MapPost("/processa-compleanni", async (IMembershipService service) =>
        {
            await service.ProcessaCompleanniAsync(soloOggi: false);
            return Results.Ok(new { message = "Email compleanno processate." });
        });

        adminGroup.MapPost("/processa-festivita", async (ProcessaFestivitaDTO dto, IMembershipService service) =>
        {
            await service.ProcessaFestivitaAsync(dto.NomeFesta, dto.PercentualeSconto);
            return Results.Ok(new { message = $"Email {dto.NomeFesta} inviate a tutti i membri attivi." });
        });

        adminGroup.MapPost("/processa-festivita-auto", async (IMembershipService service) =>
        {
            await service.ProcessaFestivitaAutomaticheAsync();
            return Results.Ok(new { message = "Festività automatiche processate." });
        });

        adminGroup.MapGet("/campaigns", async (IMembershipService service) =>
        {
            var result = await service.GetCampaignsAsync();
            return Results.Ok(result);
        });

        adminGroup.MapPut("/campaigns/{id:int}", async (int id, CampaignConfig dto, IMembershipService service) =>
        {
            var result = await service.UpdateCampaignAsync(id, dto);
            return Results.Ok(result);
        });

        adminGroup.MapPost("/campaigns", async (CampaignConfig dto, IMembershipService service) =>
        {
            var result = await service.AddCampaignAsync(dto);
            return Results.Created($"/admin/membership/campaigns/{result.Id}", result);
        });

        adminGroup.MapDelete("/campaigns/{id:int}", async (int id, IMembershipService service) =>
        {
            await service.DeleteCampaignAsync(id);
            return Results.Ok();
        });

        adminGroup.MapGet("/compleanni-oggi", async (IMembershipService service) =>
        {
            var result = await service.GetCompleanniOggiAsync();
            return Results.Ok(result);
        });

        // Admin CRUD premi
        adminGroup.MapGet("/premi", async (IMembershipService service) =>
        {
            var result = await service.GetAllPremiAdminAsync();
            return Results.Ok(result);
        });

        adminGroup.MapPost("/premi", async (CreatePremioDTO dto, IMembershipService service) =>
        {
            try
            {
                var result = await service.CreatePremioAsync(dto);
                return Results.Created($"/admin/membership/premi/{result.Id}", result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        adminGroup.MapPut("/premi/{id:int}", async (int id, UpdatePremioDTO dto, IMembershipService service) =>
        {
            try
            {
                var result = await service.UpdatePremioAsync(id, dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        adminGroup.MapDelete("/premi/{id:int}", async (int id, IMembershipService service) =>
        {
            try
            {
                await service.DeletePremioAsync(id);
                return Results.Ok(new { message = "Premio eliminato." });
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        // Cassa fisica — scansione carta fedeltà per accumulo punti
        adminGroup.MapPost("/scan-acquisto", async (ScanAcquistoDTO dto, IMembershipService service) =>
        {
            try
            {
                var result = await service.ScanAcquistoCassaAsync(dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapGet("/premi", async (ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var result = await service.GetPremiDisponibiliAsync(userId);
            return Results.Ok(result);
        });

        authGroup.MapPost("/premi/{premioId:int}/riscatta", async (
            int premioId,
            ClaimsPrincipal user,
            IMembershipService service,
            HttpContext ctx) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            string? taglia = null;
            try
            {
                var body = await ctx.Request.ReadFromJsonAsync<Dictionary<string, string>>();
                taglia = body?.GetValueOrDefault("taglia");
            }
            catch { /* body opzionale */ }
            try
            {
                var result = await service.RiscattaPremioAsync(userId, premioId, taglia);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (Exception ex) { return Results.BadRequest(new { message = ex.InnerException?.Message ?? ex.Message }); }
        });

        authGroup.MapPost("/premi/completa-merch", async (CompletaMerchPremioDTO dto, ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                var result = await service.CompletaMerchPremioAsync(userId, dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapGet("/premi/valida-voucher", async (string codice, FilmDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(codice)) return Results.BadRequest(new { message = "Codice mancante." });
            var vc = codice.Trim().ToUpper();
            var riscatto = await db.PremiRiscatti.Include(r => r.Premio)
                .FirstOrDefaultAsync(r => r.CodiceVoucher == vc && r.Stato == Model.StatoRiscatto.Attivo
                    && (!r.DataScadenza.HasValue || r.DataScadenza.Value > DateTime.UtcNow));
            if (riscatto?.Premio == null)
                return Results.Ok(new { valido = false, message = "Voucher non valido o già usato." });
            return Results.Ok(new
            {
                valido = true,
                tipo = riscatto.Premio.Tipo.ToString(),
                codice = riscatto.CodiceVoucher,
                message = riscatto.Premio.Tipo == TipoPremio.Biglietto
                    ? "Voucher biglietto valido! Verrà rimosso il biglietto meno costoso."
                    : riscatto.Premio.Tipo == TipoPremio.Food
                        ? "Voucher cibo/bevanda valido! Verrà rimosso l'articolo meno costoso."
                        : "Voucher valido!"
            });
        }).AllowAnonymous();

        authGroup.MapGet("/riscatti", async (ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            var result = await service.GetMieiRiscattiAsync(userId);
            return Results.Ok(result);
        });
    }
}
