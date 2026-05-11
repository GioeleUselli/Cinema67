namespace FilmAPI.DTO;

public class PartyBookingCreateDTO
{
    public int CinemaId { get; set; }
    public string? NomeFesta { get; set; }
    public string Tipo { get; set; } = "MovieParty";
    public string Pacchetto { get; set; } = "Basic";
    public int NumeroOspiti { get; set; }
    public DateTime DataEvento { get; set; }
    public DateTime OraInizio { get; set; }
    public DateTime OraFine { get; set; }
    public string? RichiesteSpeciali { get; set; }
    public string MetodoPagamento { get; set; } = "credito";
}

public class PartyBookingDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserNome { get; set; } = string.Empty;
    public int CinemaId { get; set; }
    public string CinemaNome { get; set; } = string.Empty;
    public int? FilmId { get; set; }
    public string? FilmTitolo { get; set; }
    public string? NomeFesta { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Pacchetto { get; set; } = string.Empty;
    public int NumeroOspiti { get; set; }
    public DateTime DataEvento { get; set; }
    public DateTime OraInizio { get; set; }
    public DateTime OraFine { get; set; }
    public string? RichiesteSpeciali { get; set; }
    public decimal Totale { get; set; }
    public string Stato { get; set; } = string.Empty;
    public DateTime? ConfermatoIl { get; set; }
    public DateTime? CompletatoIl { get; set; }
    public string? QrCodeData { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class PartyFeedbackDTO
{
    public int PartyBookingId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
