using FilmAPI.DTO;
using FilmAPI.Services;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class ShowCancellationEndpoints
{
    public static void MapShowCancellationEndpoints(this WebApplication app)
    {
        var adminGroup = app.MapGroup("/admin/shows").RequireAuthorization("PowerUserOrAdmin");

        adminGroup.MapGet("/{showId:int}/cancel/preview", async (int showId, IShowCancellationService service) =>
        {
            try
            {
                var result = await service.PreviewCancellationAsync(showId);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        adminGroup.MapPost("/{showId:int}/cancel", async (int showId, CancelShowDTO dto, ClaimsPrincipal user, IShowCancellationService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            try
            {
                var result = await service.CancelShowAsync(showId, userId, dto.Reason);
                return Results.Ok(new { message = "Show cancellato. Rimborsi in elaborazione.", cancellationId = result.Id });
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        var cancelGroup = app.MapGroup("/admin/cancellations").RequireAuthorization("PowerUserOrAdmin");

        cancelGroup.MapPost("/{id:int}/process-refunds", async (int id, IShowCancellationService service) =>
        {
            await service.ProcessRefundsAsync(id);
            return Results.Ok(new { message = "Rimborsi processati." });
        });

        cancelGroup.MapPost("/{id:int}/retry-refunds", async (int id, IShowCancellationService service) =>
        {
            await service.RetryFailedRefundsAsync(id);
            return Results.Ok(new { message = "Riprova rimborsi avviata." });
        });

        cancelGroup.MapPost("/{id:int}/send-emails", async (int id, IShowCancellationService service) =>
        {
            await service.SendCancellationEmailsAsync(id);
            return Results.Ok(new { message = "Email inviate." });
        });
    }
}

public class CancelShowDTO
{
    public string? Reason { get; set; }
}
