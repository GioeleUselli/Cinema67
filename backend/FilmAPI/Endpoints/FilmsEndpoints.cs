using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Endpoints;

public static class FilmsEndpoints
{
    public static void MapFilmsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/films");

        // TMDB endpoints (must come before /{id} to avoid route ambiguity)
        group.MapGet("/tmdb/search", async (string query, ITmdbService tmdbService) =>
        {
            if (string.IsNullOrWhiteSpace(query))
                return Results.BadRequest("Query is required");

            var results = await tmdbService.SearchFilmsAsync(query);
            return Results.Ok(results);
        }).AllowAnonymous();

        group.MapGet("/tmdb/{tmdbId}", async (int tmdbId, ITmdbService tmdbService) =>
        {
            var detail = await tmdbService.GetFilmDetailAsync(tmdbId);
            if (detail is null)
                return Results.NotFound();

            return Results.Ok(detail);
        }).AllowAnonymous();

        group.MapPost("/tmdb/import", async (TmdbImportDTO dto, ITmdbService tmdbService, IFilmService filmService, FilmDbContext context) =>
        {
            try
            {
                // Get TMDB film details
                var tmdbFilm = await tmdbService.GetFilmDetailAsync(dto.TmdbId);
                if (tmdbFilm is null)
                    return Results.BadRequest("Film not found on TMDB");

                // Check if director exists, otherwise create it
                var director = await context.Registi.FirstOrDefaultAsync(r => r.Nome == tmdbFilm.DirectorName || r.Cognome == tmdbFilm.DirectorName);
                int registaId = dto.RegistaId;

                if (registaId <= 0)
                {
                    if (director is null && !string.IsNullOrWhiteSpace(tmdbFilm.DirectorName))
                    {
                        director = new FilmAPI.Model.Regista
                        {
                            Nome = tmdbFilm.DirectorName,
                            Cognome = string.Empty
                        };
                        context.Registi.Add(director);
                        await context.SaveChangesAsync();
                        registaId = director.Id;
                    }
                    else
                    {
                        registaId = dto.RegistaId;
                    }
                }

                // Prepare film data
                var releaseDate = !string.IsNullOrWhiteSpace(tmdbFilm.ReleaseDate) && DateTime.TryParse(tmdbFilm.ReleaseDate, out var parsedDate) 
                    ? parsedDate 
                    : DateTime.Now;

                var filmDto = new FilmCreateDTO
                {
                    Titolo = tmdbFilm.Title ?? $"TMDB Film {dto.TmdbId}",
                    DataProduzione = releaseDate,
                    RegistaId = registaId,
                    Durata = tmdbFilm.Runtime,
                    DescrizioneLunga = tmdbFilm.Overview,
                    CastText = string.Join(", ", tmdbFilm.Cast),
                    CopertinaPath = !string.IsNullOrWhiteSpace(tmdbFilm.PosterPath) ? $"https://image.tmdb.org/t/p/w342{tmdbFilm.PosterPath}" : null,
                    DataRilascio = dto.Posizione == "nuove-uscite" ? dto.DataRilascio : null,
                    CategorieIds = dto.CategorieIds ?? new List<int>()
                };

                var result = await filmService.CreateAsync(filmDto);

                // Update TmdbId
                var film = await context.Films.FindAsync(result.Id);
                if (film is not null)
                {
                    film.TmdbId = dto.TmdbId;
                    await context.SaveChangesAsync();
                }

                return Results.Created($"/films/{result.Id}", result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error importing TMDB film: {ex.Message}");
                return Results.BadRequest($"Errore durante l'importazione: {ex.Message}");
            }
        }).RequireAuthorization("PowerUserOrAdmin");

        // Regular film endpoints (after TMDB routes)
        group.MapGet("", async (int? page, int? pageSize, string? search, IFilmService service) =>
        {
            if (!page.HasValue && !pageSize.HasValue && string.IsNullOrWhiteSpace(search))
            {
                return Results.Ok(await service.GetAllAsync());
            }

            var result = await service.GetPagedAsync(page ?? 1, pageSize ?? 10, search);
            return Results.Ok(result);
        }).AllowAnonymous();

        group.MapGet("/{id}", async (int id, IFilmService service) =>
        {
            var result = await service.GetByIdAsync(id);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).AllowAnonymous();

        group.MapPost("", async (FilmCreateDTO dto, IFilmService service) =>
        {
            try
            {
                var result = await service.CreateAsync(dto);
                return Results.Created($"/films/{result.Id}", result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(ex.Message);
            }
        }).RequireAuthorization("PowerUserOrAdmin");

        group.MapPut("/{id}", async (int id, FilmUpdateDTO dto, IFilmService service) =>
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
        }).RequireAuthorization("PowerUserOrAdmin");

        group.MapDelete("/{id}", async (int id, IFilmService service) =>
        {
            var result = await service.DeleteAsync(id);
            return result ? Results.NoContent() : Results.NotFound();
        }).RequireAuthorization("PowerUserOrAdmin");
    }
}
