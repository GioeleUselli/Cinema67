 using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FilmAPI.Data;
using FilmAPI.Endpoints;
using FilmAPI.Middleware;
using FilmAPI.Services;

QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var envCandidates = new[]
{
    Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env")),
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "backend", ".env")),
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ".env"))
};

var backendEnvPath = envCandidates.FirstOrDefault(File.Exists);
if (!string.IsNullOrWhiteSpace(backendEnvPath))
{
    Env.Load(backendEnvPath);
}
else
{
    Env.Load();
}

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton(new FrontendRuntimeConfig(
    Environment.GetEnvironmentVariable("STRIPE_PUBLISHABLE_API_KEY")
    ?? Environment.GetEnvironmentVariable("STRIPE_PUBLISHABLE_KEY")
    ?? string.Empty));

var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "film-api-db";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "root";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "root";
var dbUseAutoDetect = (Environment.GetEnvironmentVariable("DB_USE_AUTODETECT") ?? "true")
    .Equals("true", StringComparison.OrdinalIgnoreCase);
var dbServerVersion = Environment.GetEnvironmentVariable("DB_SERVER_VERSION") ?? "10.11.0-mariadb";

var connectionString = $"Server={dbHost};Port={dbPort};Database={dbName};User Id={dbUser};Password={dbPassword};";
var serverVersion = dbUseAutoDetect
    ? ServerVersion.AutoDetect(connectionString)
    : ServerVersion.Parse(dbServerVersion);

builder.Services.AddDbContext<FilmDbContext>(
    dbContextOptions => dbContextOptions
        .UseMySql(connectionString, serverVersion)
        .LogTo(Console.WriteLine, LogLevel.Information)
        .EnableSensitiveDataLogging()
        .EnableDetailedErrors()
);

builder.Services.AddScoped<IRegistaService, RegistaService>();
builder.Services.AddScoped<IFilmService, FilmService>();
builder.Services.AddScoped<ICinemaService, CinemaService>();
builder.Services.AddScoped<IProiezioneService, ProiezioneService>();
builder.Services.AddScoped<IMediaService, MediaService>();
builder.Services.AddScoped<ICategoriaService, CategoriaService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProfiloService, ProfiloService>();
builder.Services.AddScoped<IUserAdminService, UserAdminService>();
builder.Services.AddScoped<IProgrammazioneService, ProgrammazioneService>();
builder.Services.AddScoped<ISalaService, SalaService>();
builder.Services.AddScoped<IShowService, ShowService>();
builder.Services.AddScoped<ISeatHoldService, SeatHoldService>();
builder.Services.AddScoped<ICheckoutService, CheckoutService>();
builder.Services.AddScoped<ICreditoService, CreditoService>();
builder.Services.AddScoped<IBigliettoService, BigliettoService>();
builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IValidazioneBigliettoService, ValidazioneBigliettoService>();
builder.Services.AddScoped<IStripePaymentGateway, StripePaymentGateway>();
builder.Services.AddScoped<IPagamentoService, PagamentoService>();
builder.Services.AddScoped<ISupportService, SupportService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<IGiftCardService, GiftCardService>();
builder.Services.AddScoped<IMembershipService, MembershipService>();
builder.Services.AddScoped<INewsletterService, NewsletterService>();
builder.Services.AddHostedService<RefreshTokenCleanupService>();
builder.Services.AddHostedService<ExpiredHoldCleanupService>();

builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowCinema67Frontend", policy =>
    {
        policy.WithOrigins("http://localhost:5001", "http://127.0.0.1:5001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .WithExposedHeaders("Authorization");
    });
});

var rawJwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")?.Trim();
var jwtSecret = !string.IsNullOrWhiteSpace(rawJwtSecret) && Encoding.UTF8.GetByteCount(rawJwtSecret) >= 32
    ? rawJwtSecret
    : "SuperSecretKeyForCinema67JWTAuth2026!";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "Cinema67API";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "Cinema67Web";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        RoleClaimType = "role"
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = context =>
        {
            var identity = context.Principal?.Identity as System.Security.Claims.ClaimsIdentity;
            if (identity != null)
            {
                var roleClaim = identity.FindFirst("role");
                if (roleClaim != null)
                {
                    identity.AddClaim(new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, roleClaim.Value));
                }
            }

            var userIdClaim = context.Principal?.FindFirst("sub")?.Value
                ?? context.Principal?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            var authVersionClaim = context.Principal?.FindFirst("auth_version")?.Value;

            if (!string.IsNullOrWhiteSpace(userIdClaim) && int.TryParse(userIdClaim, out var uid)
                && !string.IsNullOrWhiteSpace(authVersionClaim) && int.TryParse(authVersionClaim, out var tokenAuthVersion))
            {
                using var scope = context.HttpContext.RequestServices.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<FilmAPI.Data.FilmDbContext>();
                var user = db.Users.Find(uid);
                if (user != null && user.AuthVersion != tokenAuthVersion)
                {
                    context.Fail("La sessione non è più valida. Effettua nuovamente il login.");
                    return System.Threading.Tasks.Task.CompletedTask;
                }
            }

            return System.Threading.Tasks.Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => (c.Type == "role" || c.Type == System.Security.Claims.ClaimTypes.Role) && c.Value == "Admin")));
    options.AddPolicy("PowerUserOrAdmin", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => (c.Type == "role" || c.Type == System.Security.Claims.ClaimTypes.Role) && (c.Value == "PowerUser" || c.Value == "Admin"))));
    options.AddPolicy("Authenticated", policy =>
        policy.RequireAuthenticatedUser());
});

builder.Services.AddOpenApiDocument(config =>
{
    config.DocumentName = "FilmAPI";
    config.Title = "FilmAPI v1";
    config.Version = "v1";
});

var googleClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
var googleClientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");

var app = builder.Build();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (BadHttpRequestException ex)
    {
        context.Response.StatusCode = ex.StatusCode;
        await context.Response.WriteAsJsonAsync(new { message = ex.Message });
    }
    catch (ArgumentException ex)
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsJsonAsync(new { message = ex.Message });
    }
    catch (InvalidOperationException ex)
    {
        context.Response.StatusCode = 409;
        await context.Response.WriteAsJsonAsync(new { message = ex.Message });
    }
    catch (UnauthorizedAccessException)
    {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsJsonAsync(new { message = "Accesso non autorizzato." });
    }
    catch (Exception ex)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Unhandled exception {Path}", context.Request.Path);
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { message = "Errore interno del server." });
    }
});

app.UseCors("AllowCinema67Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store");
        ctx.Context.Response.Headers.Append("Pragma", "no-cache");
        ctx.Context.Response.Headers.Append("Expires", "0");
    }
});

app.UseMiddleware<RateLimiterMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseOpenApi();
    app.UseSwaggerUi(config =>
    {
        config.DocumentTitle = "FilmAPI v1";
        config.Path = "/swagger";
        config.DocumentPath = "/swagger/{documentName}/swagger.json";
        config.DocExpansion = "list";
    });
}

app.MapRegistiEndpoints();
app.MapFilmsEndpoints();
app.MapCinemasEndpoints();
app.MapProiezioniEndpoints();
app.MapMediaEndpoints();
app.MapCategorieEndpoints();
app.MapAuthEndpoints();
app.MapProfiloEndpoints();
// app.MapPrenotazioniEndpoints(); // Deprecated — use /checkout/orders and /checkout/tickets
app.MapAdminUtentiEndpoints();
app.MapProgrammazioneEndpoints();
app.MapSaleEndpoints();
app.MapShowsEndpoints();
app.MapCheckoutEndpoints();
app.MapCreditoEndpoints();
app.MapPagamentoEndpoints();
app.MapValidazioneBigliettiEndpoints();
app.MapSupportEndpoints();
app.MapPromotionEndpoints();
app.MapGiftCardEndpoints();
app.MapSocialAuthEndpoints();
app.MapMembershipEndpoints();
app.MapNewsletterEndpoints();

app.MapGet("/config/frontend", (FrontendRuntimeConfig config) => Results.Ok(new
{
    stripePublishableKey = config.StripePublishableKey
})).AllowAnonymous();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow })).AllowAnonymous();

using (var scope = app.Services.CreateScope())
{
    var seeder = new DataSeeder(scope.ServiceProvider.GetRequiredService<FilmDbContext>());
    await seeder.SeedAsync();
}

app.Run();

public partial class Program;

public sealed record FrontendRuntimeConfig(string StripePublishableKey);
