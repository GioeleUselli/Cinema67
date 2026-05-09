using FilmAPI.DTO;
using FilmAPI.Services;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class NewsletterEndpoints
{
    public static void MapNewsletterEndpoints(this WebApplication app)
    {
        app.MapPost("/newsletter/iscriviti", async (NewsletterIscrizioneDTO dto, INewsletterService service) =>
        {
            try
            {
                var result = await service.IscrivitiAsync(dto.Email);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.Ok(new NewsletterRisultatoDTO { Messaggio = ex.Message, CodiceSconto = "", PercentualeSconto = 0 }); }
        }).AllowAnonymous();

        var adminGroup = app.MapGroup("/admin/newsletter").RequireAuthorization("PowerUserOrAdmin");

        adminGroup.MapGet("/subscribers", async (INewsletterService service) =>
        {
            var result = await service.GetAllSubscribersAsync();
            return Results.Ok(result);
        });

        adminGroup.MapPost("/subscribe", async (NewsletterIscrizioneDTO dto, INewsletterService service) =>
        {
            try
            {
                var result = await service.IscrivitiAsync(dto.Email);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.Ok(new NewsletterRisultatoDTO { Messaggio = ex.Message }); }
        });

        adminGroup.MapDelete("/subscribers/{id:int}", async (int id, INewsletterService service) =>
        {
            var ok = await service.RimuoviIscrittoAsync(id);
            return ok ? Results.Ok(new { message = "Rimosso" }) : Results.NotFound();
        });

        adminGroup.MapPost("/send", async (NewsletterInvioDTO dto, INewsletterService service) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Oggetto) || string.IsNullOrWhiteSpace(dto.Contenuto))
                return Results.BadRequest(new { message = "Oggetto e contenuto richiesti." });

            if (dto.ScheduledAt.HasValue && dto.ScheduledAt.Value > DateTime.UtcNow)
            {
                await service.ScheduleAsync(dto.Oggetto, dto.Contenuto, dto.ScheduledAt.Value, dto.SubscriberIds);
                return Results.Ok(new { message = "Newsletter programmata per " + dto.ScheduledAt.Value.ToString("dd/MM/yyyy HH:mm"), scheduled = true });
            }

            var inviati = await service.InviaNewsletterAsync(dto.Oggetto, dto.Contenuto, dto.SubscriberIds, true);
            return Results.Ok(new { inviati, scheduled = false });
        });

        adminGroup.MapGet("/scheduled", async (INewsletterService service) =>
        {
            var result = await service.GetScheduledAsync();
            return Results.Ok(result);
        });

        adminGroup.MapPost("/process-scheduled", async (INewsletterService service) =>
        {
            await service.ProcessScheduledAsync();
            return Results.Ok(new { message = "Newsletter programmate processate." });
        });
    }
}
