namespace FilmAPI.DTO;

public class MerchItemDTO
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public string? Descrizione { get; set; }
    public decimal Prezzo { get; set; }
    public string Categoria { get; set; } = "";
    public string? ImmaginePath { get; set; }
    public List<string> Immagini { get; set; } = new();
    public List<MerchItemVariantDTO> Varianti { get; set; } = new();
    public int Stock { get; set; }
    public bool Attivo { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class MerchItemVariantDTO
{
    public int Id { get; set; }
    public int MerchItemId { get; set; }
    public string? Colore { get; set; }
    public string? Taglia { get; set; }
    public int Stock { get; set; }
    public decimal? Prezzo { get; set; }
}

public class MerchOrderItemRequestDTO
{
    public int MerchItemId { get; set; }
    public int? VariantId { get; set; }
    public int Quantita { get; set; } = 1;
}

public class MerchOrderCreateDTO
{
    public List<MerchOrderItemRequestDTO> Items { get; set; } = new();
    public string? DiscountCode { get; set; }
    public string TipoConsegna { get; set; } = "RitiroCinema";
    public string? Indirizzo { get; set; }
    public string? Citta { get; set; }
    public string? CAP { get; set; }
    public string? Provincia { get; set; }
    public string? Telefono { get; set; }
    public int? CinemaRitiroId { get; set; }
}

public class MerchDiscountValidateDTO
{
    public string Codice { get; set; } = "";
    public decimal PercentualeSconto { get; set; }
    public decimal ValoreScontoFisso { get; set; }
    public bool Valido { get; set; }
    public string? Messaggio { get; set; }
    public decimal TotaleScontato { get; set; }
}

public class MerchOrderItemDetailDTO
{
    public int Id { get; set; }
    public int MerchItemId { get; set; }
    public string Nome { get; set; } = "";
    public string? ImmaginePath { get; set; }
    public int Quantita { get; set; }
    public decimal PrezzoUnitario { get; set; }
    public decimal SubTotale { get; set; }
}

public class MerchOrderDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? UserEmail { get; set; }
    public decimal Totale { get; set; }
    public string Stato { get; set; } = "";
    public string? CodiceOrdine { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public decimal ImportoCarta { get; set; }
    public decimal ImportoCredito { get; set; }
    public DateTime? CheckoutExpiresAtUtc { get; set; }
    public string? LastPaymentError { get; set; }
    public string TipoConsegna { get; set; } = "RitiroCinema";
    public string? Indirizzo { get; set; }
    public string? Citta { get; set; }
    public string? CAP { get; set; }
    public string? Provincia { get; set; }
    public string? Telefono { get; set; }
    public int? CinemaRitiroId { get; set; }
    public string? CinemaRitiroNome { get; set; }
    public string? Destinazione { get; set; }
    public decimal CostoSpedizione { get; set; }
    public string StatoSpedizione { get; set; } = "Preparazione";
    public string? TrackingNumber { get; set; }
    public DateTime? DataConsegnaPrevista { get; set; }
    public List<MerchOrderItemDetailDTO> Items { get; set; } = new();
}

public class ShipmentTrackingDTO
{
    public int OrdineId { get; set; }
    public string CodiceOrdine { get; set; } = "";
    public string? TrackingNumber { get; set; }
    public string StatoSpedizione { get; set; } = "";
    public decimal CostoSpedizione { get; set; }
    public string TipoConsegna { get; set; } = "";
    public string Destinazione { get; set; } = "";
    public DateTime? DataConsegnaPrevista { get; set; }
    public DateTime? DataConsegnaEffettiva { get; set; }
    public List<ShipmentStepDTO> Steps { get; set; } = new();
}

public class ShipmentStepDTO
{
    public string Stato { get; set; } = "";
    public string Label { get; set; } = "";
    public bool Completato { get; set; }
    public bool Attivo { get; set; }
    public DateTime? Data { get; set; }
}

public class MerchOrderStatusDTO
{
    public string Stato { get; set; } = "Paid";
}

public class PayMerchOrderRequestDTO
{
    public string MetodoPagamento { get; set; } = "Carta";
    public decimal ImportoCreditoRichiesto { get; set; }
}

public class PayMerchOrderResponseDTO
{
    public string StatoPagamento { get; set; } = "";
    public MerchOrderDTO? Ordine { get; set; }
    public string? StripePaymentIntentId { get; set; }
}

public class CreateMerchCheckoutSessionRequestDTO
{
    public string MetodoPagamento { get; set; } = "Carta";
    public decimal ImportoCreditoRichiesto { get; set; }
}

public class CreateMerchCheckoutSessionResponseDTO
{
    public string StripeCheckoutUrl { get; set; } = "";
    public string StripeCheckoutSessionId { get; set; } = "";
}

public class MerchCheckoutStatusDTO
{
    public string Stato { get; set; } = "";
    public MerchOrderDTO? Ordine { get; set; }
}

public class PayPalOrderResponseDTO
{
    public string PayPalOrderId { get; set; } = "";
    public string ApprovalUrl { get; set; } = "";
}
