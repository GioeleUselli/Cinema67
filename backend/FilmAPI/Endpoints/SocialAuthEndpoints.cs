using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using FilmAPI.Data;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Endpoints;

public static class SocialAuthEndpoints
{
    public static void MapSocialAuthEndpoints(this WebApplication app)
    {
        var frontendBase = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL") ?? "http://localhost:5001";

        app.MapGet("/auth/social-callback", async (HttpContext ctx) =>
        {
            var code = ctx.Request.Query["code"].FirstOrDefault();
            var oauthError = ctx.Request.Query["error"].FirstOrDefault();
            var state = ctx.Request.Query["state"].FirstOrDefault();
            var provider = (state == "microsoft") ? "microsoft" : "google";

            if (!string.IsNullOrWhiteSpace(oauthError) || string.IsNullOrWhiteSpace(code))
            {
                ctx.Response.Redirect($"{frontendBase}/login.html?error=oauth_failed");
                return;
            }

            var (email, givenName, surname, exError) = await ExchangeCodeAsync(code, provider);
            if (!string.IsNullOrWhiteSpace(exError) || string.IsNullOrWhiteSpace(email))
            {
                ctx.Response.Redirect($"{frontendBase}/login.html?error=oauth_failed&detail={Uri.EscapeDataString(exError ?? "no_email")}");
                return;
            }

            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FilmDbContext>();
            var normalized = email.Trim().ToLowerInvariant();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalized);
            if (user is null)
            {
                user = new User
                {
                    Email = normalized,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    Nome = string.IsNullOrWhiteSpace(givenName) ? "Utente" : givenName.Trim(),
                    Cognome = string.IsNullOrWhiteSpace(surname) ? "Social" : surname.Trim(),
                    Ruolo = UserRole.User, CreditoResiduo = 0, DataRegistrazione = DateTime.UtcNow
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }

            if (user.Ruolo == UserRole.Admin || user.Ruolo == UserRole.PowerUser)
            {
                ctx.Response.Redirect($"{frontendBase}/login.html?error=admin_social");
                return;
            }

            var accessToken = GenerateJwt(user);
            var refreshToken = Guid.NewGuid().ToString("N");
            db.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id, Token = refreshToken, DeviceId = "social-default",
                ExpiresAt = DateTime.UtcNow.AddDays(30), CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            ctx.Response.Redirect($"{frontendBase}/login.html?accessToken={Uri.EscapeDataString(accessToken)}&refreshToken={Uri.EscapeDataString(refreshToken)}&name={Uri.EscapeDataString(user.Nome)}&email={Uri.EscapeDataString(user.Email)}");
        }).AllowAnonymous();
    }

    private static async Task<(string email, string givenName, string surname, string error)> ExchangeCodeAsync(string code, string provider)
    {
        var redirectUri = (Environment.GetEnvironmentVariable("BACKEND_BASE_URL") ?? "http://localhost:5000") + "/auth/social-callback";

        if (provider == "google")
        {
            var cId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID")?.Trim();
            var cSec = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET")?.Trim();
            if (!string.IsNullOrWhiteSpace(cId) && !string.IsNullOrWhiteSpace(cSec))
            {
                try
                {
                    using var h = new HttpClient();
                    var tr = await h.PostAsync("https://oauth2.googleapis.com/token",
                        new FormUrlEncodedContent(new Dictionary<string, string>
                        { ["code"]=code, ["client_id"]=cId!, ["client_secret"]=cSec!, ["redirect_uri"]=redirectUri, ["grant_type"]="authorization_code" }));
                    if (tr.IsSuccessStatusCode)
                    {
                        var tj = await tr.Content.ReadFromJsonAsync<JsonElement>();
                        var at = tj.GetProperty("access_token").GetString()!;
                        h.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", at);
                        var ur = await h.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");
                        if (ur.IsSuccessStatusCode)
                        {
                            var u = await ur.Content.ReadFromJsonAsync<JsonElement>();
                            return (u.TryGetProperty("email", out var e) ? e.GetString() ?? "" : "",
                                u.TryGetProperty("given_name", out var gn) ? gn.GetString() ?? "" : "",
                                u.TryGetProperty("family_name", out var fn) ? fn.GetString() ?? "" : "", "");
                        }
                        else return ("","","","google_userinfo:"+ur.StatusCode);
                    }
                    else { var b = await tr.Content.ReadAsStringAsync(); return ("","","","google_token:"+tr.StatusCode+" "+b[..Math.Min(80,b.Length)]); }
                }
                catch (Exception ex) { return ("","","","google_ex:"+ex.Message); }
            }
        }
        else if (provider == "microsoft")
        {
            var cId = Environment.GetEnvironmentVariable("MICROSOFT_CLIENT_ID")?.Trim();
            var cSec = Environment.GetEnvironmentVariable("MICROSOFT_CLIENT_SECRET")?.Trim();
            if (!string.IsNullOrWhiteSpace(cId) && !string.IsNullOrWhiteSpace(cSec))
            {
                try
                {
                    using var h = new HttpClient();
                    var tr = await h.PostAsync("https://login.microsoftonline.com/common/oauth2/v2.0/token",
                        new FormUrlEncodedContent(new Dictionary<string, string>
                        { ["code"]=code, ["client_id"]=cId!, ["client_secret"]=cSec!, ["redirect_uri"]=redirectUri, ["grant_type"]="authorization_code" }));
                    if (tr.IsSuccessStatusCode)
                    {
                        var tj = await tr.Content.ReadFromJsonAsync<JsonElement>();
                        var at = tj.GetProperty("access_token").GetString()!;
                        h.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", at);
                        var ur = await h.GetAsync("https://graph.microsoft.com/v1.0/me");
                        if (ur.IsSuccessStatusCode)
                        {
                            var u = await ur.Content.ReadFromJsonAsync<JsonElement>();
                            var mail = u.TryGetProperty("mail", out var me) ? me.GetString()
                                ?? (u.TryGetProperty("userPrincipalName", out var upn) ? upn.GetString() : "") : "";
                            return (mail ?? "",
                                u.TryGetProperty("givenName", out var gn) ? gn.GetString() ?? "" : "",
                                u.TryGetProperty("surname", out var sn) ? sn.GetString() ?? "" : "", "");
                        }
                        else return ("","","","ms_userinfo:"+ur.StatusCode);
                    }
                    else { var b = await tr.Content.ReadAsStringAsync(); return ("","","","ms_token:"+tr.StatusCode); }
                }
                catch (Exception ex) { return ("","","","ms_ex:"+ex.Message); }
            }
        }

        return ("", "", "", "unknown_provider");
    }

    private static string GenerateJwt(User user)
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET")?.Trim();
        if (string.IsNullOrWhiteSpace(secret) || System.Text.Encoding.UTF8.GetByteCount(secret) < 32)
            secret = "SuperSecretKeyForCinema67JWTAuth2026!";
        var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "Cinema67API";
        var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "Cinema67Web";
        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secret));
        var creds = new Microsoft.IdentityModel.Tokens.SigningCredentials(key, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email, user.Email),
            new("role", user.Ruolo.ToString())
        };
        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            issuer: issuer, audience: audience, claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15), signingCredentials: creds);
        return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
    }
}
