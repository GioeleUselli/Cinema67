using System.ComponentModel.DataAnnotations;

namespace FilmAPI.Model;

public class NewsletterScheduled
{
    [Key]
    public int Id { get; set; }

    [Required][MaxLength(200)]
    public string Oggetto { get; set; } = string.Empty;

    [Required]
    public string Contenuto { get; set; } = string.Empty;

    public DateTime? ScheduledAt { get; set; }

    public DateTime? SentAt { get; set; }

    public int Inviati { get; set; }

    public int Totale { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }
}
