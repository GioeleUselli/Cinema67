using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class PartyFeedback
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PartyBookingId { get; set; }

    [ForeignKey(nameof(PartyBookingId))]
    public PartyBooking? PartyBooking { get; set; }

    [Required]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; }
}
