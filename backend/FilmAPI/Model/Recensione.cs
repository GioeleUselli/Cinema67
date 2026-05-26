using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FilmAPI.Model;

public class Recensione
{
    [Key]
    public int Id { get; set; }

    public int FilmId { get; set; }

    [ForeignKey(nameof(FilmId))]
    public Film? Film { get; set; }

    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Range(1, 10)]
    public int Voto { get; set; }

    [MaxLength(2000)]
    public string Testo { get; set; } = "";

    [MaxLength(20)]
    public string Stato { get; set; } = "InAttesa";

    public DateTime CreatedAtUtc { get; set; }

    public int? ApprovataDaUserId { get; set; }

    [ForeignKey(nameof(ApprovataDaUserId))]
    public User? ApprovataDa { get; set; }

    public DateTime? ApprovataIl { get; set; }
}
