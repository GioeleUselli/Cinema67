namespace FilmAPI.DTO;

public class MerchItemDTO
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public string? Descrizione { get; set; }
    public decimal Prezzo { get; set; }
    public string Categoria { get; set; } = "";
    public string? ImmaginePath { get; set; }
    public int Stock { get; set; }
    public bool Attivo { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class MerchOrderItemRequestDTO
{
    public int MerchItemId { get; set; }
    public int Quantita { get; set; } = 1;
}

public class MerchOrderCreateDTO
{
    public List<MerchOrderItemRequestDTO> Items { get; set; } = new();
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
    public List<MerchOrderItemDetailDTO> Items { get; set; } = new();
}

public class MerchOrderStatusDTO
{
    public string Stato { get; set; } = "Paid";
}
