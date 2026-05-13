using FilmAPI.DTO;
using FilmAPI.Services;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class PaccoEndpoints
{
    public static void MapPaccoEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/admin/pacchi").RequireAuthorization("StaffOrPowerUserOrAdmin");

        group.MapGet("/tutti", async (IPaccoService service) =>
            Results.Ok(await service.GetAllPacchiAsync()));

        group.MapGet("/ordini-da-preparare", async (IPaccoService service) =>
            Results.Ok(await service.GetOrdiniPagatiSenzaPaccoAsync()));

        group.MapGet("/da-preparare", async (IPaccoService service) =>
            Results.Ok(await service.GetPacchiDaPreparareAsync()));

        group.MapPost("/crea-da-ordine/{merchOrderId:int}", async (int merchOrderId, ClaimsPrincipal user, IPaccoService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            try { return Results.Ok(await service.CreaPaccoAsync(merchOrderId, userId)); }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        group.MapGet("/pronti", async (IPaccoService service) =>
            Results.Ok(await service.GetPacchiProntiAsync()));

        group.MapGet("/miei", async (ClaimsPrincipal user, IPaccoService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            return Results.Ok(await service.GetPacchiCorriereAsync(userId));
        });

        group.MapGet("/codice/{codice}", async (string codice, IPaccoService service) =>
        {
            var pacco = await service.GetByCodiceInternoAsync(codice);
            return pacco is null ? Results.NotFound() : Results.Ok(pacco);
        });

        group.MapPost("/{id:int}/prendi-in-carico", async (int id, ClaimsPrincipal user, IPaccoService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var result = await service.PrendiInCaricoAsync(id, userId);
            return result is null ? Results.NotFound() : Results.Ok(result);
        });

        group.MapPost("/{id:int}/in-consegna", async (int id, IPaccoService service) =>
        {
            var result = await service.SegnaInConsegnaAsync(id);
            return result is null ? Results.NotFound() : Results.Ok(result);
        });

        group.MapPost("/{id:int}/consegnato", async (int id, SegnaConsegnaDTO dto, IPaccoService service) =>
        {
            var result = await service.SegnaConsegnatoAsync(id, dto.Firma, dto.Note);
            return result is null ? Results.NotFound() : Results.Ok(result);
        });

        group.MapPost("/{id:int}/mancata-consegna", async (int id, SegnaConsegnaDTO dto, IPaccoService service) =>
        {
            var result = await service.SegnaMancataConsegnaAsync(id, dto.Note);
            return result is null ? Results.NotFound() : Results.Ok(result);
        });
    }
}

public class SegnaConsegnaDTO
{
    public string? Firma { get; set; }
    public string? Note { get; set; }
}
