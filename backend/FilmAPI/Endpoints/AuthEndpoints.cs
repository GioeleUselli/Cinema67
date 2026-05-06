using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FilmAPI.DTO;
using FilmAPI.Services;
using Microsoft.AspNetCore.Authentication;

namespace FilmAPI.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/auth");

        group.MapPost("/register", async (RegisterRequestDTO dto, IAuthService service) =>
        {
            try
            {
                var result = await service.RegisterAsync(dto);
                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(ex.Message);
            }
        }).AllowAnonymous();

        group.MapPost("/login", async (LoginRequestDTO dto, IAuthService service) =>
        {
            try
            {
                var result = await service.LoginAsync(dto);
                return Results.Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        }).AllowAnonymous();

        group.MapPost("/refresh", async (RefreshTokenRequestDTO dto, IAuthService service) =>
        {
            try
            {
                var result = await service.RefreshAsync(dto.RefreshToken, dto.DeviceId);
                return Results.Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        }).AllowAnonymous();

        group.MapPost("/logout", async (RefreshTokenRequestDTO dto, IAuthService service) =>
        {
            var result = await service.LogoutAsync(dto.RefreshToken, dto.DeviceId);
            return result ? Results.Ok() : Results.NotFound();
        }).RequireAuthorization("Authenticated");

        group.MapGet("/me", async (HttpContext context, IAuthService service) =>
        {
            var userIdClaim = context.User.FindFirst("sub")?.Value
                ?? context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.Unauthorized();
            }

            var userInfo = await service.GetUserByIdAsync(userId);
            return userInfo is null ? Results.Unauthorized() : Results.Ok(userInfo);
        }).RequireAuthorization("Authenticated");

        group.MapPost("/change-password", async (ChangePasswordDTO dto, HttpContext context, IAuthService service) =>
        {
            var userId = GetUserId(context);
            if (userId == 0) return Results.Unauthorized();

            var ok = await service.ChangePasswordAsync(userId, dto.CurrentPassword, dto.NewPassword);
            return ok ? Results.Ok(new { message = "Password aggiornata." }) : Results.BadRequest(new { message = "Password attuale errata." });
        }).RequireAuthorization("Authenticated");

        group.MapPost("/change-email", async (ChangeEmailDTO dto, HttpContext context, IAuthService service) =>
        {
            var userId = GetUserId(context);
            if (userId == 0) return Results.Unauthorized();
            try
            {
                await service.ChangeEmailAsync(userId, dto.CurrentPassword, dto.NewEmail);
                return Results.Ok(new { message = "Email aggiornata. Effettua login con la nuova email." });
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.Conflict(new { message = ex.Message }); }
        }).RequireAuthorization("Authenticated");

        group.MapPost("/forgot-password", async (ForgotPasswordDTO dto, IAuthService service) =>
        {
            var token = await service.ForgotPasswordAsync(dto.Email);
            return Results.Ok(new { message = string.IsNullOrEmpty(token) ? "Se l'email esiste, riceverai un link di reset. Controlla anche lo spam." : $"Token reset (dev mode): {token}" });
        }).AllowAnonymous();

        group.MapPost("/reset-password", async (ResetPasswordDTO dto, IAuthService service) =>
        {
            var ok = await service.ResetPasswordAsync(dto.Token, dto.NewPassword);
            return ok ? Results.Ok(new { message = "Password reimpostata. Ora puoi fare login." }) : Results.BadRequest(new { message = "Token non valido o scaduto." });
        }).AllowAnonymous();

        group.MapGet("/login/google", () =>
        {
            var clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
            if (string.IsNullOrWhiteSpace(clientId))
                return Results.BadRequest(new { message = "Google OAuth non configurato." });

            var redirectUri = Uri.EscapeDataString(
                (Environment.GetEnvironmentVariable("BACKEND_BASE_URL") ?? "http://localhost:5000")
                + "/auth/social-callback");
            var url = $"https://accounts.google.com/o/oauth2/v2/auth" +
                $"?client_id={clientId}" +
                $"&redirect_uri={redirectUri}" +
                $"&response_type=code" +
                $"&scope=openid%20email%20profile" +
                $"&state=google";

            return Results.Redirect(url);
        }).AllowAnonymous();

        group.MapGet("/login/microsoft", () =>
        {
            var clientId = Environment.GetEnvironmentVariable("MICROSOFT_CLIENT_ID");
            if (string.IsNullOrWhiteSpace(clientId))
                return Results.BadRequest(new { message = "Microsoft OAuth non configurato." });

            var redirectUri = Uri.EscapeDataString(
                (Environment.GetEnvironmentVariable("BACKEND_BASE_URL") ?? "http://localhost:5000")
                + "/auth/social-callback");
            var url = $"https://login.microsoftonline.com/common/oauth2/v2.0/authorize" +
                $"?client_id={clientId}" +
                $"&redirect_uri={redirectUri}" +
                $"&response_type=code" +
                $"&scope=openid%20email%20profile%20User.Read" +
                $"&state=microsoft";

            return Results.Redirect(url);
        }).AllowAnonymous();
    }

    private static int GetUserId(HttpContext context)
    {
        var raw = context.User.FindFirst("sub")?.Value
            ?? context.User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(raw, out var id) ? id : 0;
    }
}
