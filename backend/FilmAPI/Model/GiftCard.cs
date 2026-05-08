using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public enum GiftCardStato { Attiva = 0, Riscattata = 1, Scaduta = 2, Disattivata = 3 }

public class GiftCard
{
    [Key]
    public int Id { get; set; }

    [Required][MaxLength(30)]
    public string Codice { get; set; } = string.Empty;

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal ValoreIniziale { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal SaldoResiduo { get; set; }

    [Required]
    public GiftCardStato Stato { get; set; }

    public int? AcquirenteUserId { get; set; }
    [ForeignKey(nameof(AcquirenteUserId))]
    public User? AcquirenteUser { get; set; }

    public int? RiscattataDaUserId { get; set; }
    [ForeignKey(nameof(RiscattataDaUserId))]
    public User? RiscattataDaUser { get; set; }

    public int? OrdineId { get; set; }
    [ForeignKey(nameof(OrdineId))]
    public Ordine? Ordine { get; set; }

    [MaxLength(255)]
    public string? DestinatarioEmail { get; set; }

    [MaxLength(500)]
    public string? Messaggio { get; set; }

    public DateTime? DataInvioProgrammato { get; set; }

    public DateTime? InviataIl { get; set; }

    [Required]
    public DateTime DataAcquisto { get; set; }

    public DateTime? DataRiscatto { get; set; }

    [Required]
    public DateTime DataScadenza { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}
