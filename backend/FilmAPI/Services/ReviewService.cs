using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IReviewService
{
    Task<RecensioneDTO> CreateAsync(int filmId, int userId, RecensioneCreateDTO dto);
    Task<List<RecensioneDTO>> GetByFilmIdAsync(int filmId);
    Task<List<RecensioneAdminDTO>> GetPendingAsync();
    Task ApproveAsync(int reviewId, int adminUserId);
    Task DeleteAsync(int reviewId);
}

public class ReviewService : IReviewService
{
    private readonly FilmDbContext _db;

    public ReviewService(FilmDbContext db)
    {
        _db = db;
    }

    public async Task<RecensioneDTO> CreateAsync(int filmId, int userId, RecensioneCreateDTO dto)
    {
        var filmExists = await _db.Films.AnyAsync(f => f.Id == filmId);
        if (!filmExists) throw new ArgumentException("Film non trovato.");

        var recensione = new Recensione
        {
            FilmId = filmId,
            UserId = userId,
            Voto = dto.Voto,
            Testo = dto.Testo.Trim(),
            Stato = "InAttesa",
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Recensioni.Add(recensione);
        await _db.SaveChangesAsync();

        return new RecensioneDTO
        {
            Id = recensione.Id,
            Voto = recensione.Voto,
            Testo = recensione.Testo,
            UserNome = "In attesa di approvazione",
            CreatedAtUtc = recensione.CreatedAtUtc
        };
    }

    public async Task<List<RecensioneDTO>> GetByFilmIdAsync(int filmId)
    {
        return await _db.Recensioni
            .Include(r => r.User)
            .Where(r => r.FilmId == filmId && r.Stato == "Approvata")
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new RecensioneDTO
            {
                Id = r.Id,
                Voto = r.Voto,
                Testo = r.Testo,
                UserNome = r.User != null ? $"{r.User.Nome} {r.User.Cognome}" : "Anonimo",
                CreatedAtUtc = r.CreatedAtUtc
            })
            .ToListAsync();
    }

    public async Task<List<RecensioneAdminDTO>> GetPendingAsync()
    {
        return await _db.Recensioni
            .Include(r => r.User)
            .Include(r => r.Film)
            .Where(r => r.Stato == "InAttesa")
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new RecensioneAdminDTO
            {
                Id = r.Id,
                FilmId = r.FilmId,
                FilmTitolo = r.Film != null ? r.Film.Titolo : "",
                UserNome = r.User != null ? $"{r.User.Nome} {r.User.Cognome}" : "Anonimo",
                Voto = r.Voto,
                Testo = r.Testo,
                Stato = r.Stato,
                CreatedAtUtc = r.CreatedAtUtc
            })
            .ToListAsync();
    }

    public async Task ApproveAsync(int reviewId, int adminUserId)
    {
        var review = await _db.Recensioni.FindAsync(reviewId)
            ?? throw new ArgumentException("Recensione non trovata.");

        review.Stato = "Approvata";
        review.ApprovataDaUserId = adminUserId;
        review.ApprovataIl = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int reviewId)
    {
        var review = await _db.Recensioni.FindAsync(reviewId)
            ?? throw new ArgumentException("Recensione non trovata.");

        _db.Recensioni.Remove(review);
        await _db.SaveChangesAsync();
    }
}
