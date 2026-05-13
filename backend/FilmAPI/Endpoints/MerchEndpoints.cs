using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class MerchEndpoints
{
    public static void MapMerchEndpoints(this WebApplication app)
    {
        // Public
        app.MapGet("/merch/items", async (IMerchService service) =>
        {
            var items = await service.GetItemsAsync();
            return Results.Ok(items);
        }).AllowAnonymous();

        app.MapGet("/merch/shipping/estimate", (string? tipo, int? cinemaId, string? cap, IShippingService shipping) =>
        {
            var result = shipping.CalcolaSpedizioneCompleta(tipo ?? "RitiroCinema", cinemaId, cap);
            return Results.Ok(new { costo = result.Costo, gratis = result.Costo == 0, giorniLavorativi = result.GiorniLavorativi, dataPrevista = result.DataPrevista });
        }).AllowAnonymous();

        app.MapGet("/merch/orders/{id:int}/tracking", async (int id, IShippingService shipping) =>
        {
            try { return Results.Ok(await shipping.GetTrackingAsync(id)); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
        }).AllowAnonymous();

        app.MapGet("/merch/discounts/validate", async (string codice, FilmDbContext db) =>
        {
            var discount = await db.MerchDiscountCodes
                .FirstOrDefaultAsync(d => d.Codice == codice.Trim().ToUpper() && d.Attivo
                    && (!d.ScadeIl.HasValue || d.ScadeIl.Value > DateTime.UtcNow)
                    && d.Utilizzi < d.MaxUtilizzi);
            if (discount is null)
                return Results.Ok(new MerchDiscountValidateDTO { Valido = false, Messaggio = "Codice non valido o scaduto." });
            return Results.Ok(new MerchDiscountValidateDTO
            {
                Valido = true,
                Codice = discount.Codice,
                PercentualeSconto = discount.PercentualeSconto,
                Messaggio = $"Sconto del {discount.PercentualeSconto}% applicato!"
            });
        }).AllowAnonymous();

        app.MapGet("/merch/items/{id:int}", async (int id, IMerchService service) =>
        {
            var item = await service.GetItemByIdAsync(id);
            return item is null ? Results.NotFound() : Results.Ok(item);
        }).AllowAnonymous();

        // Authenticated
        var authGroup = app.MapGroup("/merch").RequireAuthorization("Authenticated");

        authGroup.MapGet("/orders/{id:int}", async (int id, ClaimsPrincipal user, IMerchService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var orders = await service.GetMyOrdersAsync(userId);
            var order = orders.FirstOrDefault(o => o.Id == id);
            return order is null ? Results.NotFound() : Results.Ok(order);
        });

        authGroup.MapPost("/orders", async (
            MerchOrderCreateDTO dto,
            ClaimsPrincipal user,
            IMerchService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try
            {
                var result = await service.CreateOrderAsync(userId, dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        authGroup.MapGet("/orders/mie", async (
            ClaimsPrincipal user,
            IMerchService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            var result = await service.GetMyOrdersAsync(userId);
            return Results.Ok(result);
        });

        // Admin
        var adminGroup = app.MapGroup("/admin/merch").RequireAuthorization("PowerUserOrAdmin");

        adminGroup.MapGet("/orders", async (IMerchService service) =>
        {
            var result = await service.GetAllOrdersAsync();
            return Results.Ok(result);
        });

        adminGroup.MapPut("/orders/{id:int}/status", async (
            int id,
            MerchOrderStatusDTO dto,
            IMerchService service) =>
        {
            try
            {
                var result = await service.UpdateOrderStatusAsync(id, dto.Stato);
                return result is null
                    ? Results.NotFound(new { message = "Ordine non trovato." })
                    : Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        adminGroup.MapGet("/items", async (IMerchService service) =>
        {
            var result = await service.GetAllItemsAsync();
            return Results.Ok(result);
        });

        adminGroup.MapGet("/items/{id:int}", async (int id, IMerchService service) =>
        {
            var item = await service.GetItemByIdAsync(id);
            return item is null ? Results.NotFound() : Results.Ok(item);
        });

        adminGroup.MapPost("/items", async (
            MerchItemDTO dto,
            IMerchService service) =>
        {
            var result = await service.CreateItemAsync(dto);
            return Results.Created($"/admin/merch/items/{result.Id}", result);
        });

        adminGroup.MapPut("/items/{id:int}", async (
            int id,
            MerchItemDTO dto,
            IMerchService service) =>
        {
            var result = await service.UpdateItemAsync(id, dto);
            return result is null
                ? Results.NotFound(new { message = "Articolo non trovato." })
                : Results.Ok(result);
        });

        adminGroup.MapDelete("/items/{id:int}", async (
            int id,
            IMerchService service) =>
        {
            var ok = await service.DeleteItemAsync(id);
            return ok ? Results.Ok(new { message = "Articolo eliminato." }) : Results.NotFound(new { message = "Articolo non trovato." });
        });

        // Images
        adminGroup.MapPost("/items/{id:int}/images", async (int id, HttpRequest request, IMerchService service) =>
        {
            try
            {
                var form = await request.ReadFormAsync();
                var file = form.Files.GetFile("file");
                if (file is null || file.Length == 0)
                    return Results.BadRequest("Nessun file caricato");

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
                var relativePath = Path.Combine("media", "merch", fileName);
                var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var fullPath = Path.Combine(webRoot, relativePath);
                Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
                await using var stream = new FileStream(fullPath, FileMode.Create);
                await file.CopyToAsync(stream);

                var resultPath = $"/{relativePath.Replace('\\', '/')}";
                await service.UploadItemImageAsync(id, resultPath);
                return Results.Ok(new { path = resultPath });
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        }).DisableAntiforgery();

        adminGroup.MapDelete("/items/{id:int}/images/{imageId:int}", async (int id, int imageId, IMerchService service) =>
        {
            var ok = await service.DeleteItemImageAsync(imageId);
            return ok ? Results.Ok(new { message = "Immagine eliminata." }) : Results.NotFound();
        });

        // Variants
        adminGroup.MapPost("/items/{id:int}/variants", async (int id, MerchItemVariantDTO dto, IMerchService service) =>
        {
            var result = await service.AddVariantAsync(id, dto);
            return Results.Created($"/admin/merch/items/{id}/variants/{result.Id}", result);
        });

        adminGroup.MapPut("/items/{id:int}/variants/{variantId:int}", async (int id, int variantId, MerchItemVariantDTO dto, IMerchService service) =>
        {
            var result = await service.UpdateVariantAsync(variantId, dto);
            return result is null ? Results.NotFound() : Results.Ok(result);
        });

        adminGroup.MapDelete("/items/{id:int}/variants/{variantId:int}", async (int id, int variantId, IMerchService service) =>
        {
            var ok = await service.DeleteVariantAsync(variantId);
            return ok ? Results.Ok(new { message = "Variante eliminata." }) : Results.NotFound();
        });
    }
}
