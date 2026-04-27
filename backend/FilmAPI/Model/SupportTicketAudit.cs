using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class SupportTicketAudit
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TicketId { get; set; }

    [ForeignKey(nameof(TicketId))]
    public SupportTicket? Ticket { get; set; }

    public int? ActorUserId { get; set; }

    [ForeignKey(nameof(ActorUserId))]
    public User? ActorUser { get; set; }

    [Required]
    [MaxLength(60)]
    public string EventType { get; set; } = string.Empty;

    [Required]
    [MaxLength(1200)]
    public string Message { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
