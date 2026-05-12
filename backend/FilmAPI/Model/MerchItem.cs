using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class MerchItem
{
    [Key] public int Id { get; set; }
    [Required][MaxLength(150)] public string Nome { get; set; } = "";
    [MaxLength(500)] public string? Descrizione { get; set; }
    [Required][Column(TypeName = "decimal(10,2)")] public decimal Prezzo { get; set; }
    [MaxLength(50)] public string Categoria { get; set; } = "Abbigliamento";
    [MaxLength(500)] public string? ImmaginePath { get; set; }
    public int Stock { get; set; } = 10;
    public bool Attivo { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
    public ICollection<MerchOrderItem> OrderItems { get; set; } = new List<MerchOrderItem>();
}

public class MerchOrder
{
    [Key] public int Id { get; set; }
    [Required] public int UserId { get; set; }
    [ForeignKey(nameof(UserId))] public User? User { get; set; }
    [Required][Column(TypeName = "decimal(10,2)")] public decimal Totale { get; set; }
    [MaxLength(50)] public string Stato { get; set; } = "Pending";
    [MaxLength(30)] public string? CodiceOrdine { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public ICollection<MerchOrderItem> Items { get; set; } = new List<MerchOrderItem>();
}

public class MerchOrderItem
{
    [Key] public int Id { get; set; }
    [Required] public int MerchOrderId { get; set; }
    [ForeignKey(nameof(MerchOrderId))] public MerchOrder? MerchOrder { get; set; }
    [Required] public int MerchItemId { get; set; }
    [ForeignKey(nameof(MerchItemId))] public MerchItem? MerchItem { get; set; }
    public int Quantita { get; set; } = 1;
    [Required][Column(TypeName = "decimal(10,2)")] public decimal PrezzoUnitario { get; set; }
}
