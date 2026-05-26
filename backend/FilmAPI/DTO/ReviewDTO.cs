using System.ComponentModel.DataAnnotations;

namespace FilmAPI.DTO;

public class RecensioneDTO
{
    public int Id { get; set; }
    public int Voto { get; set; }
    public string Testo { get; set; } = "";
    public string UserNome { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; }
}

public class RecensioneAdminDTO
{
    public int Id { get; set; }
    public int FilmId { get; set; }
    public string FilmTitolo { get; set; } = "";
    public string UserNome { get; set; } = "";
    public int Voto { get; set; }
    public string Testo { get; set; } = "";
    public string Stato { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; }
}

public class RecensioneCreateDTO
{
    [Range(1, 10)]
    public int Voto { get; set; }

    [MaxLength(2000)]
    public string Testo { get; set; } = "";
}

public class TmdbReviewDTO
{
    public string Autore { get; set; } = "";
    public string? Contenuto { get; set; }
    public double? Voto { get; set; }
    public DateTime DataCreazione { get; set; }
}
