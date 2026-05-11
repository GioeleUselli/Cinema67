using FilmAPI.Data;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IShowCancellationService
{
    Task<object> PreviewCancellationAsync(int showId);
    Task<ShowCancellation> CancelShowAsync(int showId, int cancelledByUserId, string? reason);
    Task ProcessRefundsAsync(int cancellationId);
    Task RetryFailedRefundsAsync(int cancellationId);
    Task SendCancellationEmailsAsync(int cancellationId);
}

public class ShowCancellationService : IShowCancellationService
{
    private readonly FilmDbContext _db;
    private readonly IStripePaymentGateway _stripe;
    private readonly IEmailService _emailService;
    private static readonly decimal PREZZO_PER_POSTO = 8.50m;

    public ShowCancellationService(FilmDbContext db, IStripePaymentGateway stripe, IEmailService emailService)
    {
        _db = db;
        _stripe = stripe;
        _emailService = emailService;
    }

    public async Task<object> PreviewCancellationAsync(int showId)
    {
        var show = await _db.Shows.Include(s => s.Film).FirstOrDefaultAsync(s => s.Id == showId)
            ?? throw new ArgumentException("Show non trovato.");

        var ordini = await _db.Ordini
            .Include(o => o.User)
            .Include(o => o.Biglietti)
            .Where(o => o.ShowId == showId && o.Stato == OrdineState.Paid)
            .ToListAsync();

        var bigliettiValidati = ordini.SelectMany(o => o.Biglietti).Count(b => b.Stato == BigliettoState.Validated);
        var manualReviewCount = bigliettiValidati > 0 ? ordini.Count : 0;

        return new
        {
            showId,
            filmTitolo = show.Film?.Titolo,
            startAtUtc = show.StartAtUtc,
            ordiniTotali = ordini.Count,
            bigliettiTotali = ordini.Sum(o => o.Biglietti.Count),
            bigliettiValidati,
            totaleDaRimborsare = ordini.Sum(o => o.TotaleLordo),
            totaleCarta = ordini.Sum(o => o.ImportoCarta),
            totaleCredito = ordini.Sum(o => o.ImportoCredito),
            manualReviewCount,
            utentiCoinvolti = ordini.Select(o => o.User?.Email).Distinct().Count()
        };
    }

    public async Task<ShowCancellation> CancelShowAsync(int showId, int cancelledByUserId, string? reason)
    {
        var show = await _db.Shows.FindAsync(showId)
            ?? throw new ArgumentException("Show non trovato.");

        if (show.State == ShowState.Cancelled)
            throw new InvalidOperationException("Show già cancellato.");

        var ordini = await _db.Ordini
            .Include(o => o.Biglietti)
            .Where(o => o.ShowId == showId && o.Stato == OrdineState.Paid)
            .ToListAsync();

        var bigliettiValidati = ordini.SelectMany(o => o.Biglietti).Count(b => b.Stato == BigliettoState.Validated);

        show.State = ShowState.Cancelled;

        // Mark all tickets as cancelled
        foreach (var ordine in ordini)
        {
            foreach (var biglietto in ordine.Biglietti)
            {
                biglietto.Stato = BigliettoState.Cancelled;
            }
        }

        var cancellation = new ShowCancellation
        {
            ShowId = showId,
            CancelledByUserId = cancelledByUserId,
            CancelledAtUtc = DateTime.UtcNow,
            Reason = reason,
            Status = CancellationStatus.Pending,
            TotaleDaRimborsare = ordini.Sum(o => o.TotaleLordo),
            TotaleCarta = ordini.Sum(o => o.ImportoCarta),
            TotaleCredito = ordini.Sum(o => o.ImportoCredito),
            OrdiniTotali = ordini.Count,
            BigliettiTotali = ordini.Sum(o => o.Biglietti.Count),
            ManualReviewCount = bigliettiValidati > 0 ? ordini.Count : 0,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.ShowCancellations.Add(cancellation);

        // Create OrdineRefund records
        foreach (var ordine in ordini)
        {
            var hasValidated = ordine.Biglietti.Any(b => b.Stato == BigliettoState.Validated);
            var refund = new OrdineRefund
            {
                OrdineId = ordine.Id,
                ShowCancellationId = cancellation.Id,
                ImportoCarta = ordine.ImportoCarta,
                ImportoCredito = ordine.ImportoCredito,
                Status = hasValidated ? RefundStatus.Pending : RefundStatus.Pending,
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.OrdineRefunds.Add(refund);

            if (hasValidated)
            {
                _db.ManualRefundReviews.Add(new ManualRefundReview
                {
                    OrdineId = ordine.Id,
                    ShowCancellationId = cancellation.Id,
                    ReasonCode = ManualReviewReason.ValidatedTickets,
                    Importo = ordine.TotaleLordo,
                    Details = $"{ordine.Biglietti.Count(b => b.Stato == BigliettoState.Validated)} biglietti già validati",
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }

        await _db.SaveChangesAsync();

        // Auto-process refunds for non-manual-review orders
        await ProcessRefundsAsync(cancellation.Id);

        return cancellation;
    }

    public async Task ProcessRefundsAsync(int cancellationId)
    {
        var cancellation = await _db.ShowCancellations.FindAsync(cancellationId)
            ?? throw new ArgumentException("Cancellazione non trovata.");

        var refunds = await _db.OrdineRefunds
            .Include(r => r.Ordine)
            .Where(r => r.ShowCancellationId == cancellationId && r.Status == RefundStatus.Pending)
            .ToListAsync();

        // Skip orders with manual reviews
        var manualReviewOrdineIds = await _db.ManualRefundReviews
            .Where(m => m.ShowCancellationId == cancellationId && m.Resolution == null)
            .Select(m => m.OrdineId)
            .ToListAsync();

        int riusciti = 0, falliti = 0;

        foreach (var refund in refunds.Where(r => !manualReviewOrdineIds.Contains(r.OrdineId)))
        {
            try
            {
                // Refund credit
                if (refund.ImportoCredito > 0)
                {
                    var user = await _db.Users.FindAsync(refund.Ordine!.UserId);
                    if (user != null)
                    {
                        var idempKey = $"SHOW_CANCEL_REFUND:{cancellationId}:{refund.OrdineId}";
                        var alreadyRefunded = await _db.MovimentiCredito
                            .AnyAsync(m => m.Note != null && m.Note.Contains(idempKey));
                        if (!alreadyRefunded)
                        {
                            var saldoPre = user.CreditoResiduo;
                            user.CreditoResiduo += refund.ImportoCredito;
                            var mov = new MovimentoCredito
                            {
                                UserId = user.Id,
                                Tipo = MovimentoCreditoTipo.Refund,
                                Importo = refund.ImportoCredito,
                                SaldoPre = saldoPre,
                                SaldoPost = user.CreditoResiduo,
                                OrdineId = refund.OrdineId,
                                CreatedAtUtc = DateTime.UtcNow,
                                Note = idempKey
                            };
                            _db.MovimentiCredito.Add(mov);
                            await _db.SaveChangesAsync();
                            refund.CreditRefundMovementId = mov.Id;
                        }
                    }
                }

                // Stripe refund
                if (refund.ImportoCarta > 0 && !string.IsNullOrEmpty(refund.Ordine?.StripePaymentIntentId))
                {
                    try
                    {
                        var stripeRefund = await _stripe.CreateRefundAsync(refund.Ordine.StripePaymentIntentId,
                            (long)(refund.ImportoCarta * 100), $"show-cancel-{cancellation.ShowId}-order-{refund.OrdineId}");
                        refund.StripeRefundId = stripeRefund.Id;
                        refund.StripeRefundStatus = stripeRefund.Status;
                    }
                    catch (Exception ex)
                    {
                        refund.ErrorMessage = $"Stripe refund failed: {ex.Message}";
                        refund.Status = RefundStatus.Failed;
                        falliti++;
                        await _db.SaveChangesAsync();
                        continue;
                    }
                }

                refund.Status = RefundStatus.Completed;
                refund.CompletedAtUtc = DateTime.UtcNow;
                riusciti++;
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                refund.ErrorMessage = ex.Message;
                refund.Status = RefundStatus.Failed;
                falliti++;
                await _db.SaveChangesAsync();
            }
        }

        cancellation.RimborsiRiusciti = riusciti;
        cancellation.RimborsiFalliti = falliti;
        cancellation.Status = falliti == 0 ? CancellationStatus.Completed : CancellationStatus.Failed;
        if (falliti > 0) cancellation.ErrorMessage = $"{falliti} rimborsi falliti";

        // Send emails
        try { await SendCancellationEmailsAsync(cancellationId); } catch { }

        await _db.SaveChangesAsync();
    }

    public async Task RetryFailedRefundsAsync(int cancellationId)
    {
        var failed = await _db.OrdineRefunds
            .Where(r => r.ShowCancellationId == cancellationId && r.Status == RefundStatus.Failed)
            .ToListAsync();

        foreach (var r in failed)
        {
            r.Status = RefundStatus.Pending;
            r.ErrorMessage = null;
        }
        await _db.SaveChangesAsync();
        await ProcessRefundsAsync(cancellationId);
    }

    public async Task SendCancellationEmailsAsync(int cancellationId)
    {
        var cancellation = await _db.ShowCancellations
            .Include(c => c.Show).ThenInclude(s => s!.Film)
            .FirstOrDefaultAsync(c => c.Id == cancellationId);
        if (cancellation == null) return;

        var ordini = await _db.Ordini
            .Include(o => o.User)
            .Where(o => o.ShowId == cancellation.ShowId && o.Stato == OrdineState.Paid)
            .ToListAsync();

        foreach (var ordine in ordini)
        {
            var email = ordine.User?.Email;
            if (string.IsNullOrEmpty(email)) continue;

            var html = $@"
<div style='max-width:520px;margin:0 auto;font-family:Arial,sans-serif;background:#14100c;color:#f0e8e0;border-radius:12px;overflow:hidden;border:1px solid #38302a;'>
  <div style='background:linear-gradient(135deg,#b91c1c,#7f1d1d);padding:28px 24px;text-align:center;'>
    <h1 style='color:#d4af37;margin:0;font-size:24px;'>CINEMA67</h1>
    <p style='color:#f0e8e0;margin:6px 0 0;font-size:14px;'>Show Annullato</p>
  </div>
  <div style='padding:24px;'>
    <p style='font-size:14px;margin:0 0 12px;'>Ciao {ordine.User!.Nome},</p>
    <p style='font-size:14px;margin:0 0 12px;'>Lo show <strong>{cancellation.Show?.Film?.Titolo}</strong> previsto per il {cancellation.Show?.StartAtUtc:dd/MM/yyyy HH:mm} è stato annullato.</p>
    <p style='font-size:14px;margin:0 0 12px;'>L'importo di <strong style='color:#d4af37;'>€{ordine.TotaleLordo:F2}</strong> ti verrà rimborsato automaticamente sullo stesso metodo di pagamento.</p>
    <p style='font-size:13px;color:#a89888;'>Ordine: {ordine.CodiceOrdine} · {ordine.NumeroBiglietti} biglietti</p>
  </div>
</div>";
            try { await _emailService.SendHtmlEmailAsync(email, "Show annullato — " + cancellation.Show?.Film?.Titolo, html); } catch { }
        }

        cancellation.EmailsInviate = true;
        cancellation.EmailsInviateIl = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
