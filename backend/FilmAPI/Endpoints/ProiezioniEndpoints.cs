using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Endpoints;

public static class ProiezioniEndpoints
{
    public static void MapProiezioniEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/proiezioni");

        group.MapGet("", async (int? page, int? pageSize, string? search, IProiezioneService service) =>
        {
            if (!page.HasValue && !pageSize.HasValue && string.IsNullOrWhiteSpace(search))
            {
                return Results.Ok(await service.GetAllAsync());
            }

            var result = await service.GetPagedAsync(page ?? 1, pageSize ?? 10, search);
            return Results.Ok(result);
        })
            .AllowAnonymous();

        group.MapGet("/{id}", async (int id, IProiezioneService service) =>
        {
            var result = await service.GetByIdAsync(id);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).AllowAnonymous();

        // POST /proiezioni — deprecated: use POST /shows instead
        // PUT /proiezioni/{id} — deprecated: use PUT /shows/{id} instead
        // DELETE /proiezioni/{id} — deprecated: use DELETE /shows/{id} instead
    }
}
