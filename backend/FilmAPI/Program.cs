 using System.Security.Claims;
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
using Microsoft.AspNetCore.Authentication;

QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var envCandidates = new[]
{
    Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env")),
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "backend", ".env")),
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ".env"))
};

var backendEnvPath = envCandidates.FirstOrDefault(File.Exists);
if (backendEnvPath is not null)
{
    Env.Load(backendEnvPath);
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
var dbUseAutoDetect = (Environment.GetEnvironmentVariable("DB_USE_AUTODETECT") ?? "false")
    .Equals("true", StringComparison.OrdinalIgnoreCase);
var dbServerVersion = Environment.GetEnvironmentVariable("DB_SERVER_VERSION") ?? "10.11.0-mariadb";

var connectionString = $"Server={dbHost};Port={dbPort};Database={dbName};User Id={dbUser};Password={dbPassword};";
var serverVersion = dbUseAutoDetect
    ? ServerVersion.AutoDetect(connectionString)
    : ServerVersion.Parse(dbServerVersion);

builder.Services.AddDbContext<FilmDbContext>(
    dbContextOptions => dbContextOptions
        .UseMySql(connectionString, serverVersion, options => options.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null))
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
builder.Services.AddScoped<IPayPalGateway, PayPalGateway>();
builder.Services.AddScoped<IPagamentoService, PagamentoService>();
builder.Services.AddScoped<ISupportService, SupportService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<IGiftCardService, GiftCardService>();
builder.Services.AddScoped<IMembershipService, MembershipService>();
builder.Services.AddScoped<INewsletterService, NewsletterService>();
builder.Services.AddScoped<IPartyBookingService, PartyBookingService>();
builder.Services.AddScoped<IShowCancellationService, ShowCancellationService>();
builder.Services.AddScoped<ICinemaAccessService, CinemaAccessService>();
builder.Services.AddScoped<IAccountDeletionService, AccountDeletionService>();
builder.Services.AddScoped<IMerchService, MerchService>();
builder.Services.AddScoped<IMerchPagamentoService, MerchPagamentoService>();
builder.Services.AddScoped<IShippingService, ShippingService>();
builder.Services.AddScoped<IPaccoService, PaccoService>();
builder.Services.AddScoped<IFoodService, FoodService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<ITmdbService>(sp =>
{
    var token = Environment.GetEnvironmentVariable("TMDB_BEARER_TOKEN");
    if (string.IsNullOrWhiteSpace(token))
    {
        return new TmdbService(new HttpClient());
    }
    var client = new HttpClient();
    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    return new TmdbService(client);
});
builder.Services.AddHostedService<RefreshTokenCleanupService>();
builder.Services.AddHostedService<ExpiredHoldCleanupService>();


builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    var allowedOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS") ?? "http://localhost:5001,http://127.0.0.1:5001";
    var origins = allowedOrigins.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    options.AddPolicy("AllowCinema67Frontend", policy =>
    {
        policy.WithOrigins(origins)
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
    bool HasRole(ClaimsPrincipal user, params string[] roles) =>
        user.HasClaim(c => (c.Type == "role" || c.Type == ClaimTypes.Role) && roles.Contains(c.Value));

    options.AddPolicy("AdminOnly", policy =>
        policy.RequireAssertion(ctx => HasRole(ctx.User, "Admin", "2")));
    options.AddPolicy("PowerUserOrAdmin", policy =>
        policy.RequireAssertion(ctx => HasRole(ctx.User, "PowerUser", "1", "Admin", "2")));
    options.AddPolicy("Authenticated", policy =>
        policy.RequireAuthenticatedUser());

    options.AddPolicy("CinemaStaffOrPowerUserOrAdmin", policy =>
        policy.RequireAssertion(ctx => HasRole(ctx.User, "Admin", "2", "PowerUser", "1", "CinemaStaff", "3")));

    options.AddPolicy("CorriereOrPowerUserOrAdmin", policy =>
        policy.RequireAssertion(ctx => HasRole(ctx.User, "Admin", "2", "PowerUser", "1", "Corriere", "4")));

    options.AddPolicy("MagazziniereOrPowerUserOrAdmin", policy =>
        policy.RequireAssertion(ctx => HasRole(ctx.User, "Admin", "2", "PowerUser", "1", "Magazziniere", "5")));

    options.AddPolicy("StaffOrPowerUserOrAdmin", policy =>
        policy.RequireAssertion(ctx => HasRole(ctx.User, "Admin", "2", "PowerUser", "1", "CinemaStaff", "3", "Corriere", "4", "Magazziniere", "5")));
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

// OAuth redirect endpoints
app.MapGet("/auth/login/google", () => "Google OAuth endpoint is alive").AllowAnonymous();
app.MapGet("/auth/login/microsoft", () => "Microsoft OAuth endpoint is alive").AllowAnonymous();

// Remove Google OAuth middleware config
app.MapMembershipEndpoints();
app.MapNewsletterEndpoints();
app.MapPartyBookingEndpoints();
app.MapShowCancellationEndpoints();
app.MapCinemaStaffEndpoints();
app.MapAccountEndpoints();
app.MapFoodEndpoints();
app.MapReferralEndpoints();
app.MapAnalyticsEndpoints();
app.MapMerchEndpoints();
app.MapMerchPagamentoEndpoints();
app.MapPaccoEndpoints();
app.MapReviewEndpoints();

app.MapGet("/config/frontend", (FrontendRuntimeConfig config) => Results.Ok(new
{
    stripePublishableKey = config.StripePublishableKey
})).AllowAnonymous();

// Container-aware health endpoints (registered before Run, so always available)
app.MapGet("/api/health/live", () => Results.Ok(new { status = "alive" })).AllowAnonymous();
app.MapGet("/api/health/ready", async (FilmDbContext db) =>
{
    try
    {
        await db.Database.CanConnectAsync();
        return Results.Ok(new { status = "ready", timestamp = DateTime.UtcNow });
    }
    catch
    {
        return Results.StatusCode(503);
    }
}).AllowAnonymous();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow })).AllowAnonymous();

// Bootstrap DB in background after app starts listening
app.Lifetime.ApplicationStarted.Register(async () =>
{
    var _logger = app.Services.GetRequiredService<ILogger<Program>>();
    _logger.LogInformation("=== DB Bootstrap starting ===");
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilmDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        var maxRetries = 10;
        var retryDelay = TimeSpan.FromSeconds(3);

        for (var attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                await db.Database.CanConnectAsync();
                logger.LogInformation("✓ Database connection established (attempt {Attempt}/{MaxRetries})", attempt, maxRetries);
                break;
            }
            catch (Exception ex)
            {
                if (attempt == maxRetries)
                {
                    logger.LogError(ex, "✗ Database connection failed after {MaxRetries} attempts", maxRetries);
                }
                else
                {
                    logger.LogWarning(ex, "Database not ready (attempt {Attempt}/{MaxRetries}), retrying in {Delay}s...", attempt, maxRetries, retryDelay.TotalSeconds);
                    await Task.Delay(retryDelay);
                }
            }
        }

        logger.LogInformation("Applying EF Core migrations...");
        try {
            await db.Database.MigrateAsync();
        } catch (Exception mex) {
            logger.LogWarning(mex, "Migration error, attempting manual fix...");
            try {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE Users ADD COLUMN AnonymizedAtUtc datetime(6) NULL");
                logger.LogInformation("✓ Manually added AnonymizedAtUtc column");
            } catch (Exception ex2) {
                logger.LogWarning(ex2, "Manual column addition skipped (may already exist)");
            }
            try {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE Users ADD COLUMN AuthVersion int NOT NULL DEFAULT 0");
                logger.LogInformation("✓ Manually added AuthVersion column");
            } catch (Exception ex3) {
                logger.LogWarning(ex3, "Manual column addition skipped (may already exist)");
            }
            try {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE Users ADD COLUMN IsDisabled tinyint(1) NOT NULL DEFAULT 0");
                logger.LogInformation("✓ Manually added IsDisabled column");
            } catch (Exception ex4) {
                logger.LogWarning(ex4, "Manual column addition skipped (may already exist)");
            }
            try {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE Users ADD COLUMN LastLoginAtUtc datetime(6) NULL");
                logger.LogInformation("✓ Manually added LastLoginAtUtc column");
            } catch (Exception ex5) {
                logger.LogWarning(ex5, "Manual column addition skipped (may already exist)");
            }
            try {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE Users ADD COLUMN LastLoginProvider varchar(30) NULL");
                logger.LogInformation("✓ Manually added LastLoginProvider column");
            } catch (Exception ex6) {
                logger.LogWarning(ex6, "Manual column addition skipped (may already exist)");
            }
            try {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE Users ADD COLUMN LocalCredentialsEnabled tinyint(1) NOT NULL DEFAULT 1");
                logger.LogInformation("✓ Manually added LocalCredentialsEnabled column");
            } catch (Exception ex7) {
                logger.LogWarning(ex7, "Manual column addition skipped (may already exist)");
            }
            try {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE MovimentiCredito ADD COLUMN MerchOrderId int NULL");
                logger.LogInformation("✓ Manually added MovimentiCredito.MerchOrderId column");
            } catch (Exception ex8) {
                logger.LogWarning(ex8, "Manual column addition skipped (may already exist)");
            }
            // Retry migration
            await db.Database.MigrateAsync();
        }
        logger.LogInformation("✓ Migrations applied");

        logger.LogInformation("Running DataSeeder...");
        var seeder = new DataSeeder(db);
        await seeder.SeedAsync();
        logger.LogInformation("✓ Seed completed");
        _logger.LogInformation("=== DB Bootstrap completed ===");
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Bootstrap failed: {Message}", ex.Message);
    }
});

app.Run();
// Bootstrap handled by app.Lifetime.ApplicationStarted callback above
public partial class Program;

public sealed record FrontendRuntimeConfig(string StripePublishableKey);
