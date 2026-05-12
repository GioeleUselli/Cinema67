using FilmAPI.Data;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IAnalyticsService
{
    Task<object> GetDailyRevenueAsync(DateTime dal, DateTime al, int? cinemaId = null);
    Task<object> GetTopFilmsAsync(DateTime dal, DateTime al, int limit = 10);
    Task<object> GetPopularTimeSlotsAsync(DateTime dal, DateTime al);
    Task<object> GetCinemaComparisonAsync(DateTime dal, DateTime al);
    Task<object> GetDashboardStatsAsync();
}

public class AnalyticsService : IAnalyticsService
{
    private readonly FilmDbContext _db;

    public AnalyticsService(FilmDbContext db) { _db = db; }

    public async Task<object> GetDailyRevenueAsync(DateTime dal, DateTime al, int? cinemaId = null)
    {
        var query = _db.Ordini
            .Where(o => o.Stato == OrdineState.Paid && o.PaidAtUtc >= dal && o.PaidAtUtc <= al);

        if (cinemaId.HasValue)
            query = query.Where(o => o.CinemaId == cinemaId.Value);

        var data = await query
            .GroupBy(o => o.PaidAtUtc!.Value.Date)
            .Select(g => new { date = g.Key.ToString("yyyy-MM-dd"), revenue = g.Sum(o => o.TotaleLordo), tickets = g.Sum(o => o.NumeroBiglietti) })
            .OrderBy(x => x.date)
            .ToListAsync();

        return new { dal = dal.ToString("yyyy-MM-dd"), al = al.ToString("yyyy-MM-dd"), data };
    }

    public async Task<object> GetTopFilmsAsync(DateTime dal, DateTime al, int limit = 10)
    {
        var data = await _db.Ordini
            .Where(o => o.Stato == OrdineState.Paid && o.PaidAtUtc >= dal && o.PaidAtUtc <= al)
            .GroupBy(o => new { o.FilmId, o.Film!.Titolo })
            .Select(g => new { filmId = g.Key.FilmId, titolo = g.Key.Titolo, tickets = g.Sum(o => o.NumeroBiglietti), revenue = g.Sum(o => o.TotaleLordo) })
            .OrderByDescending(x => x.tickets)
            .Take(limit)
            .ToListAsync();

        return new { dal = dal.ToString("yyyy-MM-dd"), al = al.ToString("yyyy-MM-dd"), data };
    }

    public async Task<object> GetPopularTimeSlotsAsync(DateTime dal, DateTime al)
    {
        var data = await _db.Ordini
            .Where(o => o.Stato == OrdineState.Paid && o.PaidAtUtc >= dal && o.PaidAtUtc <= al)
            .Join(_db.Shows, o => o.ShowId, s => s.Id, (o, s) => new { o.NumeroBiglietti, s.StartAtUtc })
            .GroupBy(x => x.StartAtUtc.Hour)
            .Select(g => new { hour = g.Key, tickets = g.Sum(x => x.NumeroBiglietti) })
            .OrderBy(x => x.hour)
            .ToListAsync();

        return new { dal = dal.ToString("yyyy-MM-dd"), al = al.ToString("yyyy-MM-dd"), data };
    }

    public async Task<object> GetCinemaComparisonAsync(DateTime dal, DateTime al)
    {
        var data = await _db.Ordini
            .Where(o => o.Stato == OrdineState.Paid && o.PaidAtUtc >= dal && o.PaidAtUtc <= al)
            .GroupBy(o => new { o.CinemaId, o.Cinema!.Nome })
            .Select(g => new { cinemaId = g.Key.CinemaId, nome = g.Key.Nome, tickets = g.Sum(o => o.NumeroBiglietti), revenue = g.Sum(o => o.TotaleLordo) })
            .OrderByDescending(x => x.revenue)
            .ToListAsync();

        return new { dal = dal.ToString("yyyy-MM-dd"), al = al.ToString("yyyy-MM-dd"), data };
    }

    public async Task<object> GetDashboardStatsAsync()
    {
        var todayUtc = DateTime.UtcNow.Date;
        var tomorrowUtc = todayUtc.AddDays(1);

        var todayRevenue = await _db.Ordini
            .Where(o => o.Stato == OrdineState.Paid && o.PaidAtUtc >= todayUtc && o.PaidAtUtc < tomorrowUtc)
            .SumAsync(o => o.TotaleLordo);

        var todayTickets = await _db.Biglietti
            .Where(b => b.Ordine!.Stato == OrdineState.Paid && b.Ordine!.PaidAtUtc >= todayUtc && b.Ordine!.PaidAtUtc < tomorrowUtc)
            .CountAsync();

        var avgTicketPrice = await _db.Biglietti
            .Where(b => b.Ordine!.Stato == OrdineState.Paid && b.Ordine!.PaidAtUtc >= todayUtc && b.Ordine!.PaidAtUtc < tomorrowUtc)
            .Select(b => (decimal?)b.PrezzoTotale)
            .AverageAsync() ?? 0m;

        var todayShows = await _db.Shows
            .Where(s => s.State == ShowState.Scheduled && s.StartAtUtc >= todayUtc && s.StartAtUtc < tomorrowUtc)
            .ToListAsync();

        var showIds = todayShows.Select(s => s.Id).ToList();

        var totalSeats = await _db.SalaPosti
            .Where(sp => todayShows.Select(s => s.SalaId).Contains(sp.SalaId) && sp.IsAttivo)
            .CountAsync();

        var soldTickets = await _db.Biglietti
            .Where(b => showIds.Contains(b.ShowId) && b.Ordine!.Stato == OrdineState.Paid)
            .CountAsync();

        var occupancy = totalSeats > 0 ? Math.Round((decimal)soldTickets / totalSeats * 100, 1) : 0m;

        return new
        {
            todayRevenue,
            todayTickets,
            avgTicketPrice = Math.Round(avgTicketPrice, 2),
            occupancyPercent = occupancy,
            totalShowsToday = todayShows.Count
        };
    }
}
