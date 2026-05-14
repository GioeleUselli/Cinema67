using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FilmAPI.DTO;
using FilmAPI.Services;

namespace FilmAPI.Endpoints;

public static class AdminUtentiEndpoints
{
    public static void MapAdminUtentiEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/admin/utenti").RequireAuthorization("CinemaStaffOrPowerUserOrAdmin");

        group.MapGet("", async (string? search, string? role, int? page, int? pageSize, IUserAdminService service) =>
        {
            var pg = Math.Max(1, page ?? 1);
            var ps = Math.Min(100, Math.Max(1, pageSize ?? 25));
            var result = await service.GetUsersPagedAsync(search, role, pg, ps);
            return Results.Ok(result);
        });

        group.MapPut("/{id}/ruolo", async (int id, UpdateRuoloDTO dto, HttpContext context, IUserAdminService service) =>
        {
            var requestingUserId = GetUserIdFromContext(context);
            if (requestingUserId == null) return Results.Unauthorized();

            try
            {
                var result = await service.UpdateUserRoleAsync(id, dto, requestingUserId.Value);
                return result is null ? Results.NotFound() : Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(ex.Message);
            }
        }).RequireAuthorization("AdminOnly");

        group.MapPost("", async (CreateUserDTO dto, IUserAdminService service) =>
        {
            try
            {
                var result = await service.CreateUserAsync(dto);
                return Results.Created($"/admin/utenti/{result.Id}", result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.Conflict(new { message = ex.Message }); }
        }).RequireAuthorization("AdminOnly");

        group.MapPut("/{id}/cinema", async (int id, UpdateUserCinemaDTO dto, IUserAdminService service) =>
        {
            try
            {
                var result = await service.UpdateUserCinemaAsync(id, dto.CinemaId);
                return result is null ? Results.NotFound() : Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        }).RequireAuthorization("AdminOnly");
    }

    private static int? GetUserIdFromContext(HttpContext context)
    {
        var userIdClaim = context.User.FindFirst("sub")?.Value
            ?? context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        return userId;
    }
}
