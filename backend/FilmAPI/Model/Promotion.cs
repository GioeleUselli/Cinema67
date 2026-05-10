using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class Promotion
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ImagePath { get; set; }

    [MaxLength(300)]
    public string? LinkUrl { get; set; }

    [Required]
    public PromotionType Type { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? Price { get; set; }

    public int? DiscountPercent { get; set; }

    [MaxLength(30)]
    public string? DiscountCode { get; set; }

    public int? MaxUsage { get; set; }

    public int UsageCount { get; set; }

    [Required]
    public bool Active { get; set; }

    [Required]
    public int Priority { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
