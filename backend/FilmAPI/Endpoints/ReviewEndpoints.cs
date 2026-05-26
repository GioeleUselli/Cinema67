using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.HttpResults;

namespace FilmAPI.Endpoints;

public static class ReviewEndpoints
{
    public static void MapReviewEndpoints(this WebApplication app)
    {
        var reviews = app.MapGroup("/reviews");

        // Public - get reviews for a film (approved + TMDB)
        reviews.MapGet("/film/{filmId}", async (
            int filmId,
            IReviewService reviewSvc,
            ITmdbService tmdbSvc,
            FilmDbContext db) =>
        {
            var userReviews = await reviewSvc.GetByFilmIdAsync(filmId);

            var tmdbId = await db.Films
                .Where(f => f.Id == filmId)
                .Select(f => f.TmdbId)
                .FirstOrDefaultAsync();

            List<TmdbReviewDTO> tmdbReviews = new();
            if (tmdbId.HasValue)
            {
                tmdbReviews = await tmdbSvc.GetMovieReviewsAsync(tmdbId.Value);
            }

            return Results.Ok(new
            {
                recensioni = userReviews,
                recensioniTmdb = tmdbReviews
            });
        }).AllowAnonymous();

        // Auth - create review
        reviews.MapPost("/film/{filmId}", async (
            int filmId,
            RecensioneCreateDTO dto,
            IReviewService reviewSvc,
            HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == null) return Results.Unauthorized();

            if (dto.Voto < 1 || dto.Voto > 10)
                return Results.BadRequest(new { message = "Il voto deve essere tra 1 e 10." });

            if (string.IsNullOrWhiteSpace(dto.Testo) || dto.Testo.Length > 2000)
                return Results.BadRequest(new { message = "Il testo della recensione non è valido." });

            try
            {
                var result = await reviewSvc.CreateAsync(filmId, userId.Value, dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        });

        // Admin - get pending reviews
        reviews.MapGet("/admin/pending", async (IReviewService reviewSvc, HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == null) return Results.Unauthorized();

            var isAdmin = IsPowerUserOrAdmin(ctx);
            if (!isAdmin) return Results.Forbid();

            var pending = await reviewSvc.GetPendingAsync();
            return Results.Ok(pending);
        }).RequireAuthorization("StaffOrPowerUserOrAdmin");

        // Admin - approve review
        reviews.MapPut("/admin/{id}/approve", async (
            int id,
            IReviewService reviewSvc,
            HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == null) return Results.Unauthorized();

            var isAdmin = IsPowerUserOrAdmin(ctx);
            if (!isAdmin) return Results.Forbid();

            try
            {
                await reviewSvc.ApproveAsync(id, userId.Value);
                return Results.Ok(new { message = "Recensione approvata." });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }).RequireAuthorization("StaffOrPowerUserOrAdmin");

        // Admin - delete review
        reviews.MapDelete("/admin/{id}", async (
            int id,
            IReviewService reviewSvc,
            HttpContext ctx) =>
        {
            var userId = GetUserId(ctx);
            if (userId == null) return Results.Unauthorized();

            var isAdmin = IsPowerUserOrAdmin(ctx);
            if (!isAdmin) return Results.Forbid();

            try
            {
                await reviewSvc.DeleteAsync(id);
                return Results.Ok(new { message = "Recensione eliminata." });
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }).RequireAuthorization("StaffOrPowerUserOrAdmin");
    }

    private static int? GetUserId(HttpContext ctx)
    {
        var sub = ctx.User.FindFirst("sub")?.Value
            ?? ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var uid) ? uid : null;
    }

    private static bool IsPowerUserOrAdmin(HttpContext ctx)
    {
        var role = ctx.User.FindFirst("role")?.Value
            ?? ctx.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        return role is "Admin" or "PowerUser" or "admin" or "poweruser" or "1" or "2";
    }
}
