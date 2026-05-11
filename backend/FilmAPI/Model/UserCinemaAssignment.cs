using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class UserCinemaAssignment
{
    [Key] public int Id { get; set; }
    [Required] public int UserId { get; set; }
    [ForeignKey(nameof(UserId))] public User? User { get; set; }
    [Required] public int CinemaId { get; set; }
    [ForeignKey(nameof(CinemaId))] public Cinema? Cinema { get; set; }
    public bool CanValidateTickets { get; set; }
    public bool CanTopUpCredit { get; set; }
    public bool CanManageShows { get; set; }
    public bool IsActive { get; set; } = true;
    public int? CreatedByUserId { get; set; }
    [ForeignKey(nameof(CreatedByUserId))] public User? CreatedByUser { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    [MaxLength(500)] public string? Notes { get; set; }
}
