using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public enum PartyType { MovieParty = 0, GameRoom = 1, Both = 2 }
public enum PartyPackage { Basic = 0, Premium = 1, Vip = 2 }
public enum PartyStatus { Pending = 0, Confirmed = 1, Completed = 2, Cancelled = 3 }

public class PartyBooking
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    public int CinemaId { get; set; }

    [ForeignKey(nameof(CinemaId))]
    public Cinema? Cinema { get; set; }

    public int? FilmId { get; set; }

    [ForeignKey(nameof(FilmId))]
    public Film? Film { get; set; }

    [MaxLength(200)]
    public string? NomeFesta { get; set; }

    [Required]
    public PartyType Tipo { get; set; }

    [Required]
    public PartyPackage Pacchetto { get; set; }

    [Required]
    public int NumeroOspiti { get; set; }

    [Required]
    public DateTime DataEvento { get; set; }

    [Required]
    public DateTime OraInizio { get; set; }

    [Required]
    public DateTime OraFine { get; set; }

    public int? OrdineId { get; set; }
    [ForeignKey(nameof(OrdineId))]
    public Ordine? Ordine { get; set; }

    [MaxLength(1000)]
    public string? RichiesteSpeciali { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal Totale { get; set; }

    [Required]
    public PartyStatus Stato { get; set; }

    public DateTime? ConfermatoIl { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }
}
