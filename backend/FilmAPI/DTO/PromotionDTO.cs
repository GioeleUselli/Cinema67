using System.ComponentModel.DataAnnotations;

namespace FilmAPI.DTO;

public class PromotionCreateDTO
{
    [Required][MaxLength(150)] public string Title { get; set; } = string.Empty;
    [Required][MaxLength(2000)] public string Description { get; set; } = string.Empty;
    [MaxLength(500)] public string? ImagePath { get; set; }
    [MaxLength(300)] public string? LinkUrl { get; set; }
    [Required] public string Type { get; set; } = "MoviePromo";
    public decimal? Price { get; set; }
    public int? DiscountPercent { get; set; }
    [MaxLength(30)] public string? DiscountCode { get; set; }
    public int? MaxUsage { get; set; }
    public bool Active { get; set; } = true;
    public int Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class PromotionUpdateDTO
{
    [MaxLength(150)] public string? Title { get; set; }
    [MaxLength(2000)] public string? Description { get; set; }
    [MaxLength(500)] public string? ImagePath { get; set; }
    [MaxLength(300)] public string? LinkUrl { get; set; }
    public string? Type { get; set; }
    public decimal? Price { get; set; }
    public int? DiscountPercent { get; set; }
    public string? DiscountCode { get; set; }
    public int? MaxUsage { get; set; }
    public bool? Active { get; set; }
    public int? Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class PromotionDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public string? LinkUrl { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public int? DiscountPercent { get; set; }
    public string? DiscountCode { get; set; }
    public int? MaxUsage { get; set; }
    public int UsageCount { get; set; }
    public bool Active { get; set; }
    public int Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
