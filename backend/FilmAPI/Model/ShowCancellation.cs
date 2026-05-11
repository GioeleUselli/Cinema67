using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public enum ShowState { Scheduled = 0, Cancelled = 1, Completed = 2 }
public enum CancellationStatus { Pending = 0, Processing = 1, Completed = 2, Failed = 3 }
public enum RefundStatus { Pending = 0, Processing = 1, Completed = 2, Failed = 3, Partial = 4 }
public enum ManualReviewReason { ValidatedTickets = 0, StartedShow = 1, StripeFailure = 2, MissingPaymentData = 3 }
public enum ManualReviewResolution { RefundFullSameMethod = 0, NoRefund = 1, Defer = 2 }

public class ShowCancellation
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ShowId { get; set; }

    [ForeignKey(nameof(ShowId))]
    public Show? Show { get; set; }

    [Required]
    public int CancelledByUserId { get; set; }

    [ForeignKey(nameof(CancelledByUserId))]
    public User? CancelledByUser { get; set; }

    [Required]
    public DateTime CancelledAtUtc { get; set; }

    [MaxLength(1000)]
    public string? Reason { get; set; }

    [Required]
    public CancellationStatus Status { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal TotaleDaRimborsare { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal TotaleCarta { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal TotaleCredito { get; set; }

    public int OrdiniTotali { get; set; }
    public int BigliettiTotali { get; set; }
    public int RimborsiRiusciti { get; set; }
    public int RimborsiFalliti { get; set; }
    public int ManualReviewCount { get; set; }

    public bool EmailsInviate { get; set; }
    public DateTime? EmailsInviateIl { get; set; }

    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }
}

public class OrdineRefund
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int OrdineId { get; set; }

    [ForeignKey(nameof(OrdineId))]
    public Ordine? Ordine { get; set; }

    [Required]
    public int ShowCancellationId { get; set; }

    [ForeignKey(nameof(ShowCancellationId))]
    public ShowCancellation? ShowCancellation { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal ImportoCarta { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal ImportoCredito { get; set; }

    public string? StripeRefundId { get; set; }

    [MaxLength(50)]
    public string? StripeRefundStatus { get; set; }

    public int? CreditRefundMovementId { get; set; }

    [Required]
    public RefundStatus Status { get; set; }

    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }

    public DateTime? CompletedAtUtc { get; set; }
}

public class ManualRefundReview
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int OrdineId { get; set; }

    [ForeignKey(nameof(OrdineId))]
    public Ordine? Ordine { get; set; }

    [Required]
    public int ShowCancellationId { get; set; }

    [ForeignKey(nameof(ShowCancellationId))]
    public ShowCancellation? ShowCancellation { get; set; }

    [Required]
    public ManualReviewReason ReasonCode { get; set; }

    [Required][Column(TypeName = "decimal(10,2)")]
    public decimal Importo { get; set; }

    public ManualReviewResolution? Resolution { get; set; }

    [MaxLength(1000)]
    public string? ResolutionNotes { get; set; }

    public int? ResolvedByUserId { get; set; }

    [ForeignKey(nameof(ResolvedByUserId))]
    public User? ResolvedByUser { get; set; }

    public DateTime? ResolvedAtUtc { get; set; }

    [MaxLength(1000)]
    public string? Details { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }
}
