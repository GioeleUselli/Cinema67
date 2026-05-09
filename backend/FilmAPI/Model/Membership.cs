using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public enum TierMembership { Base = 0, Silver = 1, Gold = 2, Platinum = 3 }

public enum TipoPuntiMovimento { Acquisto = 0, Bonus = 1, Riscatto = 2, Scaduti = 3, Regalo = 4, Adjust = 5 }

public enum TipoPremio { Sconto = 0, Biglietto = 1, Upgrade = 2, GiftCard = 3 }

public enum StatoRiscatto { Attivo = 0, Usato = 1, Scaduto = 2 }

public class MembershipCard
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required][MaxLength(30)]
    public string CardNumber { get; set; } = string.Empty;

    [Required]
    public TierMembership Tier { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal PuntiTotali { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal PuntiDisponibili { get; set; }

    [Required]
    public DateTime DataIscrizione { get; set; }

    [Required]
    public bool IsAttiva { get; set; }

    public DateTime? DataScadenzaAbbonamento { get; set; }

    [MaxLength(200)]
    public string? QrCodeData { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }

    public DateTime? AttivataIl { get; set; }

    public DateTime? DataNascita { get; set; }

    [MaxLength(200)]
    public string? Via { get; set; }

    [MaxLength(100)]
    public string? Citta { get; set; }

    [MaxLength(10)]
    public string? Cap { get; set; }

    [MaxLength(5)]
    public string? Provincia { get; set; }
}

public class PuntiMovimento
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    public int? MembershipCardId { get; set; }

    [ForeignKey(nameof(MembershipCardId))]
    public MembershipCard? MembershipCard { get; set; }

    [Required]
    public TipoPuntiMovimento Tipo { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal Punti { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal SaldoPre { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal SaldoPost { get; set; }

    public int? RiferimentoId { get; set; }

    [MaxLength(50)]
    public string? RiferimentoTipo { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }
}

public class Premio
{
    [Key]
    public int Id { get; set; }

    [Required][MaxLength(150)]
    public string Nome { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descrizione { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal CostoPunti { get; set; }

    [Required]
    public TipoPremio Tipo { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal Valore { get; set; }

    [Required]
    public bool Attivo { get; set; } = true;

    public int QuantitaDisponibile { get; set; } = -1; // -1 = unlimited

    [MaxLength(500)]
    public string? ImmaginePath { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }
}

public class PremioRiscatto
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    public int PremioId { get; set; }

    [ForeignKey(nameof(PremioId))]
    public Premio? Premio { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal PuntiSpesi { get; set; }

    [Required][MaxLength(30)]
    public string Codice { get; set; } = string.Empty;

    [Required]
    public StatoRiscatto Stato { get; set; }

    [Required]
    public DateTime DataRiscatto { get; set; }

    public DateTime? DataScadenza { get; set; }

    public DateTime? DataUtilizzo { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }
}
