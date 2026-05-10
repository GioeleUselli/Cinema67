using FilmAPI.DTO;
using FilmAPI.Model;
using FilmAPI.Services;
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

        authGroup.MapGet("/premi", async (ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var result = await service.GetPremiDisponibiliAsync(userId);
            return Results.Ok(result);
        });

        authGroup.MapPost("/premi/{premioId:int}/riscatta", async (
            int premioId,
            ClaimsPrincipal user,
            IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                var result = await service.RiscattaPremioAsync(userId, premioId);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapGet("/riscatti", async (ClaimsPrincipal user, IMembershipService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            var result = await service.GetMieiRiscattiAsync(userId);
            return Results.Ok(result);
        });
    }
}
