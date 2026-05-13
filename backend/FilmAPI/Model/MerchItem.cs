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
    public ICollection<MerchItemImage> Immagini { get; set; } = new List<MerchItemImage>();
    public ICollection<MerchItemVariant> Varianti { get; set; } = new List<MerchItemVariant>();
}

public class MerchItemImage
{
    [Key] public int Id { get; set; }
    [Required] public int MerchItemId { get; set; }
    [ForeignKey(nameof(MerchItemId))] public MerchItem? MerchItem { get; set; }
    [Required][MaxLength(500)] public string Path { get; set; } = "";
    public int Ordine { get; set; } = 0;
}

public class MerchItemVariant
{
    [Key] public int Id { get; set; }
    [Required] public int MerchItemId { get; set; }
    [ForeignKey(nameof(MerchItemId))] public MerchItem? MerchItem { get; set; }
    [MaxLength(50)] public string? Colore { get; set; }
    [MaxLength(20)] public string? Taglia { get; set; }
    public int Stock { get; set; } = 0;
    [Column(TypeName = "decimal(10,2)")] public decimal? Prezzo { get; set; }
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
    [Column(TypeName = "decimal(10,2)")] public decimal ImportoCarta { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal ImportoCredito { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal CreditoRiservato { get; set; }
    [MaxLength(100)] public string? StripePaymentIntentId { get; set; }
    [MaxLength(100)] public string? StripeCheckoutSessionId { get; set; }
    public DateTime? CheckoutExpiresAtUtc { get; set; }
    public DateTime? PaidAtUtc { get; set; }
    [MaxLength(500)] public string? LastPaymentError { get; set; }

    // Delivery
    [MaxLength(30)] public string TipoConsegna { get; set; } = "RitiroCinema";
    [MaxLength(200)] public string? Indirizzo { get; set; }
    [MaxLength(100)] public string? Citta { get; set; }
    [MaxLength(10)] public string? CAP { get; set; }
    [MaxLength(50)] public string? Provincia { get; set; }
    [MaxLength(20)] public string? Telefono { get; set; }
    public int? CinemaRitiroId { get; set; }
    [ForeignKey(nameof(CinemaRitiroId))] public Cinema? CinemaRitiro { get; set; }

    // Shipping
    [Column(TypeName = "decimal(10,2)")] public decimal CostoSpedizione { get; set; }
    [MaxLength(50)] public string StatoSpedizione { get; set; } = "Preparazione";
    [MaxLength(30)] public string? TrackingNumber { get; set; }
    public DateTime? DataSpedizione { get; set; }
    public DateTime? DataConsegnaPrevista { get; set; }
    public DateTime? DataConsegnaEffettiva { get; set; }

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

public class MerchDiscountCode
{
    [Key] public int Id { get; set; }
    [Required][MaxLength(50)] public string Codice { get; set; } = "";
    [Column(TypeName = "decimal(5,2)")] public decimal PercentualeSconto { get; set; } = 10;
    public bool Attivo { get; set; } = true;
    public DateTime? ScadeIl { get; set; }
    public int MaxUtilizzi { get; set; } = 100;
    public int Utilizzi { get; set; } = 0;
    public DateTime CreatedAtUtc { get; set; }
}
