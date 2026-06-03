using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface INewsletterService
{
    Task<NewsletterRisultatoDTO> IscrivitiAsync(string email);
    Task<bool> VerificaScontoAsync(string codice);
    Task UsaScontoAsync(string codice);
    Task<List<NewsletterSubscriberDTO>> GetAllSubscribersAsync();
    Task<bool> RimuoviIscrittoAsync(int id);
    Task<int> InviaNewsletterAsync(string oggetto, string contenuto, List<int>? subscriberIds = null, bool usaTemplate = true);
    Task<List<NewsletterScheduledDTO>> GetScheduledAsync();
    Task ProcessScheduledAsync();
    Task ScheduleAsync(string oggetto, string contenuto, DateTime scheduledAt, List<int>? subscriberIds);
}

public class NewsletterService : INewsletterService
{
    private readonly FilmDbContext _db;
    private readonly IEmailService _emailService;

    public NewsletterService(FilmDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async Task<NewsletterRisultatoDTO> IscrivitiAsync(string email)
    {
        email = email.Trim().ToLower();
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new ArgumentException("Email non valida.");

        var exists = await _db.NewsletterSubscribers.AnyAsync(s => s.Email == email);
        if (exists)
            throw new InvalidOperationException("Sei già iscritto alla newsletter!");

        var codice = GeneraCodiceSconto();
        var subscriber = new NewsletterSubscriber
        {
            Email = email,
            CodiceSconto = codice,
            ScontoUsato = false,
            IscrittoIl = DateTime.UtcNow
        };

        _db.NewsletterSubscribers.Add(subscriber);
        await _db.SaveChangesAsync();

        // Send email with discount code
        try
        {
            var html = EmailTemplateHelper.Wrap("Newsletter",
                $@"<p style=""font-size:14px;margin:0 0 12px;"">Grazie per esserti iscritto alla newsletter di Cinema67!</p>
<p style=""font-size:14px;margin:0 0 16px;"">Ecco il tuo <strong style=""color:#d4af37;"">codice sconto del 15%</strong> sul primo acquisto:</p>
{EmailTemplateHelper.CodeBox(codice)}
<p style=""font-size:13px;color:#a89888;margin:0;"">Usalo al checkout per ottenere il 15% di sconto. Valido una volta sola.</p>");
            await _emailService.SendHtmlEmailAsync(email, "Cinema67 - Il tuo codice sconto del 15%", html);
        }
        catch { /* email sending is best-effort */ }

        return new NewsletterRisultatoDTO
        {
            Messaggio = "Iscrizione completata! Usa il codice sconto sul tuo primo acquisto.",
            CodiceSconto = codice,
            PercentualeSconto = 15
        };
    }

    public async Task<bool> VerificaScontoAsync(string codice)
    {
        var sub = await _db.NewsletterSubscribers.FirstOrDefaultAsync(s => s.CodiceSconto == codice.Trim().ToUpper());
        return sub != null && !sub.ScontoUsato;
    }

    public async Task UsaScontoAsync(string codice)
    {
        var sub = await _db.NewsletterSubscribers.FirstOrDefaultAsync(s => s.CodiceSconto == codice.Trim().ToUpper());
        if (sub != null && !sub.ScontoUsato)
        {
            sub.ScontoUsato = true;
            await _db.SaveChangesAsync();
        }
    }

    public async Task<List<NewsletterSubscriberDTO>> GetAllSubscribersAsync()
    {
        return await _db.NewsletterSubscribers
            .OrderByDescending(s => s.IscrittoIl)
            .Select(s => new NewsletterSubscriberDTO
            {
                Id = s.Id,
                Email = s.Email,
                CodiceSconto = s.CodiceSconto,
                ScontoUsato = s.ScontoUsato,
                IscrittoIl = s.IscrittoIl
            })
            .ToListAsync();
    }

    public async Task<bool> RimuoviIscrittoAsync(int id)
    {
        var sub = await _db.NewsletterSubscribers.FindAsync(id);
        if (sub == null) return false;
        _db.NewsletterSubscribers.Remove(sub);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> InviaNewsletterAsync(string oggetto, string contenuto, List<int>? subscriberIds = null, bool usaTemplate = true)
    {
        var subscribers = subscriberIds != null && subscriberIds.Count > 0
            ? await _db.NewsletterSubscribers.Where(s => subscriberIds.Contains(s.Id)).ToListAsync()
            : await _db.NewsletterSubscribers.ToListAsync();

        int inviati = 0;
        foreach (var sub in subscribers)
        {
            try
            {
                var body = usaTemplate ? WrapInTemplate(contenuto, sub.Email, sub.CodiceSconto) : contenuto;
                await _emailService.SendHtmlEmailAsync(sub.Email, oggetto, body);
                inviati++;
            }
            catch { }
        }
        return inviati;
    }

    public async Task ScheduleAsync(string oggetto, string contenuto, DateTime scheduledAt, List<int>? subscriberIds)
    {
        var scheduled = new NewsletterScheduled
        {
            Oggetto = oggetto,
            Contenuto = contenuto,
            ScheduledAt = scheduledAt,
            Totale = subscriberIds?.Count ?? 0,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.NewsletterScheduleds.Add(scheduled);
        await _db.SaveChangesAsync();
    }

    public async Task<List<NewsletterScheduledDTO>> GetScheduledAsync()
    {
        return await _db.NewsletterScheduleds
            .OrderByDescending(s => s.CreatedAtUtc)
            .Select(s => new NewsletterScheduledDTO
            {
                Id = s.Id,
                Oggetto = s.Oggetto,
                ScheduledAt = s.ScheduledAt,
                SentAt = s.SentAt,
                Inviati = s.Inviati,
                Totale = s.Totale,
                CreatedAtUtc = s.CreatedAtUtc
            })
            .ToListAsync();
    }

    public async Task ProcessScheduledAsync()
    {
        var pending = await _db.NewsletterScheduleds
            .Where(s => s.SentAt == null && s.ScheduledAt <= DateTime.UtcNow)
            .ToListAsync();

        foreach (var s in pending)
        {
            var inviati = await InviaNewsletterAsync(s.Oggetto, s.Contenuto, null, true);
            s.Inviati = inviati;
            s.SentAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
    }

    private static string WrapInTemplate(string contenuto, string email, string codiceSconto)
    {
        var safeContent = System.Net.WebUtility.HtmlEncode(contenuto).Replace("\n", "<br>");
        return EmailTemplateHelper.Wrap("Newsletter", $@"<div style=""font-size:14px;line-height:1.6;"">{safeContent}</div>");
    }

    private static string GeneraCodiceSconto()
    {
        var random = new Random();
        var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var code = new string(Enumerable.Range(0, 8).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        return $"NEWS15-{code}";
    }
}
