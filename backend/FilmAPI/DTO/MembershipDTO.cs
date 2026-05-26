using System.ComponentModel.DataAnnotations;

namespace FilmAPI.DTO;

public class MembershipCardDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string CardNumber { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public decimal PuntiTotali { get; set; }
    public decimal PuntiDisponibili { get; set; }
    public decimal PuntiPerProssimoTier { get; set; }
    public string ProssimoTier { get; set; } = string.Empty;
    public int PercentualeProgresso { get; set; }
    public bool IsAttiva { get; set; }
    public DateTime? DataScadenzaAbbonamento { get; set; }
    public DateTime? DataNascita { get; set; }
    public string? Via { get; set; }
    public string? Citta { get; set; }
    public string? Cap { get; set; }
    public string? Provincia { get; set; }
    public DateTime DataIscrizione { get; set; }
    public string? QrCodeData { get; set; }
}

public class MembershipUpdateDTO
{
    public DateTime? DataNascita { get; set; }
    public string? Via { get; set; }
    public string? Citta { get; set; }
    public string? Cap { get; set; }
    public string? Provincia { get; set; }
}

public class PuntiMovimentoDTO
{
    public int Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public decimal Punti { get; set; }
    public decimal SaldoPre { get; set; }
    public decimal SaldoPost { get; set; }
    public string? RiferimentoTipo { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class PremioDTO
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descrizione { get; set; }
    public decimal CostoPunti { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public decimal Valore { get; set; }
    public bool Attivo { get; set; }
    public int QuantitaDisponibile { get; set; }
    public string? ImmaginePath { get; set; }
    public int? MerchItemId { get; set; }
    public string? MerchItemNome { get; set; }
}

public class PremioRiscattoDTO
{
    public int Id { get; set; }
    public string PremioNome { get; set; } = string.Empty;
    public string PremioTipo { get; set; } = string.Empty;
    public decimal PuntiSpesi { get; set; }
    public string Codice { get; set; } = string.Empty;
    public string Stato { get; set; } = string.Empty;
    public decimal Valore { get; set; }
    public DateTime DataRiscatto { get; set; }
    public DateTime? DataScadenza { get; set; }
    public string? Taglia { get; set; }
    public string? CodiceVoucher { get; set; }
    public int? MerchOrderId { get; set; }
    public int? GiftCardId { get; set; }
    public string? GiftCardCodice { get; set; }
    public string? PremioDescrizione { get; set; }
    public int? MerchItemId { get; set; }
    public string? MerchItemNome { get; set; }
}

public class CreatePremioDTO
{
    [Required][MaxLength(150)]
    public string Nome { get; set; } = string.Empty;
    [MaxLength(500)] public string? Descrizione { get; set; }
    [Required][Range(1, 99999)] public decimal CostoPunti { get; set; }
    [Required] public string Tipo { get; set; } = "Sconto";
    [Required][Range(0, 99999)] public decimal Valore { get; set; }
    public bool Attivo { get; set; } = true;
    public int QuantitaDisponibile { get; set; } = -1;
    [MaxLength(500)] public string? ImmaginePath { get; set; }
    public int? MerchItemId { get; set; }
}

public class UpdatePremioDTO
{
    [MaxLength(150)] public string? Nome { get; set; }
    [MaxLength(500)] public string? Descrizione { get; set; }
    [Range(1, 99999)] public decimal? CostoPunti { get; set; }
    public string? Tipo { get; set; }
    [Range(0, 99999)] public decimal? Valore { get; set; }
    public bool? Attivo { get; set; }
    public int? QuantitaDisponibile { get; set; }
    [MaxLength(500)] public string? ImmaginePath { get; set; }
    public int? MerchItemId { get; set; }
}

public class RiscattaPremioRequestDTO
{
    public int PremioId { get; set; }
}

public class ScanAcquistoDTO
{
    [Required] public string CodiceCarta { get; set; } = "";
    [Required][Range(0.01, 99999)] public decimal Importo { get; set; }
    public string? Note { get; set; }
}

public class CompletaMerchPremioDTO
{
    [Required] public int RiscattoId { get; set; }
    public string? Taglia { get; set; }
    public int? IndirizzoId { get; set; }
    public string TipoConsegna { get; set; } = "RitiroCinema";
    public int? CinemaRitiroId { get; set; }
    public string? Indirizzo { get; set; }
    public string? Citta { get; set; }
    public string? CAP { get; set; }
    public string? Provincia { get; set; }
    public string? Telefono { get; set; }
}

public class ScanAcquistoResultDTO
{
    public string UserNome { get; set; } = "";
    public string CardNumber { get; set; } = "";
    public decimal PuntiAccumulati { get; set; }
    public decimal PuntiTotali { get; set; }
    public decimal PuntiDisponibili { get; set; }
}

public class ProcessaFestivitaDTO
{
    public string NomeFesta { get; set; } = string.Empty;
    public int PercentualeSconto { get; set; } = 15;
}
