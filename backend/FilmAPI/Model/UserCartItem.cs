using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class UserCartItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    public int MerchItemId { get; set; }

    [ForeignKey(nameof(MerchItemId))]
    public MerchItem? MerchItem { get; set; }

    [Required]
    public int Quantita { get; set; } = 1;

    public int? VariantId { get; set; }
}
