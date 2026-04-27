using System.ComponentModel.DataAnnotations;

namespace FilmAPI.DTO;

public class SupportChatMessageRequestDTO
{
    [Required]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ContextPage { get; set; }

    [MaxLength(120)]
    public string? ContextOrderCode { get; set; }
}

public class SupportEscalateRequestDTO
{
    [Required]
    [MaxLength(180)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Priority { get; set; }

    [MaxLength(200)]
    public string? ContextPage { get; set; }

    [MaxLength(120)]
    public string? ContextOrderCode { get; set; }

    [MaxLength(2000)]
    public string? ContextMetadata { get; set; }
}

public class SupportAdminUpdateTicketRequestDTO
{
    [MaxLength(30)]
    public string? Status { get; set; }

    [MaxLength(1500)]
    public string? AdminResolutionNote { get; set; }

    public int? AssignedAdminUserId { get; set; }
}

public class SupportConversationDTO
{
    public int ConversationId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime UpdatedAtUtc { get; set; }
    public List<SupportMessageDTO> Messages { get; set; } = new();
    public List<SupportTicketListItemDTO> Tickets { get; set; } = new();
}

public class SupportMessageDTO
{
    public int Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class SupportChatResponseDTO
{
    public SupportConversationDTO Conversation { get; set; } = new();
    public bool ShouldEscalate { get; set; }
    public List<string> SuggestedActions { get; set; } = new();
}

public class SupportTicketListItemDTO
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? AssignedAdminEmail { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}

public class SupportTicketDetailDTO
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public int? AssignedAdminUserId { get; set; }
    public string? AssignedAdminEmail { get; set; }
    public string? ContextPage { get; set; }
    public string? ContextOrderCode { get; set; }
    public string? ContextMetadata { get; set; }
    public string? AdminResolutionNote { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }
    public List<SupportMessageDTO> ConversationMessages { get; set; } = new();
    public List<SupportTicketAuditDTO> AuditTrail { get; set; } = new();
}

public class SupportTicketAuditDTO
{
    public int Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int? ActorUserId { get; set; }
    public string? ActorEmail { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
