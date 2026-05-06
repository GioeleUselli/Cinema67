using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace FilmAPI.Services;

public class AuthService : IAuthService
{
    private readonly FilmDbContext _context;
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;
    private readonly int _accessTokenExpiryMinutes;
    private readonly int _refreshTokenExpiryDays;
    private const string DefaultDeviceId = "web-default";

    public AuthService(FilmDbContext context)
    {
        _context = context;
        var rawJwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")?.Trim();
        _jwtSecret = !string.IsNullOrWhiteSpace(rawJwtSecret) && Encoding.UTF8.GetByteCount(rawJwtSecret) >= 32
            ? rawJwtSecret
            : "SuperSecretKeyForCinema67JWTAuth2026!";
        _jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "Cinema67API";
        _jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "Cinema67Web";
        _accessTokenExpiryMinutes = int.Parse(Environment.GetEnvironmentVariable("JWT_ACCESS_TOKEN_EXPIRY_MINUTES") ?? "15");
        _refreshTokenExpiryDays = int.Parse(Environment.GetEnvironmentVariable("JWT_REFRESH_TOKEN_EXPIRY_DAYS") ?? "7");
    }

    public async Task<AuthResponseDTO> RegisterAsync(RegisterRequestDTO dto)
    {
        var normalizedEmail = NormalizeEmail(dto.Email);
        var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            throw new InvalidOperationException("Email gia registrata");
        }

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Nome = dto.Nome,
            Cognome = dto.Cognome,
            Telefono = dto.Telefono,
            Ruolo = UserRole.User,
            DataRegistrazione = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var accessToken = GenerateAccessToken(user);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, dto.DeviceId);
        await _context.SaveChangesAsync();

        return new AuthResponseDTO
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAt = refreshToken.ExpiresAt,
            User = MapUserInfo(user)
        };
    }

    public async Task<AuthResponseDTO> LoginAsync(LoginRequestDTO dto)
    {
        var normalizedEmail = NormalizeEmail(dto.Email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Credenziali non valide");
        }

        var accessToken = GenerateAccessToken(user);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, dto.DeviceId, dto.RememberMe ? 30 : _refreshTokenExpiryDays);
        await _context.SaveChangesAsync();

        return new AuthResponseDTO
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAt = refreshToken.ExpiresAt,
            User = MapUserInfo(user)
        };
    }

    public async Task<AuthResponseDTO> RefreshAsync(string refreshToken, string? deviceId)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken is null || !storedToken.IsActive)
        {
            throw new UnauthorizedAccessException("Refresh token non valido o scaduto");
        }

        var normalizedDeviceId = NormalizeDeviceId(deviceId);
        if (!string.Equals(storedToken.DeviceId, normalizedDeviceId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Refresh token non valido per questo device");
        }

        storedToken.RevokedAt = DateTime.UtcNow;

        var newRefreshToken = await GenerateRefreshTokenAsync(storedToken.UserId, normalizedDeviceId);
        var accessToken = GenerateAccessToken(storedToken.User!);

        await _context.SaveChangesAsync();

        return new AuthResponseDTO
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken.Token,
            ExpiresAt = newRefreshToken.ExpiresAt,
            User = MapUserInfo(storedToken.User!)
        };
    }

    public async Task<bool> LogoutAsync(string refreshToken, string? deviceId)
    {
        var normalizedDeviceId = NormalizeDeviceId(deviceId);
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.DeviceId == normalizedDeviceId);

        if (storedToken is null) return false;

        storedToken.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<UserInfoDTO?> GetUserByIdAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null) return null;

        return MapUserInfo(user);
    }

    private string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("role", user.Ruolo.ToString()),
            new Claim("nome", user.Nome)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtIssuer,
            audience: _jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_accessTokenExpiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<RefreshToken> GenerateRefreshTokenAsync(int userId, string? deviceId, int? expiryDays = null)
    {
        var days = expiryDays ?? _refreshTokenExpiryDays;
        var normalizedDeviceId = NormalizeDeviceId(deviceId);

        var activeTokensForDevice = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.DeviceId == normalizedDeviceId && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var token in activeTokensForDevice)
        {
            token.RevokedAt = DateTime.UtcNow;
        }

        var refreshToken = new RefreshToken
        {
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            UserId = userId,
            DeviceId = normalizedDeviceId,
            ExpiresAt = DateTime.UtcNow.AddDays(days),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshToken);
        return refreshToken;
    }

    public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user is null || !BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> ForgotPasswordAsync(string email)
    {
        var normalized = NormalizeEmail(email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalized);
        if (user is null) return string.Empty;

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace("/", "_").Replace("+", "-").TrimEnd('=');

        _context.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            Token = token,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(1)
        });

        var hasSmtp = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SMTP_USER"))
            && !(Environment.GetEnvironmentVariable("SMTP_USER") ?? "").StartsWith("<");

        if (hasSmtp)
        {
            try
            {
                var frontendBase = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL") ?? "http://localhost:5001";
                var resetUrl = $"{frontendBase}/reset-password.html?token={token}";
                var sender = Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? user.Email;
                var fromName = Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? "Cinema67";

                using var client = new MailKit.Net.Smtp.SmtpClient();
                await client.ConnectAsync(
                    Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com",
                    int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587"),
                    MailKit.Security.SecureSocketOptions.StartTls);

                await client.AuthenticateAsync(
                    Environment.GetEnvironmentVariable("SMTP_USER"),
                    Environment.GetEnvironmentVariable("SMTP_PASSWORD"));

                var message = new MimeKit.MimeMessage();
                message.From.Add(new MimeKit.MailboxAddress(fromName, sender));
                message.To.Add(MimeKit.MailboxAddress.Parse(user.Email));
                message.Subject = "Cinema67 - Reset Password";

                var body = new MimeKit.BodyBuilder
                {
                    TextBody = $"Clicca qui per resettare la password: {resetUrl}\nIl link scade tra 1 ora.",
                    HtmlBody = $@"<html><body style=""margin:0;padding:0;font-family:Arial,sans-serif;background:#0f172a"">
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#0f172a;padding:40px 0"">
<tr><td align=""center"">
<table width=""540"" cellpadding=""0"" cellspacing=""0"" style=""background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;overflow:hidden;border:1px solid #334155"">
<tr><td style=""padding:32px 40px 20px;text-align:center"">
<div style=""font-size:28px;font-weight:900;color:#f59e0b;font-family:Georgia,serif;letter-spacing:2px"">CINEMA67</div>
</td></tr>
<tr><td style=""padding:0 40px""><div style=""height:1px;background:#334155""></div></td></tr>
<tr><td style=""padding:24px 40px"">
<h2 style=""color:#f1f5f9;margin:0 0 12px"">Reset Password</h2>
<p style=""color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px"">Hai richiesto il reset della password. Clicca il pulsante per impostarne una nuova. Il link scade tra <strong>1 ora</strong>.</p>
<a href=""{resetUrl}"" style=""display:inline-block;background:#f59e0b;color:#0f172a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px"">RESET PASSWORD</a>
</td></tr>
<tr><td style=""padding:0 40px 24px"">
<p style=""color:#64748b;font-size:12px;margin:16px 0 0"">Se non funziona, copia questo link: <a href=""{resetUrl}"" style=""color:#f59e0b"">{resetUrl}</a></p>
<p style=""color:#475569;font-size:11px;margin:8px 0 0"">Se non hai richiesto il reset, ignora questa email.</p>
</td></tr>
<tr><td style=""padding:16px 40px;background:rgba(0,0,0,0.2);text-align:center"">
<p style=""color:#475569;font-size:11px;margin:0"">© 2026 Cinema67 — biglietti.cinema67@gmail.com</p>
</td></tr>
</table></td></tr></table></body></html>"
                };
                message.Body = body.ToMessageBody();

                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception)
            {
                // email send failed, token still available via API response
            }
        }

        await _context.SaveChangesAsync();
        return hasSmtp ? "" : token;
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword)
    {
        var now = DateTime.UtcNow;
        var resetToken = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == token && !t.Used && t.ExpiresAtUtc > now);

        if (resetToken is null) return false;

        var user = await _context.Users.FindAsync(resetToken.UserId);
        if (user is null) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        resetToken.Used = true;

        _context.RefreshTokens.RemoveRange(
            _context.RefreshTokens.Where(rt => rt.UserId == user.Id));

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ChangeEmailAsync(int userId, string currentPassword, string newEmail)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user is null || !BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            return false;

        var normalizedNew = NormalizeEmail(newEmail);
        if (string.IsNullOrWhiteSpace(normalizedNew))
            throw new ArgumentException("Email non valida.");

        var conflict = await _context.Users.AnyAsync(u => u.Email == normalizedNew && u.Id != userId);
        if (conflict)
            throw new InvalidOperationException("Email già in uso da un altro account.");

        user.Email = normalizedNew;
        await _context.SaveChangesAsync();
        return true;
    }

    private static string NormalizeDeviceId(string? deviceId)
    {
        return string.IsNullOrWhiteSpace(deviceId)
            ? DefaultDeviceId
            : deviceId.Trim();
    }

    private static string NormalizeEmail(string email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static UserInfoDTO MapUserInfo(User user)
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
}
