using System.Net;
using System.Text;
using FilmAPI.DTO;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;
using System.Globalization;

namespace FilmAPI.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly string? _smtpHost;
    private readonly int _smtpPort;
    private readonly string? _smtpUser;
    private readonly string? _smtpPassword;
    private readonly string? _fromEmail;
    private readonly string? _fromName;

    private readonly SecureSocketOptions _secureOption;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
        _smtpHost = ReadSetting("SMTP_HOST");
        _smtpPort = int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT"), out var port) ? port : 587;
        _smtpUser = ReadSetting("SMTP_USER");
        _smtpPassword = ReadSetting("SMTP_PASSWORD");
        _fromEmail = ReadSetting("SMTP_FROM_EMAIL");
        _fromName = ReadSetting("SMTP_FROM_NAME") ?? "Cinema67";
        _secureOption = ParseSecureOption(Environment.GetEnvironmentVariable("SMTP_SECURE_SOCKET_OPTIONS"), _smtpPort);
    }

    private static SecureSocketOptions ParseSecureOption(string? value, int port)
    {
        if (string.IsNullOrWhiteSpace(value))
            return port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
        return value.Trim().ToLowerInvariant() switch
        {
            "ssl" or "sslonconnect" => SecureSocketOptions.SslOnConnect,
            "starttls" => SecureSocketOptions.StartTls,
            "auto" => SecureSocketOptions.Auto,
            "none" => SecureSocketOptions.None,
            _ => port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls
        };
    }

    public async Task<EmailSendResult> SendHtmlEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (!HasCompleteConfiguration())
        {
            return new EmailSendResult { Success = false, ErrorMessage = "Configurazione SMTP incompleta." };
        }

        if (string.IsNullOrWhiteSpace(toEmail))
        {
            return new EmailSendResult { Success = false, ErrorMessage = "Email destinatario non disponibile." };
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, _fromEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            client.Timeout = 10000; // 10 secondi timeout
            await client.ConnectAsync(_smtpHost!, _smtpPort, _secureOption, cancellationToken);
            await client.AuthenticateAsync(_smtpUser!, _smtpPassword!, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            return new EmailSendResult { Success = true, SentAtUtc = DateTime.UtcNow };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invio email fallito a {Email}", toEmail);
            return new EmailSendResult { Success = false, ErrorMessage = ex.Message };
        }
    }

    public async Task<EmailSendResult> SendOrderTicketsAsync(OrdineTicketDocumentDTO orderDocument, byte[] pdfBytes, string fileName, CancellationToken cancellationToken = default)
    {
        if (!HasCompleteConfiguration())
        {
            return new EmailSendResult
            {
                Success = false,
                ErrorMessage = "Configurazione SMTP incompleta. Verificare le variabili SMTP_* del backend."
            };
        }

        if (string.IsNullOrWhiteSpace(orderDocument.RecipientEmail))
        {
            return new EmailSendResult
            {
                Success = false,
                ErrorMessage = "Email destinatario non disponibile per l'ordine richiesto."
            };
        }

        try
        {
            var smtpHost = _smtpHost!;
            var smtpUser = _smtpUser!;
            var smtpPassword = _smtpPassword!;
            var fromEmail = _fromEmail!;

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(orderDocument.RecipientEmail));
            message.Subject = $"Cinema67 - Biglietti ordine {orderDocument.CodiceOrdine}";

            var bodyBuilder = new BodyBuilder
            {
                TextBody = BuildTextBody(orderDocument),
                HtmlBody = BuildHtmlBody(orderDocument)
            };

            bodyBuilder.Attachments.Add(fileName, pdfBytes, ContentType.Parse("application/pdf"));
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            client.Timeout = 10000;
            await client.ConnectAsync(smtpHost, _smtpPort, SecureSocketOptions.SslOnConnect, cancellationToken);
            await client.AuthenticateAsync(smtpUser, smtpPassword, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            return new EmailSendResult
            {
                Success = true,
                SentAtUtc = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invio email ticket fallito per ordine {OrderId}", orderDocument.OrdineId);
            return new EmailSendResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private bool HasCompleteConfiguration()
    {
        return !string.IsNullOrWhiteSpace(_smtpHost)
            && !_smtpHost.StartsWith("<")
            && !string.IsNullOrWhiteSpace(_smtpUser)
            && !_smtpUser.StartsWith("<")
            && !string.IsNullOrWhiteSpace(_smtpPassword)
            && !_smtpPassword.StartsWith("<")
            && !string.IsNullOrWhiteSpace(_fromEmail);
    }

    private static string BuildTextBody(OrdineTicketDocumentDTO orderDocument)
    {
        var builder = new StringBuilder();
        builder.AppendLine($"Conferma acquisto ordine {orderDocument.CodiceOrdine}");
        builder.AppendLine();
        builder.AppendLine($"Film: {orderDocument.FilmTitolo}");
        builder.AppendLine($"Cinema: {orderDocument.CinemaNome}");
        builder.AppendLine($"Sala: {orderDocument.SalaNome}");
        builder.AppendLine($"Data e ora: {FormatShowDateTime(orderDocument.StartAtUtc)}");
        builder.AppendLine($"Numero biglietti: {orderDocument.NumeroBiglietti}");
        builder.AppendLine($"Totale: {FormatAmount(orderDocument.TotaleLordo)} EUR");
        builder.AppendLine();
        builder.AppendLine("Codici ticket:");

        foreach (var ticket in orderDocument.Tickets)
            builder.AppendLine($"- {ticket.CodiceBiglietto} | {ticket.Settore} fila {ticket.Fila} posto {ticket.Numero}");

        builder.AppendLine();
        builder.AppendLine("In allegato trovi il PDF multipagina dei biglietti.");
        builder.AppendLine("Il profilo utente resta il punto di recupero ufficiale dell'ordine.");
        return builder.ToString();
    }

    private static string BuildHtmlBody(OrdineTicketDocumentDTO orderDocument)
    {
        var title = WebUtility.HtmlEncode(orderDocument.FilmTitolo);
        var cinema = WebUtility.HtmlEncode(orderDocument.CinemaNome);
        var sala = WebUtility.HtmlEncode(orderDocument.SalaNome);
        var orderCode = WebUtility.HtmlEncode(orderDocument.CodiceOrdine);

        var ticketsHtml = string.Join(string.Empty, orderDocument.Tickets.Select(ticket =>
            $"<li><strong>{WebUtility.HtmlEncode(ticket.CodiceBiglietto)}</strong> - {WebUtility.HtmlEncode(ticket.Settore)} fila {ticket.Fila} posto {ticket.Numero}</li>"));

        var foodHtml = "";
        if (orderDocument.Cibo.Count > 0)
        {
            var foodItems = string.Join(string.Empty, orderDocument.Cibo.Select(f =>
                $"<li>{WebUtility.HtmlEncode(f.Nome)} x{f.Quantita} - {FormatAmount(f.SubTotale)} EUR</li>"));
            var foodTotal = orderDocument.Cibo.Sum(f => f.SubTotale);
            foodHtml = $"""
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border:1px solid #334155;border-radius:10px;overflow:hidden">
<tr><td style="padding:14px 18px;background:rgba(0,0,0,0.2);border-bottom:1px solid #334155;font-size:12px;font-weight:700;color:#f59e0b">CIBO E BEVANDE - Codice: {orderDocument.CodiceCibo}</td></tr>
<tr><td style="padding:16px 18px"><ul style="margin:0;padding:0;list-style:none">{foodItems}</ul>
<p style="margin:8px 0 0;color:#f59e0b;font-weight:700">Totale cibo: {FormatAmount(foodTotal)} EUR</p>
<p style="color:#64748b;font-size:11px;margin:4px 0 0">Mostra questo codice in cassa per ritirare il tuo ordine</p>
</td></tr>
</table>
""";
        }

        var ticketsList = string.Join("", orderDocument.Tickets.Select(ticket =>
            EmailTemplateHelper.Card($"{ticket.Settore} fila {ticket.Fila} posto {ticket.Numero}", ticket.CodiceBiglietto, "#f0e8e0")));

        var foodSection = "";
        if (orderDocument.Cibo.Count > 0)
        {
            var foodItems = string.Join("", orderDocument.Cibo.Select(f =>
                $"<tr><td style=\"padding:4px 0;color:#f0e8e0\">{WebUtility.HtmlEncode(f.Nome)} x{f.Quantita}</td><td style=\"text-align:right;color:#a89888\">{FormatAmount(f.SubTotale)} €</td></tr>"));
            var foodTotal = orderDocument.Cibo.Sum(f => f.SubTotale);
            foodSection = $@"
<div class=""info-card"" style=""margin-top:16px"">
<p class=""info-card-label"">CIBO E BEVANDE — {orderDocument.CodiceCibo}</p>
<table width=""100%"" cellpadding=""0"" cellspacing=""0"">{foodItems}</table>
<p style=""color:#d4af37;font-weight:700;margin:8px 0 0"">Totale cibo: {FormatAmount(foodTotal)} €</p>
<p style=""color:#a89888;font-size:11px;margin:4px 0 0"">Mostra questo codice in cassa</p>
</div>";
        }

        var content = $@"
<p style=""color:#f0e8e0;font-size:22px;font-weight:700;margin:0"">Conferma acquisto</p>
<p style=""color:#a89888;font-size:13px;margin:4px 0 20px"">Ordine <strong style=""color:#d4af37"">{orderCode}</strong> completato</p>

{EmailTemplateHelper.Card("Film", title, "#d4af37")}
{EmailTemplateHelper.Card("Cinema", cinema)}
{EmailTemplateHelper.Card("Sala", sala)}
{EmailTemplateHelper.Card("Data e ora", FormatShowDateTime(orderDocument.StartAtUtc))}

<div class=""info-card"">
<p class=""info-card-label"">{orderDocument.NumeroBiglietti} BIGLIETTI</p>
{ticketsList}
</div>
{foodSection}

<div style=""text-align:right;margin:16px 0""><span style=""color:#d4af37;font-size:22px;font-weight:900"">{FormatAmount(orderDocument.TotaleLordo)} €</span></div>

<p style=""color:#a89888;font-size:12px;margin:16px 0 4px"">In allegato trovi il PDF dei biglietti.</p>
<p style=""color:#a89888;font-size:11px;margin:0"">Disponibile anche nel tuo profilo su Cinema67.</p>";

        return EmailTemplateHelper.Wrap("Conferma acquisto", content);
    }

    private static string? ReadSetting(string name)
    {
        var value = Environment.GetEnvironmentVariable(name);
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        return IsPlaceholder(trimmed) ? null : trimmed;
    }

    private static bool IsPlaceholder(string value)
    {
        if (value.StartsWith('<') && value.EndsWith('>')) return true;
        var lower = value.ToLowerInvariant();
        return lower.Contains("tuaemail") || lower.Contains("tua_email") || lower.Contains("la_tua_")
            || lower.Contains("your_") || lower.Contains("example") || lower.Contains("placeholder")
            || lower.StartsWith("inserisci") || lower.Contains("@example");
    }

    private static string FormatShowDateTime(DateTime startAtUtc)
    {
        var timeZone = ResolveItalyTimeZone();
        var localTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(startAtUtc, DateTimeKind.Utc), timeZone);
        return localTime.ToString("dd/MM/yyyy HH:mm");
    }

    private static string FormatAmount(decimal amount)
    {
        return amount.ToString("0.00", CultureInfo.GetCultureInfo("it-IT"));
    }

    private static TimeZoneInfo ResolveItalyTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Europe/Rome");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("W. Europe Standard Time");
        }
    }
}
