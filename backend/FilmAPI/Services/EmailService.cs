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

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
        _smtpHost = ReadSetting("SMTP_HOST");
        _smtpPort = int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT"), out var port) ? port : 587;
        _smtpUser = ReadSetting("SMTP_USER");
        _smtpPassword = ReadSetting("SMTP_PASSWORD");
        _fromEmail = ReadSetting("SMTP_FROM_EMAIL");
        _fromName = ReadSetting("SMTP_FROM_NAME") ?? "Cinema67";
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
            await client.ConnectAsync(smtpHost, _smtpPort, SecureSocketOptions.StartTls, cancellationToken);
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

        return $"""
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#0f172a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;overflow:hidden;border:1px solid #334155">
<tr><td style="padding:32px 40px 20px;text-align:center">
<div style="font-size:28px;font-weight:900;color:#f59e0b;font-family:Georgia,serif;letter-spacing:2px">CINEMA67</div>
</td></tr>
<tr><td style="padding:0 40px"><div style="height:1px;background:#334155"></div></td></tr>
<tr><td style="padding:24px 40px">
<h2 style="color:#f1f5f9;margin:0 0 4px">Conferma acquisto</h2>
<p style="color:#94a3b8;font-size:13px;margin:0 0 20px">Ordine <strong style="color:#f59e0b">{orderCode}</strong> completato con successo</p>

<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #334155;border-radius:10px;overflow:hidden">
<tr><td style="padding:14px 18px;background:rgba(0,0,0,0.2);border-bottom:1px solid #334155;font-size:12px;font-weight:700;color:#f59e0b">DETTAGLI SPETTACOLO</td></tr>
<tr><td style="padding:16px 18px">
<p style="margin:0 0 6px"><span style="color:#64748b;font-size:12px">Film</span><br><span style="color:#f1f5f9;font-size:15px;font-weight:700">{title}</span></p>
<p style="margin:0 0 6px"><span style="color:#64748b;font-size:12px">Cinema</span><br><span style="color:#f1f5f9">{cinema}</span></p>
<p style="margin:0 0 6px"><span style="color:#64748b;font-size:12px">Sala</span><br><span style="color:#f1f5f9">{sala}</span></p>
<p style="margin:0"><span style="color:#64748b;font-size:12px">Data e ora</span><br><span style="color:#f1f5f9">{FormatShowDateTime(orderDocument.StartAtUtc)}</span></p>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border:1px solid #334155;border-radius:10px;overflow:hidden">
<tr><td style="padding:14px 18px;background:rgba(0,0,0,0.2);border-bottom:1px solid #334155;font-size:12px;font-weight:700;color:#f59e0b">{orderDocument.NumeroBiglietti} BIGLIETTI</td></tr>
<tr><td style="padding:16px 18px"><ul style="margin:0;padding:0;list-style:none">
{ticketsHtml}
</ul></td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
<tr><td align="right"><span style="color:#f59e0b;font-size:20px;font-weight:900">{FormatAmount(orderDocument.TotaleLordo)} EUR</span></td></tr>
</table>
</td></tr>
<tr><td style="padding:0 40px 24px">
<p style="color:#64748b;font-size:12px;margin:16px 0 0">In allegato trovi il PDF multipagina dei biglietti. Salvalo o stampalo prima dello spettacolo.</p>
<p style="color:#475569;font-size:11px">Il profilo utente resta il punto di recupero ufficiale dell'ordine.</p>
</td></tr>
<tr><td style="padding:16px 40px;background:rgba(0,0,0,0.2);text-align:center">
<p style="color:#475569;font-size:11px;margin:0">© 2026 Cinema67 — biglietti.cinema67@gmail.com</p>
</td></tr>
</table></td></tr></table></body></html>
""";
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
