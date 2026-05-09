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
}

public class RiscattaPremioRequestDTO
{
    public int PremioId { get; set; }
}

public class ProcessaFestivitaDTO
{
    public string NomeFesta { get; set; } = string.Empty;
    public int PercentualeSconto { get; set; } = 15;
}
