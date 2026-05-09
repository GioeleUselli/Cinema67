namespace FilmAPI.DTO;

public class NewsletterIscrizioneDTO
{
    public string Email { get; set; } = string.Empty;
}

public class NewsletterRisultatoDTO
{
    public string Messaggio { get; set; } = string.Empty;
    public string CodiceSconto { get; set; } = string.Empty;
    public int PercentualeSconto { get; set; } = 15;
}

public class NewsletterSubscriberDTO
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string CodiceSconto { get; set; } = string.Empty;
    public bool ScontoUsato { get; set; }
    public DateTime IscrittoIl { get; set; }
}

public class NewsletterInvioDTO
{
    public string Oggetto { get; set; } = string.Empty;
    public string Contenuto { get; set; } = string.Empty;
    public List<int>? SubscriberIds { get; set; }
    public DateTime? ScheduledAt { get; set; }
}

public class NewsletterScheduledDTO
{
    public int Id { get; set; }
    public string Oggetto { get; set; } = string.Empty;
    public DateTime? ScheduledAt { get; set; }
    public DateTime? SentAt { get; set; }
    public int Inviati { get; set; }
    public int Totale { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
