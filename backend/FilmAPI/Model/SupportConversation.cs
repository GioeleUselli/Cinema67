using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class SupportConversation
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    public SupportConversationStatus Status { get; set; } = SupportConversationStatus.Open;

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<SupportMessage> Messages { get; set; } = new List<SupportMessage>();
    public ICollection<SupportTicket> Tickets { get; set; } = new List<SupportTicket>();
}
