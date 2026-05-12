using FilmAPI.DTO;
using FilmAPI.Services;
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

        // Authenticated
        var authGroup = app.MapGroup("/merch").RequireAuthorization("Authenticated");

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
    }
}
