using FilmAPI.DTO;
using FilmAPI.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class SupportEndpoints
{
    public static void MapSupportEndpoints(this WebApplication app)
    {
        var userGroup = app.MapGroup("/support").RequireAuthorization("Authenticated");

        userGroup.MapGet("/conversation", async (ClaimsPrincipal user, ISupportService service) =>
        {
            var userId = GetUserId(user);
            if (userId == 0) return Results.Unauthorized();

            var result = await service.GetOrCreateConversationAsync(userId);
            return Results.Ok(result);
        });

        userGroup.MapPost("/chat", async (ClaimsPrincipal user, SupportChatMessageRequestDTO dto, ISupportService service) =>
        {
            var userId = GetUserId(user);
            if (userId == 0) return Results.Unauthorized();

            try
            {
                var result = await service.SendUserMessageAsync(userId, dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(ex.Message);
            }
        });

        userGroup.MapPost("/tickets", async (ClaimsPrincipal user, SupportEscalateRequestDTO dto, ISupportService service) =>
        {
            var userId = GetUserId(user);
            if (userId == 0) return Results.Unauthorized();

            try
            {
                var result = await service.EscalateToTicketAsync(userId, dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(ex.Message);
            }
        });

        userGroup.MapDelete("/conversation", async (ClaimsPrincipal user, ISupportService service) =>
        {
            var userId = GetUserId(user);
            if (userId == 0) return Results.Unauthorized();
            await service.ResetConversationAsync(userId);
            return Results.Ok(new { message = "Conversazione resettata." });
        });

        var adminGroup = app.MapGroup("/admin/support").RequireAuthorization("CinemaStaffOrPowerUserOrAdmin");

        adminGroup.MapGet("/tickets", async (
            [FromQuery] string? status,
            [FromQuery] string? priority,
            [FromQuery] string? search,
            [FromQuery] int page,
            [FromQuery] int pageSize,
            ISupportService service) =>
        {
            var result = await service.GetAdminTicketsAsync(status, priority, search, page, pageSize);
            return Results.Ok(result);
        });

        adminGroup.MapGet("/tickets/{ticketId:int}", async (int ticketId, ISupportService service) =>
        {
            var result = await service.GetAdminTicketByIdAsync(ticketId);
            return result is null ? Results.NotFound() : Results.Ok(result);
        });

        adminGroup.MapPut("/tickets/{ticketId:int}", async (
            int ticketId,
            ClaimsPrincipal user,
            SupportAdminUpdateTicketRequestDTO dto,
            ISupportService service) =>
        {
            var adminUserId = GetUserId(user);
            if (adminUserId == 0) return Results.Unauthorized();

            try
            {
                var result = await service.AdminUpdateTicketAsync(ticketId, adminUserId, dto);
                return result is null ? Results.NotFound() : Results.Ok(result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(ex.Message);
            }
        });

        adminGroup.MapGet("/admins", async (IUserAdminService users) =>
        {
            var all = await users.GetAllUsersAsync();
            var admins = all
                .Where(u => string.Equals(u.Ruolo, "Admin", StringComparison.OrdinalIgnoreCase)
                         || string.Equals(u.Ruolo, "PowerUser", StringComparison.OrdinalIgnoreCase))
                .OrderBy(u => u.Nome)
                .ThenBy(u => u.Cognome)
                .ToList();

            return Results.Ok(admins);
        });
    }

    private static int GetUserId(ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : 0;
    }
}
