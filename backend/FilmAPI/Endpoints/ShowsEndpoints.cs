using FilmAPI.DTO;
using FilmAPI.Data;
using FilmAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Endpoints;

public static class ShowsEndpoints
{
    public static void MapShowsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/shows");

        group.MapGet("", async (
            int? page,
            int? pageSize,
            int? cinemaId,
            int? filmId,
            DateTime? date,
            IShowService service) =>
        {
            if (!page.HasValue && !pageSize.HasValue && !cinemaId.HasValue && !filmId.HasValue && !date.HasValue)
            {
                return Results.Ok(await service.GetAllAsync());
            }

            var result = await service.GetPagedAsync(
                page ?? 1,
                pageSize ?? 10,
                cinemaId,
                filmId,
                date);
            return Results.Ok(result);
        }).AllowAnonymous();

        group.MapGet("/{id}", async (int id, IShowService service) =>
        {
            var result = await service.GetByIdAsync(id);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).AllowAnonymous();

        group.MapPost("", async (ShowCreateDTO dto, IShowService service) =>
        {
            try
            {
                var result = await service.CreateAsync(dto);
                return Results.Created($"/shows/{result.Id}", result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(ex.Message);
            }
        }).RequireAuthorization("PowerUserOrAdmin");

        group.MapPut("/{id}", async (int id, ShowUpdateDTO dto, IShowService service) =>
        {
            try
            {
                var result = await service.UpdateAsync(id, dto);
                return result is null ? Results.NotFound() : Results.Ok(result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(ex.Message);
            }
        }).RequireAuthorization("PowerUserOrAdmin");

        group.MapDelete("/{id}", async (int id, IShowService service) =>
        {
            try
            {
                var result = await service.DeleteAsync(id);
                return result ? Results.NoContent() : Results.NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(ex.Message);
            }
        }).RequireAuthorization("PowerUserOrAdmin");

        group.MapGet("/{showId}/pricing", async (
            int showId,
            [FromServices] FilmDbContext db,
            [FromServices] IPricingService pricingService) =>
        {
            var show = await db.Shows.FirstOrDefaultAsync(s => s.Id == showId);
            if (show == null)
                return Results.NotFound("Show non trovato.");
            var prezzoBase = TicketPriceNormalizer.NormalizeUnitPrice(show.PrezzoBase)
                + TicketPriceNormalizer.NormalizeUnitPrice(show.SupplementoSala);
            var options = pricingService.GetPricingOptions(prezzoBase);
            return Results.Ok(options);
        }).AllowAnonymous();
    }
}
