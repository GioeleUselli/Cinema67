using System.ComponentModel.DataAnnotations;

namespace FilmAPI.Model;

public class NewsletterSubscriber
{
    [Key]
    public int Id { get; set; }

    [Required][MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required][MaxLength(30)]
    public string CodiceSconto { get; set; } = string.Empty;

    public bool ScontoUsato { get; set; }

    [Required]
    public DateTime IscrittoIl { get; set; }
}
