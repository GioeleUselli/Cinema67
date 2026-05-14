using FilmAPI.DTO;
using FilmAPI.Services;
using System.Security.Claims;

namespace FilmAPI.Endpoints;

public static class MerchPagamentoEndpoints
{
    public static void MapMerchPagamentoEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/merch/orders").RequireAuthorization("Authenticated");

        group.MapPost("/{id:int}/pay", async (int id, PayMerchOrderRequestDTO dto, ClaimsPrincipal user, IMerchPagamentoService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try { return Results.Ok(await service.PayMerchOrderAsync(userId, id, dto, null)); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
            catch (ArgumentException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        group.MapPost("/{id:int}/stripe-checkout-session", async (int id, CreateMerchCheckoutSessionRequestDTO dto, ClaimsPrincipal user, IMerchPagamentoService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try { return Results.Ok(await service.CreateCheckoutSessionAsync(userId, id, dto, null)); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
        });

        group.MapPost("/{id:int}/cancel", async (int id, ClaimsPrincipal user, IMerchPagamentoService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try { await service.CancelPendingOrderAsync(userId, id); return Results.Ok(); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
        });

        group.MapGet("/{id:int}/checkout-status", async (int id, ClaimsPrincipal user, IMerchPagamentoService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try { return Results.Ok(await service.GetCheckoutStatusAsync(userId, id)); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
        });

        group.MapPost("/{id:int}/reconcile-checkout-session", async (int id, ClaimsPrincipal user, IMerchPagamentoService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try { await service.ReconcileCheckoutSessionAsync(userId, id); return Results.Ok(); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
        });

        // Stripe webhook for merch
        app.MapPost("/merch/stripe/webhook", async (HttpRequest request, IMerchPagamentoService service) =>
        {
            using var reader = new StreamReader(request.Body);
            var payload = await reader.ReadToEndAsync();
            var signature = request.Headers["Stripe-Signature"].FirstOrDefault();
            try { await service.HandleStripeWebhookAsync(payload, signature); return Results.Ok(); }
            catch (Exception ex) { return Results.BadRequest(new { message = ex.Message }); }
        }).AllowAnonymous();

        // PayPal
        group.MapPost("/{id:int}/paypal-create", async (int id, ClaimsPrincipal user, IMerchPagamentoService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try { return Results.Ok(await service.CreatePayPalOrderAsync(userId, id)); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (Exception ex) { return Results.Problem(ex.Message); }
        });

        group.MapPost("/{id:int}/paypal-capture", async (int id, ClaimsPrincipal user, IMerchPagamentoService service) =>
        {
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            if (userId == 0) return Results.Unauthorized();
            try { await service.CapturePayPalOrderAsync(userId, id); return Results.Ok(); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { message = ex.Message }); }
            catch (Exception ex) { return Results.Problem(ex.Message); }
        });
    }
}
