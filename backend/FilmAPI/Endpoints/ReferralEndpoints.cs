using FilmAPI.Data;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class ReferralEndpoints
{
    public static void MapReferralEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/referral").RequireAuthorization("Authenticated");

        group.MapPost("/generate", async (ClaimsPrincipal user, FilmDbContext db) =>
        {
            var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? user.FindFirstValue("sub");
            if (!int.TryParse(raw, out var userId) || userId == 0)
                return Results.Unauthorized();

            var code = $"REF{userId}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";

            var existing = await db.ReferralCodes
                .FirstOrDefaultAsync(r => r.UserId == userId && r.Code == code);

            if (existing is not null)
                return Results.Ok(new { code = existing.Code, discountPercent = existing.DiscountPercent });

            var referral = new ReferralCode
            {
                UserId = userId,
                Code = code,
                DiscountPercent = 10,
                CreatedAtUtc = DateTime.UtcNow
            };

            db.ReferralCodes.Add(referral);
            await db.SaveChangesAsync();

            return Results.Ok(new { code = referral.Code, discountPercent = referral.DiscountPercent });
        });
    }
}
