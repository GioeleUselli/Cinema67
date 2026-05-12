using FilmAPI.Model;

namespace FilmAPI.DTO;

public class ShowDTO
{
    public int Id { get; set; }
    public int CinemaId { get; set; }
    public int SalaId { get; set; }
    public int FilmId { get; set; }
    public DateTime StartAtUtc { get; set; }
    public int DurataMinutiSnapshot { get; set; }
    public decimal PrezzoBase { get; set; }
    public decimal SupplementoSala { get; set; }
    public string? FilmTitolo { get; set; }
    public string? CinemaNome { get; set; }
    public string? SalaNome { get; set; }
    public TipoSala? SalaTipo { get; set; }
}

public class PricingOptionDTO
{
    public TicketType Tipo { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Prezzo { get; set; }
    public decimal Moltiplicatore { get; set; }
}

public class ShowPagedResultDTO
{
    public List<ShowDTO> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}

public class ShowCreateDTO
{
    public int CinemaId { get; set; }
    public int SalaId { get; set; }
    public int FilmId { get; set; }
    public DateTime StartAtUtc { get; set; }
    public int? DurataMinutiSnapshot { get; set; }
    public decimal? PrezzoBase { get; set; }
}

public class ShowUpdateDTO
{
    public int? CinemaId { get; set; }
    public int? SalaId { get; set; }
    public int? FilmId { get; set; }
    public DateTime? StartAtUtc { get; set; }
    public int? DurataMinutiSnapshot { get; set; }
    public decimal? PrezzoBase { get; set; }
}
