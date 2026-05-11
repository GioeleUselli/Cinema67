using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FilmAPI.Model;
using FilmAPI.Services;
using FilmAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Endpoints;

public static class AccountEndpoints
{
    public static void MapAccountEndpoints(this WebApplication app)
    {
        app.MapPost("/auth/me/export", async (HttpContext context, IAccountDeletionService service) =>
        {
            var userId = GetUserIdFromContext(context);
            if (userId == null) return Results.Unauthorized();

            try
            {
                var data = await service.ExportUserDataAsync(userId.Value);
                return Results.Ok(data);
            }
            catch (InvalidOperationException ex)
            {
                return Results.NotFound(new { message = ex.Message });
            }
        }).RequireAuthorization("Authenticated");

        app.MapPost("/auth/me/delete", async (HttpContext context, IAccountDeletionService service) =>
        {
            var userId = GetUserIdFromContext(context);
            if (userId == null) return Results.Unauthorized();

            try
            {
                await service.AnonymizeUserAsync(userId.Value);
                return Results.Ok(new { message = "Account anonimizzato con successo." });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }).RequireAuthorization("Authenticated");

        app.MapDelete("/admin/utenti/{id}", async (int id, HttpContext context, IAccountDeletionService service, FilmDbContext db) =>
        {
            var requestingUserId = GetUserIdFromContext(context);
            if (requestingUserId == null) return Results.Unauthorized();

            var targetUser = await db.Users.FindAsync(id);
            if (targetUser is null) return Results.NotFound(new { message = "Utente non trovato." });

            if (targetUser.Ruolo == UserRole.Admin)
            {
                var adminCount = await db.Users.CountAsync(u => u.Ruolo == UserRole.Admin && !u.IsDisabled);
                if (adminCount <= 1)
                    return Results.BadRequest(new { message = "Non è possibile eliminare l'ultimo admin attivo." });
            }

            if (requestingUserId.Value == id)
            {
                var adminCount = await db.Users.CountAsync(u => u.Ruolo == UserRole.Admin && !u.IsDisabled);
                if (adminCount <= 1)
                    return Results.BadRequest(new { message = "Non puoi eliminare il tuo account in quanto unico admin." });
            }

            try
            {
                await service.AnonymizeUserAsync(id, requestingUserId);
                return Results.Ok(new { message = "Utente anonimizzato con successo." });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }).RequireAuthorization("AdminOnly");

        app.MapPost("/admin/utenti/{id}/toggle-disable", async (int id, IAccountDeletionService service, FilmDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound(new { message = "Utente non trovato." });

            if (user.Ruolo == UserRole.Admin && !user.IsDisabled)
            {
                var adminCount = await db.Users.CountAsync(u => u.Ruolo == UserRole.Admin && !u.IsDisabled);
                if (adminCount <= 1)
                    return Results.BadRequest(new { message = "Non è possibile disabilitare l'ultimo admin attivo." });
            }

            try
            {
                await service.ToggleDisableAsync(id);
                return Results.Ok(new { message = user.IsDisabled ? "Utente riabilitato." : "Utente disabilitato." });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }).RequireAuthorization("AdminOnly");
    }

    private static int? GetUserIdFromContext(HttpContext context)
    {
        var userIdClaim = context.User.FindFirst("sub")?.Value
            ?? context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return null;

        return userId;
    }
}
