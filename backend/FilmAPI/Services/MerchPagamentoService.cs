using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IMerchPagamentoService
{
    Task<PayMerchOrderResponseDTO> PayMerchOrderAsync(int userId, int merchOrderId, PayMerchOrderRequestDTO dto, string? idempotencyKey);
    Task<CreateMerchCheckoutSessionResponseDTO> CreateCheckoutSessionAsync(int userId, int merchOrderId, CreateMerchCheckoutSessionRequestDTO dto, string? idempotencyKey);
    Task CancelPendingOrderAsync(int userId, int merchOrderId);
    Task<MerchCheckoutStatusDTO> GetCheckoutStatusAsync(int userId, int merchOrderId);
    Task ReconcileCheckoutSessionAsync(int userId, int merchOrderId);
    Task HandleStripeWebhookAsync(string payload, string? signature);
    Task<PayPalOrderResponseDTO> CreatePayPalOrderAsync(int userId, int merchOrderId);
    Task CapturePayPalOrderAsync(int userId, int merchOrderId);
}

public class MerchPagamentoService : IMerchPagamentoService
{
    private readonly FilmDbContext _db;
    private readonly IStripePaymentGateway _stripe;
    private readonly IPayPalGateway _paypal;
    private readonly ICreditoService _credito;
    private readonly IMerchService _merchService;
    private readonly IEmailService _emailService;
    private readonly ILogger<MerchPagamentoService> _logger;
    private readonly IMembershipService _membershipService;

    public MerchPagamentoService(FilmDbContext db, IStripePaymentGateway stripe, IPayPalGateway paypal, ICreditoService credito, IMerchService merchService, IEmailService emailService, ILogger<MerchPagamentoService> logger, IMembershipService membershipService)
    {
        _db = db; _stripe = stripe; _paypal = paypal; _credito = credito; _merchService = merchService; _emailService = emailService; _logger = logger; _membershipService = membershipService;
    }

    public async Task<PayMerchOrderResponseDTO> PayMerchOrderAsync(int userId, int merchOrderId, PayMerchOrderRequestDTO dto, string? idempotencyKey)
    {
        var order = await LoadOrderAsync(merchOrderId);
        if (order is null || order.UserId != userId) throw new KeyNotFoundException("Ordine non trovato.");
        if (order.Stato == "Paid") return new PayMerchOrderResponseDTO { StatoPagamento = "Paid", Ordine = MapDTO(order) };
        if (order.Stato != "Pending") throw new InvalidOperationException("Ordine non pagabile.");

        var total = order.Totale;
        var split = ComputeSplit(dto.MetodoPagamento, total, order.User!.CreditoResiduo, dto.ImportoCreditoRichiesto);

        order.Totale = total;
        order.ImportoCredito = split.ImportoCredito;
        order.ImportoCarta = split.ImportoCarta;
        await _db.SaveChangesAsync();

        if (split.ImportoCarta == 0)
        {
            await _credito.ApplyMerchOrderDebitAsync(userId, merchOrderId, split.ImportoCredito, "Addebito credito ordine merch");
            order.Stato = "Paid";
            order.PaidAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await TrySendOrderEmailAsync(order);
            await TryAccumulaPuntiAsync(order);
            return new PayMerchOrderResponseDTO { StatoPagamento = "Paid", Ordine = MapDTO(order) };
        }

        if (split.ImportoCredito > 0)
            await _credito.ApplyMerchOrderDebitAsync(userId, merchOrderId, split.ImportoCredito, "Addebito credito ordine merch");

        var piRequest = new StripeCreatePaymentIntentRequest
        {
            OrderId = merchOrderId,
            OrderCode = order.CodiceOrdine ?? "",
            UserId = userId,
            ShowId = 0,
            Amount = split.ImportoCarta,
            Currency = "eur"
        };

        var pi = await _stripe.CreatePaymentIntentAsync(piRequest, idempotencyKey);
        order.StripePaymentIntentId = pi.Id;

        if (pi.Status == "succeeded")
        {
            order.Stato = "Paid";
            order.PaidAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await TryAccumulaPuntiAsync(order);
            return new PayMerchOrderResponseDTO { StatoPagamento = "Paid", Ordine = MapDTO(order), StripePaymentIntentId = pi.Id };
        }

        await _db.SaveChangesAsync();
        return new PayMerchOrderResponseDTO { StatoPagamento = pi.Status, Ordine = MapDTO(order), StripePaymentIntentId = pi.Id };
    }

    public async Task<CreateMerchCheckoutSessionResponseDTO> CreateCheckoutSessionAsync(int userId, int merchOrderId, CreateMerchCheckoutSessionRequestDTO dto, string? idempotencyKey)
    {
        var order = await LoadOrderAsync(merchOrderId);
        if (order is null || order.UserId != userId) throw new KeyNotFoundException("Ordine non trovato.");
        if (order.Stato != "Pending") throw new InvalidOperationException("Ordine non pagabile.");

        var total = order.Totale;
        var split = ComputeSplit(dto.MetodoPagamento, total, order.User!.CreditoResiduo, dto.ImportoCreditoRichiesto);

        order.Totale = total;
        order.ImportoCredito = split.ImportoCredito;
        order.ImportoCarta = split.ImportoCarta;
        order.CheckoutExpiresAtUtc = DateTime.UtcNow.AddMinutes(10);

        if (split.ImportoCredito > 0)
            await _credito.ReserveMerchOrderCreditAsync(userId, merchOrderId, split.ImportoCredito, "Riserva credito checkout merch");

        var sessionRequest = new StripeCreateMerchCheckoutSessionRequest
        {
            MerchOrderId = merchOrderId,
            OrderCode = order.CodiceOrdine ?? "",
            UserId = userId,
            Amount = split.ImportoCarta > 0 ? split.ImportoCarta : total,
            Currency = "eur",
            var fbUrl = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL") ?? "http://localhost:5001";
            SuccessUrl = $"{fbUrl}/esito-acquisto-merch.html?orderId={merchOrderId}&success=true",
            CancelUrl = $"{fbUrl}/shop.html"
        };

        var session = await _stripe.CreateMerchCheckoutSessionAsync(sessionRequest, idempotencyKey);
        order.StripeCheckoutSessionId = session.Id;
        order.Stato = "CheckoutInProgress";
        await _db.SaveChangesAsync();

        return new CreateMerchCheckoutSessionResponseDTO { StripeCheckoutUrl = session.Url, StripeCheckoutSessionId = session.Id };
    }

    public async Task CancelPendingOrderAsync(int userId, int merchOrderId)
    {
        var order = await LoadOrderAsync(merchOrderId);
        if (order is null || order.UserId != userId) throw new KeyNotFoundException("Ordine non trovato.");
        if (order.Stato == "Paid" || order.Stato == "Cancelled") return;

        await _credito.ReleaseReservedMerchOrderCreditAsync(userId, merchOrderId, "Rilascio credito per annullamento ordine merch");
        order.Stato = "Cancelled";
        order.LastPaymentError = "Annullato dall'utente";
        await _db.SaveChangesAsync();
    }

    public async Task<MerchCheckoutStatusDTO> GetCheckoutStatusAsync(int userId, int merchOrderId)
    {
        var order = await LoadOrderAsync(merchOrderId);
        if (order is null || order.UserId != userId) throw new KeyNotFoundException("Ordine non trovato.");

        if (order.CheckoutExpiresAtUtc.HasValue && order.CheckoutExpiresAtUtc.Value < DateTime.UtcNow && (order.Stato == "Pending" || order.Stato == "CheckoutInProgress"))
        {
            await _credito.ReleaseReservedMerchOrderCreditAsync(userId, merchOrderId);
            order.Stato = "Expired";
            order.LastPaymentError = "Checkout scaduto";
            await _db.SaveChangesAsync();
        }

        return new MerchCheckoutStatusDTO { Stato = order.Stato, Ordine = MapDTO(order) };
    }

    public async Task ReconcileCheckoutSessionAsync(int userId, int merchOrderId)
    {
        var order = await LoadOrderAsync(merchOrderId);
        if (order is null || order.UserId != userId) throw new KeyNotFoundException("Ordine non trovato.");
        if (order.Stato == "Paid" || order.Stato == "Cancelled") return;

        if (!string.IsNullOrEmpty(order.StripeCheckoutSessionId))
        {
            try
            {
                var session = await _stripe.GetCheckoutSessionAsync(order.StripeCheckoutSessionId);
                if (session.Status == "complete" && session.PaymentIntentId is not null)
                {
                    var pi = await _stripe.GetPaymentIntentAsync(session.PaymentIntentId);
                    if (pi.Status == "succeeded")
                    {
                        if (order.ImportoCredito > 0)
                            await _credito.ApplyMerchOrderDebitAsync(userId, merchOrderId, order.ImportoCredito, "Addebito credito ordine merch (riconciliazione)");

                        order.StripePaymentIntentId = pi.Id;
                        order.Stato = "Paid";
                        order.PaidAtUtc = DateTime.UtcNow;
                        await _db.SaveChangesAsync();
                        await TrySendOrderEmailAsync(order);
                        await TryAccumulaPuntiAsync(order);
                        return;
                    }
                }

                if (session.ExpiresAt != default && session.ExpiresAt < DateTime.UtcNow)
                {
                    await _credito.ReleaseReservedMerchOrderCreditAsync(userId, merchOrderId);
                    order.Stato = "Expired";
                    order.LastPaymentError = "Checkout scaduto";
                    await _db.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Riconciliazione checkout merch fallita per ordine {OrderId}", merchOrderId);
            }
        }
    }

    public async Task HandleStripeWebhookAsync(string payload, string? signature)
    {
        var evt = _stripe.ParseWebhookEvent(payload, signature);
        if (evt.CheckoutSession is null || evt.CheckoutSession.Metadata is null) return;

        evt.CheckoutSession.Metadata.TryGetValue("orderType", out var orderType);
        if (orderType != "merch") return; // let ticket webhook handle non-merch events

        evt.CheckoutSession.Metadata.TryGetValue("merchOrderId", out var merchOrderIdStr);
        if (!int.TryParse(merchOrderIdStr, out var merchOrderId)) return;

        var order = await _db.MerchOrders.Include(o => o.User).FirstOrDefaultAsync(o => o.Id == merchOrderId);
        if (order is null) return;

        if (order.Stato == "Paid") return;

        var session = evt.CheckoutSession;

        if (session.Status == "complete" && session.PaymentIntentId is not null)
        {
            if (order.ImportoCredito > 0)
                await _credito.ApplyMerchOrderDebitAsync(order.UserId, merchOrderId, order.ImportoCredito, "Addebito credito ordine merch (webhook)");

            order.StripePaymentIntentId = session.PaymentIntentId;
            order.StripeCheckoutSessionId = session.Id;
            order.Stato = "Paid";
            order.PaidAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await TrySendOrderEmailAsync(order);
            await TryAccumulaPuntiAsync(order);
        }
        else if (session.Status == "expired")
        {
            await _credito.ReleaseReservedMerchOrderCreditAsync(order.UserId, merchOrderId);
            order.Stato = "Expired";
            order.LastPaymentError = "Checkout scaduto";
            await _db.SaveChangesAsync();
        }
    }

    private static (decimal ImportoCredito, decimal ImportoCarta) ComputeSplit(string method, decimal total, decimal creditoDisponibile, decimal importoRichiesto)
    {
        var metodo = (method ?? "Carta").Trim();
        if (metodo.Equals("Credito", StringComparison.OrdinalIgnoreCase))
        {
            if (creditoDisponibile < total) throw new InvalidOperationException("Credito insufficiente.");
            return (total, 0);
        }
        if (metodo.Equals("Misto", StringComparison.OrdinalIgnoreCase) && importoRichiesto > 0)
        {
            var credito = Math.Min(importoRichiesto, Math.Min(total, creditoDisponibile));
            return (credito, total - credito);
        }
        return (0, total);
    }

    private async Task<MerchOrder?> LoadOrderAsync(int id)
    {
        return await _db.MerchOrders.Include(o => o.User).Include(o => o.CinemaRitiro).Include(o => o.Items).ThenInclude(i => i.MerchItem).FirstOrDefaultAsync(o => o.Id == id);
    }

    private static MerchOrderDTO MapDTO(MerchOrder o) => new()
    {
        Id = o.Id, UserId = o.UserId, UserEmail = o.User?.Email, Totale = o.Totale, Stato = o.Stato,
        CodiceOrdine = o.CodiceOrdine, CreatedAtUtc = o.CreatedAtUtc,
        ImportoCarta = o.ImportoCarta, ImportoCredito = o.ImportoCredito,
        CheckoutExpiresAtUtc = o.CheckoutExpiresAtUtc, LastPaymentError = o.LastPaymentError,
        TipoConsegna = o.TipoConsegna, Indirizzo = o.Indirizzo, Citta = o.Citta, CAP = o.CAP,
        Provincia = o.Provincia, Telefono = o.Telefono, CinemaRitiroId = o.CinemaRitiroId,
        CinemaRitiroNome = o.CinemaRitiro?.Nome,
        CostoSpedizione = o.CostoSpedizione,
        StatoSpedizione = o.StatoSpedizione,
        TrackingNumber = o.TrackingNumber,
        DataConsegnaPrevista = o.DataConsegnaPrevista,
        Items = o.Items.Select(i => new MerchOrderItemDetailDTO
        {
            Id = i.Id, MerchItemId = i.MerchItemId, Nome = i.MerchItem?.Nome ?? "",
            ImmaginePath = i.MerchItem?.ImmaginePath, Quantita = i.Quantita,
            PrezzoUnitario = i.PrezzoUnitario, SubTotale = i.PrezzoUnitario * i.Quantita
        }).ToList()
    };

    private async Task TrySendOrderEmailAsync(MerchOrder order)
    {
        try
        {
            var userEmail = order.User?.Email;
            if (string.IsNullOrWhiteSpace(userEmail)) return;

            var itemsHtml = string.Join("", order.Items.Select(i =>
                $"<tr><td style='padding:8px;border-bottom:1px solid #333'>{i.MerchItem?.Nome ?? "Articolo"} x{i.Quantita}</td><td style='padding:8px;border-bottom:1px solid #333;text-align:right'>€{(i.PrezzoUnitario * i.Quantita).ToString("F2")}</td></tr>"));

            var consegnaHtml = order.TipoConsegna == "Spedizione"
                ? $"<p style='margin-top:16px'><b>Spedizione a:</b><br>{order.Indirizzo}<br>{order.CAP} {order.Citta} ({order.Provincia})<br>Tel: {order.Telefono}</p>"
                : $"<p style='margin-top:16px'><b>Ritiro al cinema:</b> {order.CinemaRitiro?.Nome ?? "Da definire"}</p>";

            var body = $@"<div style='max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#1a1614;color:#e0d8cc;padding:24px;border-radius:12px'>
<h2 style='color:#d4af37'>Cinema67 Shop — Riepilogo Ordine</h2>
<p>Grazie per il tuo acquisto! Ecco il riepilogo del tuo ordine <b>{order.CodiceOrdine}</b>:</p>
<table style='width:100%;border-collapse:collapse;margin:16px 0'>{itemsHtml}
<tr><td style='padding:8px;font-weight:bold'>Totale</td><td style='padding:8px;text-align:right;font-weight:bold;color:#d4af37'>€{order.Totale.ToString("F2")}</td></tr>
</table>
{consegnaHtml}
<p style='color:#8a8078;font-size:12px'>Metodo: {(order.ImportoCarta > 0 ? "Carta" : "")}{(order.ImportoCredito > 0 ? (order.ImportoCarta > 0 ? " + Credito" : "Credito") : "")}</p>
<p style='color:#8a8078;font-size:12px'>Data: {order.PaidAtUtc?.ToString("dd/MM/yyyy HH:mm") ?? ""}</p>
<p style='margin-top:24px;color:#8a8078;font-size:12px'>Cinema67 — L'Arte del Cinema</p></div>";

            await _emailService.SendHtmlEmailAsync(userEmail, $"Cinema67 Shop - Conferma Ordine {order.CodiceOrdine}", body);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Invio email ordine merch {OrderId} fallito", order.Id); }
    }

    public async Task<PayPalOrderResponseDTO> CreatePayPalOrderAsync(int userId, int merchOrderId)
    {
        var order = await LoadOrderAsync(merchOrderId);
        if (order is null || order.UserId != userId) throw new KeyNotFoundException("Ordine non trovato.");
        if (order.Stato != "Pending") throw new InvalidOperationException("Ordine non pagabile.");

        var paypal = await _paypal.CreateOrderAsync(new PayPalCreateOrderRequest
        {
            Amount = order.Totale,
            Currency = "EUR",
            OrderCode = order.CodiceOrdine ?? "",
            var fbPaypal = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL") ?? "http://localhost:5001";
            ReturnUrl = $"{fbPaypal}/esito-acquisto-merch.html?orderId={merchOrderId}&paypal=true",
            CancelUrl = $"{fbPaypal}/shop.html"
        });

        order.ImportoCarta = order.Totale;
        order.StripePaymentIntentId = paypal.Id;
        order.Stato = "CheckoutInProgress";
        await _db.SaveChangesAsync();

        return new PayPalOrderResponseDTO { PayPalOrderId = paypal.Id, ApprovalUrl = paypal.ApprovalUrl };
    }

    public async Task CapturePayPalOrderAsync(int userId, int merchOrderId)
    {
        var order = await LoadOrderAsync(merchOrderId);
        if (order is null || order.UserId != userId) throw new KeyNotFoundException("Ordine non trovato.");
        if (order.Stato == "Paid") return;
        if (string.IsNullOrEmpty(order.StripePaymentIntentId)) throw new InvalidOperationException("Nessun ordine PayPal associato.");

        var capture = await _paypal.CaptureOrderAsync(order.StripePaymentIntentId);
        if (capture.Status != "COMPLETED")
        {
            order.Stato = "Pending";
            order.LastPaymentError = "PayPal non completato: " + capture.Status;
            await _db.SaveChangesAsync();
            throw new InvalidOperationException("Pagamento PayPal non completato: " + capture.Status);
        }

        order.Stato = "Paid";
        order.PaidAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await TrySendOrderEmailAsync(order);
        await TryAccumulaPuntiAsync(order);
    }

    private async Task TryAccumulaPuntiAsync(MerchOrder order)
    {
        try { await _membershipService.AccumulaPuntiAcquistoAsync(order.UserId, order.Totale, order.Id); } catch { }
    }
}
