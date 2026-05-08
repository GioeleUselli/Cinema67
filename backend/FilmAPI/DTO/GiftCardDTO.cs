namespace FilmAPI.DTO;

public class GiftCardAcquistoRequestDTO
{
    public decimal Importo { get; set; }
    public int Quantita { get; set; } = 1;
    public string? DestinatarioEmail { get; set; }
    public string? Messaggio { get; set; }
    public DateTime? DataInvioProgrammato { get; set; }
    public string MetodoPagamento { get; set; } = "credito"; // "credito" | "carta" | "misto"
}

public class GiftCardCartItemDTO
{
    public decimal Importo { get; set; }
    public int Quantita { get; set; } = 1;
    public string? DestinatarioEmail { get; set; }
    public string? Messaggio { get; set; }
    public DateTime? DataInvioProgrammato { get; set; }
}

public class GiftCardCartAcquistoRequestDTO
{
    public List<GiftCardCartItemDTO> Items { get; set; } = new();
    public string? DestinatarioEmail { get; set; }
    public string? Messaggio { get; set; }
    public DateTime? DataInvioProgrammato { get; set; }
    public string MetodoPagamento { get; set; } = "credito";
}

public class GiftCardRiscattoRequestDTO
{
    public string Codice { get; set; } = string.Empty;
}

public class ConfermaStripeDTO
{
    public string SessionId { get; set; } = string.Empty;
}

public class GiftCardDTO
{
    public int Id { get; set; }
    public string Codice { get; set; } = string.Empty;
    public decimal ValoreIniziale { get; set; }
    public decimal SaldoResiduo { get; set; }
    public string Stato { get; set; } = string.Empty;
    public string? AcquirenteEmail { get; set; }
    public string? RiscattataDaEmail { get; set; }
    public string? DestinatarioEmail { get; set; }
    public string? Messaggio { get; set; }
    public DateTime? DataInvioProgrammato { get; set; }
    public DateTime? InviataIl { get; set; }
    public DateTime DataAcquisto { get; set; }
    public DateTime? DataRiscatto { get; set; }
    public DateTime DataScadenza { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public string? Note { get; set; }
}

public class GiftCardRiscattoResultDTO
{
    public GiftCardDTO GiftCard { get; set; } = new();
    public decimal CreditoAccreditato { get; set; }
    public decimal NuovoSaldo { get; set; }
}

public class GiftCardAcquistoResultDTO
{
    public List<GiftCardDTO> GiftCards { get; set; } = new();
    public decimal TotaleSpeso { get; set; }
    public decimal NuovoSaldoCredito { get; set; }
    public string? StripeCheckoutUrl { get; set; }
}
