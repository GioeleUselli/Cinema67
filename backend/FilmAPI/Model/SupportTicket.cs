using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class SupportTicket
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(40)]
    public string Code { get; set; } = string.Empty;

    [Required]
    public int ConversationId { get; set; }

    [ForeignKey(nameof(ConversationId))]
    public SupportConversation? Conversation { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    [MaxLength(180)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(5000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;

    [Required]
    public SupportTicketPriority Priority { get; set; } = SupportTicketPriority.Medium;

    [MaxLength(200)]
    public string? ContextPage { get; set; }

    [MaxLength(120)]
    public string? ContextOrderCode { get; set; }

    [MaxLength(2000)]
    public string? ContextMetadata { get; set; }

    [MaxLength(1500)]
    public string? AdminResolutionNote { get; set; }

    public int? AssignedAdminUserId { get; set; }

    [ForeignKey(nameof(AssignedAdminUserId))]
    public User? AssignedAdminUser { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? ResolvedAtUtc { get; set; }

    public ICollection<SupportTicketAudit> Audits { get; set; } = new List<SupportTicketAudit>();
}
