using System.Security.Cryptography;
using System.Text.Json;
using FilmAPI.Data;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IAccountDeletionService
{
    Task<object> ExportUserDataAsync(int userId);
    Task AnonymizeUserAsync(int userId, int? adminUserId = null);
    Task ToggleDisableAsync(int userId);

    Task RequestDataExportAsync(int userId);
    Task<object> ConfirmDataExportAsync(string token);
    Task RequestDeletionAsync(int userId);
    Task ConfirmDeletionAsync(string token);
}

public class AccountDeletionService : IAccountDeletionService
{
    private readonly FilmDbContext _db;
    private readonly IEmailService _email;

    public AccountDeletionService(FilmDbContext db, IEmailService email)
    {
        _db = db;
        _email = email;
    }

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

    public async Task RequestDataExportAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Utente non trovato.");

        var token = GenerateToken();
        var tokenHash = HashToken(token);

        _db.AccountActionTokens.Add(new AccountActionToken
        {
            UserId = userId,
            Purpose = AccountActionTokenPurpose.ExportData,
            TokenHash = tokenHash,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(1),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        var confirmationUrl = $"http://localhost:5001/conferma-export.html?token={token}";
        var htmlBody = $@"
<h2>Richiesta Esportazione Dati</h2>
<p>Ciao {user.Nome},</p>
<p>Hai richiesto l'esportazione dei tuoi dati personali da Cinema67.</p>
<p>Clicca il link qui sotto per confermare e ricevere i tuoi dati:</p>
<p><a href='{confirmationUrl}'>Conferma Esportazione Dati</a></p>
<p>Se non hai richiesto questa operazione, ignora questa email.</p>
<p>Il link scade tra 1 ora.</p>";

        await _email.SendHtmlEmailAsync(user.Email, "Conferma esportazione dati - Cinema67", htmlBody);
    }

    public async Task<object> ConfirmDataExportAsync(string token)
    {
        var tokenHash = HashToken(token);
        var record = await _db.AccountActionTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash
                && t.Purpose == AccountActionTokenPurpose.ExportData
                && t.UsedAtUtc == null
                && t.ExpiresAtUtc > DateTime.UtcNow)
            ?? throw new InvalidOperationException("Token non valido, scaduto o già utilizzato.");

        record.UsedAtUtc = DateTime.UtcNow;

        var user = await _db.Users.FindAsync(record.UserId)
            ?? throw new InvalidOperationException("Utente non trovato.");

        var data = await ExportUserDataAsync(record.UserId);
        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });

        // Send data via email
        var htmlBody = $@"
<h2>I Tuoi Dati - Cinema67</h2>
<p>Ciao {user.Nome},</p>
<p>In allegato trovi l'esportazione completa dei tuoi dati personali in formato JSON.</p>
<pre style='background:#1a1a1a;color:#e0e0e0;padding:16px;border-radius:8px;overflow-x:auto;max-height:400px;font-size:12px'>{System.Net.WebUtility.HtmlEncode(json)}</pre>";

        await _email.SendHtmlEmailAsync(user.Email, "I tuoi dati - Cinema67", htmlBody);
        await _db.SaveChangesAsync();

        return data;
    }

    public async Task RequestDeletionAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("Utente non trovato.");

        if (user.AnonymizedAtUtc.HasValue)
            throw new InvalidOperationException("L'account è già stato anonimizzato.");

        // Revoke any existing pending deletion tokens for this user
        var existingTokens = await _db.AccountActionTokens
            .Where(t => t.UserId == userId
                && t.Purpose == AccountActionTokenPurpose.DeleteAccount
                && t.UsedAtUtc == null)
            .ToListAsync();
        foreach (var t in existingTokens)
            t.UsedAtUtc = DateTime.UtcNow;

        var token = GenerateToken();
        var tokenHash = HashToken(token);

        _db.AccountActionTokens.Add(new AccountActionToken
        {
            UserId = userId,
            Purpose = AccountActionTokenPurpose.DeleteAccount,
            TokenHash = tokenHash,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(1),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        var confirmationUrl = $"http://localhost:5001/conferma-cancellazione.html?token={token}";
        var htmlBody = $@"
<h2>Conferma Cancellazione Account</h2>
<p>Ciao {user.Nome},</p>
<p>Hai richiesto la cancellazione del tuo account Cinema67.</p>
<p><strong>Attenzione: questa operazione è irreversibile.</strong></p>
<p>I tuoi dati personali verranno anonimizzati. Ordini, biglietti e movimenti credito saranno conservati in forma anonima per obblighi fiscali.</p>
<p>Clicca il link qui sotto per confermare la cancellazione:</p>
<p><a href='{confirmationUrl}'>Conferma Cancellazione Account</a></p>
<p>Se non hai richiesto questa operazione, ignora questa email.</p>
<p>Il link scade tra 1 ora.</p>";

        await _email.SendHtmlEmailAsync(user.Email, "Conferma cancellazione account - Cinema67", htmlBody);
    }

    public async Task ConfirmDeletionAsync(string token)
    {
        var tokenHash = HashToken(token);
        var record = await _db.AccountActionTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash
                && t.Purpose == AccountActionTokenPurpose.DeleteAccount
                && t.UsedAtUtc == null
                && t.ExpiresAtUtc > DateTime.UtcNow)
            ?? throw new InvalidOperationException("Token non valido, scaduto o già utilizzato.");

        record.UsedAtUtc = DateTime.UtcNow;
        await AnonymizeUserAsync(record.UserId);
        await _db.SaveChangesAsync();
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }

    private static string HashToken(string token)
    {
        var hash = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hash);
    }
}
