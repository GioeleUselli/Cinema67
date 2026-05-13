namespace FilmAPI.DTO;

public class PaccoDTO
{
    public int Id { get; set; }
    public int MerchOrderId { get; set; }
    public string CodiceOrdine { get; set; } = "";
    public string CodicePacco { get; set; } = "";
    public string CodiceInterno { get; set; } = "";
    public string? QrCodeData { get; set; }
    public string Stato { get; set; } = "";
    public int? PreparatoreId { get; set; }
    public string? PreparatoreNome { get; set; }
    public int? CorriereId { get; set; }
    public string? CorriereNome { get; set; }
    public string Destinazione { get; set; } = "";
    public List<PaccoItemDTO> Items { get; set; } = new();
    public DateTime? PresoInCaricoIl { get; set; }
    public DateTime? ConsegnatoIl { get; set; }
    public DateTime? TentataConsegnaIl { get; set; }
    public string? NoteCorriere { get; set; }
    public string? Firma { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class PaccoItemDTO
{
    public string Nome { get; set; } = "";
    public int Quantita { get; set; }
}
