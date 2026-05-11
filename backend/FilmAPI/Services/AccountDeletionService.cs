using FilmAPI.Data;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IAccountDeletionService
{
    Task<object> ExportUserDataAsync(int userId);
    Task AnonymizeUserAsync(int userId, int? adminUserId = null);
    Task ToggleDisableAsync(int userId);
}

public class AccountDeletionService : IAccountDeletionService
{
    private readonly FilmDbContext _db;

    public AccountDeletionService(FilmDbContext db) => _db = db;

    public async Task<object> ExportUserDataAsync(int userId)
    {
        var user = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.Id, u.Email, u.Nome, u.Cognome, u.Telefono,
                Ruolo = u.Ruolo.ToString(), u.DataRegistrazione,
                u.CreditoResiduo, u.CinemaPreferitoId,
                u.LocalCredentialsEnabled, u.IsDisabled,
                u.AnonymizedAtUtc, u.LastLoginAtUtc, u.LastLoginProvider
            })
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Utente non trovato.");

        var ordini = await _db.Ordini
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Select(o => new
            {
                o.Id, o.CodiceOrdine, o.NumeroBiglietti,
                o.TotaleLordo, o.ImportoCredito, o.ImportoCarta,
                Stato = o.Stato.ToString(), o.CreatedAtUtc, o.PaidAtUtc,
                o.FilmId, o.CinemaId, o.SalaId
            })
            .ToListAsync();

        var biglietti = await _db.Biglietti
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.Id)
            .Select(b => new
            {
                b.Id, b.CodiceBiglietto, b.ShowId, b.SalaPostoId,
                b.PrezzoBase, b.Supplemento, b.PrezzoTotale,
                Stato = b.Stato.ToString(), b.ValidatoAtUtc
            })
            .ToListAsync();

        var movimentiCredito = await _db.MovimentiCredito
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.CreatedAtUtc)
            .Select(m => new
            {
                m.Id, m.Importo, m.SaldoPre, m.SaldoPost,
                Tipo = m.Tipo.ToString(), m.CreatedAtUtc, m.Note
            })
            .ToListAsync();

        return new { user, ordini, biglietti, movimentiCredito };
    }

    public async Task AnonymizeUserAsync(int userId, int? adminUserId = null)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Utente non trovato.");

        if (user.AnonymizedAtUtc.HasValue)
            throw new InvalidOperationException("L'account è già stato anonimizzato.");

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        user.Email = $"deleted_{timestamp}@anon.invalid";
        user.Nome = "Account";
        user.Cognome = "Anonimizzato";
        user.Telefono = null;
        user.PasswordHash = "ANONYMIZED";
        user.LocalCredentialsEnabled = false;
        user.AnonymizedAtUtc = DateTime.UtcNow;
        user.IsDisabled = true;
        user.LastLoginProvider = null;

        _db.RefreshTokens.RemoveRange(
            _db.RefreshTokens.Where(rt => rt.UserId == userId));

        await _db.SaveChangesAsync();
    }

    public async Task ToggleDisableAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Utente non trovato.");

        user.IsDisabled = !user.IsDisabled;

        if (user.IsDisabled)
        {
            _db.RefreshTokens.RemoveRange(
                _db.RefreshTokens.Where(rt => rt.UserId == userId));
        }

        await _db.SaveChangesAsync();
    }
}
