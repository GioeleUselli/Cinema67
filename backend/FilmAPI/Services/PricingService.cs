using FilmAPI.DTO;
using FilmAPI.Model;

namespace FilmAPI.Services;

public interface IPricingService
{
    decimal CalcolaPrezzo(TicketType tipo, decimal prezzoBase);
    List<PricingOptionDTO> GetPricingOptions(decimal prezzoBase);
}

public class PricingService : IPricingService
{
    private static readonly Dictionary<TicketType, decimal> Multipliers = new()
    {
        [TicketType.Intero] = 1.0m,
        [TicketType.Ridotto] = 0.7m,
        [TicketType.Bambino] = 0.5m,
        [TicketType.Over65] = 0.6m,
        [TicketType.Studente] = 0.8m
    };

    public decimal CalcolaPrezzo(TicketType tipo, decimal prezzoBase)
    {
        return TicketPriceNormalizer.NormalizeUnitPrice(prezzoBase * GetMultiplier(tipo));
    }

    public List<PricingOptionDTO> GetPricingOptions(decimal prezzoBase)
    {
        return Enum.GetValues<TicketType>().Select(tipo => new PricingOptionDTO
        {
            Tipo = tipo,
            Label = GetTicketTypeLabel(tipo),
            Prezzo = CalcolaPrezzo(tipo, prezzoBase),
            Moltiplicatore = GetMultiplier(tipo)
        }).ToList();
    }

    private static decimal GetMultiplier(TicketType tipo)
    {
        return Multipliers.TryGetValue(tipo, out var m) ? m : 1.0m;
    }

    private static string GetTicketTypeLabel(TicketType tipo)
    {
        return tipo switch
        {
            TicketType.Intero => "Intero",
            TicketType.Ridotto => "Ridotto",
            TicketType.Bambino => "Bambino",
            TicketType.Over65 => "Over 65",
            TicketType.Studente => "Studente",
            _ => "Intero"
        };
    }
}
