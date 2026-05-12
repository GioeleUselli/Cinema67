using FilmAPI.DTO;
using FilmAPI.Data;
using FilmAPI.Model;
using FilmAPI.Services;
using Microsoft.EntityFrameworkCore;
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

        // Data endpoints for admin UI
        cancelGroup.MapGet("/list", async (FilmDbContext db) =>
        {
            var list = await db.ShowCancellations.OrderByDescending(c => c.CreatedAtUtc).Take(50).Select(c => new {
                c.Id, c.ShowId, c.CancelledAtUtc, c.Reason, c.Status, c.TotaleDaRimborsare,
                c.OrdiniTotali, c.RimborsiRiusciti, c.RimborsiFalliti, c.EmailsInviate
            }).ToListAsync();
            return Results.Ok(list);
        });

        cancelGroup.MapGet("/refunds", async (FilmDbContext db) =>
        {
            var list = await db.OrdineRefunds.OrderByDescending(r => r.CreatedAtUtc).Take(100).Select(r => new {
                r.Id, r.OrdineId, r.ShowCancellationId, r.ImportoCarta, r.ImportoCredito,
                r.StripeRefundId, r.Status, r.ErrorMessage, r.CompletedAtUtc
            }).ToListAsync();
            return Results.Ok(list);
        });

        cancelGroup.MapGet("/manual-reviews", async (FilmDbContext db) =>
        {
            var list = await db.ManualRefundReviews.Where(m => m.Resolution == null).OrderByDescending(m => m.CreatedAtUtc).Select(m => new {
                m.Id, m.OrdineId, m.ShowCancellationId, m.ReasonCode, m.Importo, m.Details, m.Resolution
            }).ToListAsync();
            return Results.Ok(list);
        });

        cancelGroup.MapPost("/manual-refund", async (ManualRefundDTO dto, IShowCancellationService service) =>
        {
            try
            {
                await service.ManualRefundAsync(dto.OrdineId, dto.Reason);
                return Results.Ok(new { message = "Rimborso manuale completato." });
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });
        cancelGroup.MapPost("/manual-reviews/{id:int}/resolve", async (int id, ResolveReviewDTO dto, FilmDbContext db) =>
        {
            var review = await db.ManualRefundReviews.FindAsync(id);
            if (review == null) return Results.NotFound();
            if (!Enum.TryParse<ManualReviewResolution>(dto.Resolution, true, out var res)) return Results.BadRequest();
            review.Resolution = res;
            review.ResolvedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok();
        });
    }
}

public class CancelShowDTO
{
    public string? Reason { get; set; }
}

public class ResolveReviewDTO
{
    public string Resolution { get; set; } = string.Empty;
}

public class ManualRefundDTO
{
    public int OrdineId { get; set; }
    public string? Reason { get; set; }
}
