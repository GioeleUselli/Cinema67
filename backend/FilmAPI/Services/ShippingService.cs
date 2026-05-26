using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IShippingService
{
    decimal CalcolaCostoSpedizione(string tipoConsegna, int? cinemaRitiroId, string? capDestinazione);
    (decimal Costo, int GiorniLavorativi, DateTime DataPrevista) CalcolaSpedizioneCompleta(string tipoConsegna, int? cinemaRitiroId, string? capDestinazione);
    Task<ShipmentTrackingDTO> GetTrackingAsync(int merchOrderId);
}

public class ShippingService : IShippingService
{
    private readonly FilmDbContext _db;

    private static readonly (double Lat, double Lon) MilanWarehouse = (45.4642, 9.1900);

    private static readonly string[] StatusFlow = PaccoStati.FlussoTracking;

    public ShippingService(FilmDbContext db)
    {
        _db = db;
    }

    public decimal CalcolaCostoSpedizione(string tipoConsegna, int? cinemaRitiroId, string? capDestinazione)
    {
        if (tipoConsegna == "RitiroCinema")
        {
            if (cinemaRitiroId.HasValue)
            {
                var cinema = _db.Cinemas.Find(cinemaRitiroId.Value);
                if (cinema?.Latitudine.HasValue == true && cinema.Longitudine.HasValue)
                {
                    var dist = Haversine(MilanWarehouse.Lat, MilanWarehouse.Lon, cinema.Latitudine.Value, cinema.Longitudine.Value);
                    return CostFromKm(dist);
                }
            }
            return 0;
        }
        return CostFromCap(capDestinazione);
    }

    public (decimal Costo, int GiorniLavorativi, DateTime DataPrevista) CalcolaSpedizioneCompleta(string tipoConsegna, int? cinemaRitiroId, string? capDestinazione)
    {
        int giorni;
        if (tipoConsegna == "RitiroCinema" && cinemaRitiroId.HasValue)
        {
            var cinema = _db.Cinemas.Find(cinemaRitiroId.Value);
            if (cinema?.Latitudine.HasValue == true && cinema.Longitudine.HasValue)
            {
                var km = Haversine(MilanWarehouse.Lat, MilanWarehouse.Lon, cinema.Latitudine.Value, cinema.Longitudine.Value);
                giorni = DaysFromKm(km);
                return (CostFromKm(km), giorni, AddWorkingDays(DateTime.UtcNow, giorni));
            }
            return (0, 0, AddWorkingDays(DateTime.UtcNow, 0));
        }
        var costo = CostFromCap(capDestinazione);
        giorni = DaysFromCap(capDestinazione);
        return (costo, giorni, AddWorkingDays(DateTime.UtcNow, giorni));
    }

    public decimal CostFromCap(string? cap)
    {
        if (string.IsNullOrWhiteSpace(cap)) return 5m;
        var first = cap.Trim()[0];
        if (first == '2') return 3m;   // Milano/Lombardia area
        if (first == '0' || first == '1') return 5m;  // Nord
        if (first >= '3' && first <= '5') return 8m;   // Centro
        return 12m;  // Sud e Isole
    }

    public int DaysFromCap(string? cap)
    {
        if (string.IsNullOrWhiteSpace(cap)) return 3;
        var first = cap.Trim()[0];
        if (first == '2') return 1;   // Milano: 1 giorno
        if (first == '0' || first == '1') return 2;  // Nord: 2 giorni
        if (first >= '3' && first <= '5') return 3;   // Centro: 3 giorni
        return 4;  // Sud/Isole: 4-5 giorni
    }

    public int DaysFromKm(double km)
    {
        if (km <= 3) return 0;   // Pickup same day
        if (km <= 50) return 1;  // 1 giorno
        if (km <= 150) return 2; // 2 giorni
        if (km <= 400) return 3; // 3 giorni
        return 5;                // 5 giorni
    }

    public decimal CostFromKm(double km)
    {
        if (km <= 3) return 0;
        if (km <= 50) return 3m;
        if (km <= 150) return 5m;
        if (km <= 400) return 8m;
        return 12m;
    }

    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        var R = 6371.0;
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRad(double deg) => deg * Math.PI / 180.0;

    // ═══════════════════════════════════
    //  Stima tempi di consegna realistici
    // ═══════════════════════════════════
    // - Giorni lavorativi: Lun–Ven
    // - Orario corriere: 9:00–18:00
    // - Cutoff spedizione: ore 16:00 (dopo le 16:00 parte il giorno lavorativo successivo)
    // - Se mancano < 2h alla chiusura (dopo le 16:00), il conteggio parte dal giorno dopo

    private static DateTime AddWorkingDays(DateTime startUtc, int days)
    {
        // Convert UTC to Italian time (UTC+1 / UTC+2)
        var italianTz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Rome");
        var local = TimeZoneInfo.ConvertTimeFromUtc(startUtc, italianTz);

        // Cutoff at 16:00 — if after cutoff, start from next working day
        if (local.Hour >= 16)
        {
            local = local.Date.AddDays(1).AddHours(9);
            while (local.DayOfWeek == DayOfWeek.Saturday || local.DayOfWeek == DayOfWeek.Sunday)
                local = local.AddDays(1);
        }
        else
        {
            local = local.Date.AddHours(9); // Next 9:00
            if (local <= TimeZoneInfo.ConvertTimeFromUtc(startUtc, italianTz))
                local = local.AddDays(1);
            while (local.DayOfWeek == DayOfWeek.Saturday || local.DayOfWeek == DayOfWeek.Sunday)
                local = local.AddDays(1);
        }

        // Add working days, skipping weekends
        for (int i = 0; i < days; i++)
        {
            local = local.AddDays(1);
            while (local.DayOfWeek == DayOfWeek.Saturday || local.DayOfWeek == DayOfWeek.Sunday)
                local = local.AddDays(1);
        }

        // Delivery between 9:00–18:00 → set to 14:00 (mid-delivery window)
        local = local.Date.AddHours(14);

        return TimeZoneInfo.ConvertTimeToUtc(local, italianTz);
    }

    public async Task<ShipmentTrackingDTO> GetTrackingAsync(int merchOrderId)
    {
        var order = await _db.MerchOrders.Include(o => o.Items).ThenInclude(i => i.MerchItem).Include(o => o.CinemaRitiro).FirstOrDefaultAsync(o => o.Id == merchOrderId);
        if (order is null) throw new KeyNotFoundException("Ordine non trovato.");

        var currentIdx = Array.IndexOf(StatusFlow, order.StatoSpedizione);
        var steps = StatusFlow.Select((s, i) => new ShipmentStepDTO
        {
            Stato = s,
            Label = GetStatusLabel(s),
            Completato = i <= currentIdx,
            Attivo = i == currentIdx,
            Data = i == 0 ? order.CreatedAtUtc :
                   i == 1 ? order.DataSpedizione :
                   i == 4 ? order.DataConsegnaEffettiva : null
        }).ToList();

        return new ShipmentTrackingDTO
        {
            OrdineId = order.Id,
            CodiceOrdine = order.CodiceOrdine ?? "",
            TrackingNumber = order.TrackingNumber,
            StatoSpedizione = order.StatoSpedizione,
            CostoSpedizione = order.CostoSpedizione,
            TipoConsegna = order.TipoConsegna,
            Destinazione = order.TipoConsegna == "Spedizione"
                ? $"{order.Indirizzo}, {order.CAP} {order.Citta} ({order.Provincia})"
                : order.CinemaRitiro?.Nome ?? "",
            DataConsegnaPrevista = order.DataConsegnaPrevista,
            DataConsegnaEffettiva = order.DataConsegnaEffettiva,
            Steps = steps
        };
    }

    private static string GetStatusLabel(string s) => s switch
    {
        "InAttesa" => "In attesa",
        "DaPreparare" => "Da preparare",
        "Pronto" => "Pronto",
        "Spedito" => "Spedito",
        "InTransito" => "In transito",
        "InCarico" => "Preso in carico",
        "InConsegna" => "In consegna",
        "Consegnato" => "Consegnato",
        _ => s
    };

}
