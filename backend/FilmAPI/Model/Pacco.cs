using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class Pacco
{
    [Key] public int Id { get; set; }

    [Required] public int MerchOrderId { get; set; }
    [ForeignKey(nameof(MerchOrderId))] public MerchOrder? MerchOrder { get; set; }

    [Required][MaxLength(20)] public string CodicePacco { get; set; } = "";
    [Required][MaxLength(20)] public string CodiceInterno { get; set; } = "";
    [MaxLength(500)] public string? QrCodeData { get; set; }

    [MaxLength(30)] public string Stato { get; set; } = "DaPreparare";

    public int? PreparatoreId { get; set; }
    [ForeignKey(nameof(PreparatoreId))] public User? Preparatore { get; set; }

    public int? CorriereId { get; set; }
    [ForeignKey(nameof(CorriereId))] public User? Corriere { get; set; }

    public DateTime? PresoInCaricoIl { get; set; }
    public DateTime? ConsegnatoIl { get; set; }
    public DateTime? TentataConsegnaIl { get; set; }

    [MaxLength(300)] public string? NoteCorriere { get; set; }
    [MaxLength(100)] public string? Firma { get; set; } // nome di chi ha ritirato

    public DateTime CreatedAtUtc { get; set; }
}

public static class PaccoStati
{
    public const string InAttesa = "InAttesa";
    public const string DaPreparare = "DaPreparare";
    public const string Pronto = "Pronto";
    public const string InCarico = "InCarico";
    public const string InConsegna = "InConsegna";
    public const string Consegnato = "Consegnato";
    public const string MancataConsegna = "MancataConsegna";

    public static readonly string[] FlussoTracking = { InAttesa, Pronto, InCarico, InConsegna, Consegnato };
}
