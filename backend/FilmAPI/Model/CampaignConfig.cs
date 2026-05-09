using System.ComponentModel.DataAnnotations;

namespace FilmAPI.Model;

public class CampaignConfig
{
    [Key]
    public int Id { get; set; }

    [Required][MaxLength(50)]
    public string Tipo { get; set; } = string.Empty; // "compleanno", "festivita"

    [MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    public bool Attiva { get; set; } = true;

    public int PercentualeSconto { get; set; } = 20;

    [MaxLength(1000)]
    public string? MessaggioPersonalizzato { get; set; }

    public int GiorniPrima { get; set; } = 3;

    public int? Mese { get; set; }
    public int? Giorno { get; set; }

    public DateTime? UltimaEsecuzione { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }
}
