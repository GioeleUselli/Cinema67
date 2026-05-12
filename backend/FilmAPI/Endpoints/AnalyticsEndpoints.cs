using FilmAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace FilmAPI.Endpoints;

public static class AnalyticsEndpoints
{
    public static void MapAnalyticsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/admin/analytics").RequireAuthorization("PowerUserOrAdmin");

        group.MapGet("/revenue", async (
            [FromQuery] DateTime? dal,
            [FromQuery] DateTime? al,
            [FromQuery] int? cinemaId,
            IAnalyticsService service) =>
        {
            var from = dal ?? DateTime.UtcNow.Date.AddDays(-30);
            var to = al ?? DateTime.UtcNow.Date.AddDays(1);
            return Results.Ok(await service.GetDailyRevenueAsync(from, to, cinemaId));
        });

        group.MapGet("/top-films", async (
            [FromQuery] DateTime? dal,
            [FromQuery] DateTime? al,
            [FromQuery] int? limit,
            IAnalyticsService service) =>
        {
            var from = dal ?? DateTime.UtcNow.Date.AddDays(-30);
            var to = al ?? DateTime.UtcNow.Date.AddDays(1);
            return Results.Ok(await service.GetTopFilmsAsync(from, to, limit ?? 10));
        });

        group.MapGet("/time-slots", async (
            [FromQuery] DateTime? dal,
            [FromQuery] DateTime? al,
            IAnalyticsService service) =>
        {
            var from = dal ?? DateTime.UtcNow.Date.AddDays(-30);
            var to = al ?? DateTime.UtcNow.Date.AddDays(1);
            return Results.Ok(await service.GetPopularTimeSlotsAsync(from, to));
        });

        group.MapGet("/cinema-comparison", async (
            [FromQuery] DateTime? dal,
            [FromQuery] DateTime? al,
            IAnalyticsService service) =>
        {
            var from = dal ?? DateTime.UtcNow.Date.AddDays(-30);
            var to = al ?? DateTime.UtcNow.Date.AddDays(1);
            return Results.Ok(await service.GetCinemaComparisonAsync(from, to));
        });

        group.MapGet("/dashboard", async (IAnalyticsService service) =>
        {
            return Results.Ok(await service.GetDashboardStatsAsync());
        });
    }
}
