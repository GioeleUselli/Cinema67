using FilmAPI.DTO;
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
