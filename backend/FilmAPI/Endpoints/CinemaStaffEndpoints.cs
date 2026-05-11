using FilmAPI.Model;
using FilmAPI.Services;
using System.Security.Claims;

namespace FilmAPI.Endpoints;
public static class CinemaStaffEndpoints
{
    public static void MapCinemaStaffEndpoints(this WebApplication app)
    {
        var staffGroup = app.MapGroup("/staff").RequireAuthorization("Authenticated");
        staffGroup.MapGet("/me/cinemas", async (ClaimsPrincipal user, ICinemaAccessService service) => {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            return Results.Ok(await service.GetAssignmentsAsync(userId));
        });

        var adminGroup = app.MapGroup("/admin/staff").RequireAuthorization("AdminOnly");
        adminGroup.MapPost("/{userId:int}/assign", async (int userId, UserCinemaAssignment dto, ClaimsPrincipal user, ICinemaAccessService service) => {
            var adminId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var result = await service.AddAssignmentAsync(userId, dto.CinemaId, adminId);
            return Results.Ok(result);
        });
        adminGroup.MapPut("/assignments/{id:int}", async (int id, UserCinemaAssignment dto, ICinemaAccessService service) => {
            await service.UpdateAssignmentAsync(id, dto.CanValidateTickets, dto.CanTopUpCredit, dto.CanManageShows, dto.IsActive);
            return Results.Ok();
        });
        adminGroup.MapDelete("/assignments/{id:int}", async (int id, ClaimsPrincipal user, ICinemaAccessService service) => {
            var adminId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            await service.RevokeAssignmentAsync(id, adminId);
            return Results.Ok();
        });
    }
}
