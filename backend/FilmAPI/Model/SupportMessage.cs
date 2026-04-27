using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class SupportMessage
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ConversationId { get; set; }

    [ForeignKey(nameof(ConversationId))]
    public SupportConversation? Conversation { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    public SupportMessageRole Role { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
