using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public class ProfiloService : IProfiloService
{
    private readonly FilmDbContext _context;

    public ProfiloService(FilmDbContext context)
    {
        _context = context;
    }

    public async Task<UserInfoDTO?> GetProfiloAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user is null) return null;

        return MapToUserInfoDTO(user);
    }

    public async Task<UserInfoDTO?> UpdateProfiloAsync(int userId, ProfiloUpdateDTO dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user is null) return null;

        user.Nome = dto.Nome;
        user.Cognome = dto.Cognome;
        user.Telefono = dto.Telefono;

        await _context.SaveChangesAsync();

        return MapToUserInfoDTO(user);
    }

    public async Task<CinemaPreferitoDTO?> GetCinemaPreferitoAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.CinemaPreferito)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null) return null;

        if (user.CinemaPreferito is null)
        {
            return new CinemaPreferitoDTO { CinemaId = null, Cinema = null };
        }

        return new CinemaPreferitoDTO
        {
            CinemaId = user.CinemaPreferitoId,
            Cinema = new CinemaSintesiDTO
            {
                Id = user.CinemaPreferito.Id,
                Nome = user.CinemaPreferito.Nome,
                Citta = user.CinemaPreferito.Citta,
                Indirizzo = user.CinemaPreferito.Indirizzo,
                Telefono = user.CinemaPreferito.Telefono,
                CodiceLocale = user.CinemaPreferito.CodiceLocale
            }
        };
    }

    public async Task<CinemaPreferitoDTO> SetCinemaPreferitoAsync(int userId, int? cinemaId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user is null) throw new InvalidOperationException("Utente non trovato");

        if (cinemaId.HasValue)
        {
            var cinemaExists = await _context.Cinemas.AnyAsync(c => c.Id == cinemaId.Value);
            if (!cinemaExists) throw new ArgumentException("Cinema non trovato");
        }

        user.CinemaPreferitoId = cinemaId;
        await _context.SaveChangesAsync();

        return await GetCinemaPreferitoAsync(userId) ?? new CinemaPreferitoDTO { CinemaId = null, Cinema = null };
    }

    private static UserInfoDTO MapToUserInfoDTO(User user)
    {
        return new UserInfoDTO
        {
            Id = user.Id,
            Email = user.Email,
            Nome = user.Nome,
            Cognome = user.Cognome,
            Telefono = user.Telefono,
            Ruolo = user.Ruolo.ToString(),
            DataRegistrazione = user.DataRegistrazione
        };
    }

    /// <summary>
    /// Get recommended films based on user's viewing history genres
    /// </summary>
    public async Task<List<FilmDTO>> GetRecommendedFilmsAsync(int userId, int limit = 10)
    {
        // Get user's purchased films' categories
        var userFilmCategories = await _context.Ordini
            .Where(o => o.UserId == userId && o.Stato == OrdineState.Paid)
            .Include(o => o.Film)
            .ThenInclude(f => f.FilmCategorie)
            .ThenInclude(fc => fc.Categoria)
            .Select(o => o.Film)
            .Distinct()
            .SelectMany(f => f.FilmCategorie.Select(fc => fc.CategoriaId))
            .Distinct()
            .ToListAsync();

        // If user has no purchase history, return popular films
        if (!userFilmCategories.Any())
        {
            return await _context.Films
                .Include(f => f.FilmCategorie)
                .ThenInclude(fc => fc.Categoria)
                .Include(f => f.Regista)
                .OrderByDescending(f => f.Proiezioni.Count) // Most upcoming shows
                .Take(limit)
                .Select(f => MapToFilmDTO(f))
                .ToListAsync();
        }

        // Get films with matching categories, excluding already watched films
        var watchedFilmIds = await _context.Ordini
            .Where(o => o.UserId == userId)
            .Select(o => o.FilmId)
            .ToListAsync();

        var recommendedFilms = await _context.Films
            .Where(f => !watchedFilmIds.Contains(f.Id)) // Exclude watched
            .Where(f => f.FilmCategorie.Any(fc => userFilmCategories.Contains(fc.CategoriaId))) // Match categories
            .Include(f => f.FilmCategorie)
            .ThenInclude(fc => fc.Categoria)
            .Include(f => f.Regista)
            .OrderByDescending(f => f.Proiezioni.Where(p => p.Data > DateTime.UtcNow).Count()) // Upcoming shows first
            .Take(limit)
            .Select(f => MapToFilmDTO(f))
            .ToListAsync();

        return recommendedFilms;
    }

    private static FilmDTO MapToFilmDTO(Model.Film film)
    {
        return new FilmDTO
        {
            Id = film.Id,
            Titolo = film.Titolo,
            DataProduzione = film.DataProduzione,
            RegistaId = film.RegistaId,
            RegistaNome = film.Regista?.Nome,
            RegistaCognome = film.Regista?.Cognome,
            Durata = film.Durata,
            CopertinaPath = film.CopertinaPath,
            DescrizioneLunga = film.DescrizioneLunga,
            CastText = film.CastText,
            DataRilascio = film.DataRilascio,
            Categorie = film.FilmCategorie
                .Select(fc => new CategoriaDTO { Id = fc.Categoria.Id, Nome = fc.Categoria.Nome })
                .ToList()
        };
    }
}
