using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class FoodItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nome { get; set; } = "";

    [MaxLength(300)]
    public string? Descrizione { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Prezzo { get; set; }

    [Required]
    [MaxLength(30)]
    public string Categoria { get; set; } = "Snack";

    [MaxLength(500)]
    public string? ImmaginePath { get; set; }

    public bool Attivo { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; }
}

public class FoodOrderItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int OrdineId { get; set; }

    [ForeignKey(nameof(OrdineId))]
    public Ordine? Ordine { get; set; }

    [Required]
    public int FoodItemId { get; set; }

    [ForeignKey(nameof(FoodItemId))]
    public FoodItem? FoodItem { get; set; }

    public int Quantita { get; set; } = 1;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal PrezzoUnitario { get; set; }

    public bool Servito { get; set; }
}
