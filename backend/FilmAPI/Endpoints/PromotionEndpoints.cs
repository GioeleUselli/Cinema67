using FilmAPI.DTO;
using FilmAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace FilmAPI.Endpoints;

public static class PromotionEndpoints
{
    public static void MapPromotionEndpoints(this WebApplication app)
    {
        app.MapGet("/promotions/active", async (IPromotionService service)
            => Results.Ok(await service.GetActiveAsync())).AllowAnonymous();

        app.MapPost("/promotions/{id:int}/claim", async (int id, IPromotionService service) =>
        {
            try
            {
                var result = await service.ClaimPromotionAsync(id);
                return Results.Ok(result);
            }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        }).AllowAnonymous();

        var admin = app.MapGroup("/admin/promotions").RequireAuthorization("PowerUserOrAdmin");

        admin.MapGet("", async ([FromQuery] bool? active, IPromotionService service)
            => Results.Ok(await service.GetAllAsync(active)));

        admin.MapGet("/{id:int}", async (int id, IPromotionService service)
            => service.GetByIdAsync(id) is { } p ? Results.Ok(p) : Results.NotFound());

        admin.MapPost("", async (PromotionCreateDTO dto, IPromotionService service) =>
        {
            try { return Results.Created($"/admin/promotions/", await service.CreateAsync(dto)); }
            catch (ArgumentException ex) { return Results.BadRequest(ex.Message); }
        });

        admin.MapPut("/{id:int}", async (int id, PromotionUpdateDTO dto, IPromotionService service) =>
        {
            var r = await service.UpdateAsync(id, dto);
            return r is null ? Results.NotFound() : Results.Ok(r);
        });

        admin.MapDelete("/{id:int}", async (int id, IPromotionService service)
            => await service.DeleteAsync(id) ? Results.NoContent() : Results.NotFound());
    }
}
