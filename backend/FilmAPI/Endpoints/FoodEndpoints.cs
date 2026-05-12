using FilmAPI.DTO;
using FilmAPI.Services;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class FoodEndpoints
{
    public static void MapFoodEndpoints(this WebApplication app)
    {
        var foodGroup = app.MapGroup("/food");

        foodGroup.MapGet("/menu", async (IFoodService service) =>
        {
            var menu = await service.GetMenuAsync();
            return Results.Ok(menu);
        }).AllowAnonymous();

        foodGroup.MapPost("/order/{ordineId}", async (
            int ordineId,
            FoodOrderRequestDTO dto,
            ClaimsPrincipal user,
            IFoodService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0)
                return Results.Unauthorized();

            try
            {
                dto.OrdineId = ordineId;
                var result = await service.AddFoodToOrderAsync(ordineId, userId, dto);
                return Results.Ok(result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(ex.Message);
            }
        }).RequireAuthorization("Authenticated");

        foodGroup.MapGet("/order/{ordineId}", async (
            int ordineId,
            ClaimsPrincipal user,
            IFoodService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0)
                return Results.Unauthorized();

            try
            {
                var result = await service.GetOrderFoodAsync(ordineId, userId);
                return Results.Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(ex.Message);
            }
        }).RequireAuthorization("Authenticated");

        var adminFoodGroup = app.MapGroup("/admin/food");

        adminFoodGroup.MapGet("/", async (IFoodService service) =>
        {
            var items = await service.GetAllFoodItemsAsync();
            return Results.Ok(items);
        }).RequireAuthorization("PowerUserOrAdmin");

        adminFoodGroup.MapPost("/", async (
            FoodItemDTO dto,
            IFoodService service) =>
        {
            try
            {
                var result = await service.CreateFoodItemAsync(dto);
                return Results.Created($"/admin/food/{result.Id}", result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(ex.Message);
            }
        }).RequireAuthorization("PowerUserOrAdmin");

        adminFoodGroup.MapPut("/{id}", async (
            int id,
            FoodItemDTO dto,
            IFoodService service) =>
        {
            var result = await service.UpdateFoodItemAsync(id, dto);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).RequireAuthorization("PowerUserOrAdmin");

        adminFoodGroup.MapDelete("/{id}", async (
            int id,
            IFoodService service) =>
        {
            var result = await service.DeleteFoodItemAsync(id);
            return result ? Results.NoContent() : Results.NotFound();
        }).RequireAuthorization("PowerUserOrAdmin");
    }
}
